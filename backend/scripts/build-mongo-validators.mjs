import fs from 'node:fs';
import { Prisma } from '@prisma/client';
import policy from '../src/database/legacy-policy.json' with { type: 'json' };
const checks = JSON.parse(
  fs.readFileSync(new URL('../prisma/legacy-postgresql/checks.json', import.meta.url), 'utf8'),
);
// Deliberately small, fail-closed SQL expression compiler for the reviewed legacy
// CHECK inventory. It preserves PostgreSQL's three-valued CHECK semantics.
function compile(sql, model) {
  const tokens = sql
    .replace(/^CHECK\s*/i, '')
    .match(
      /'(?:''|[^'])*'|"(?:""|[^"])*"|::|>=|<=|<>|!=|\|\||[A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|[()[\],+*/~<>=-]/g,
    );
  let pos = 0;
  const peek = () => tokens[pos]?.toUpperCase();
  const pop = () => tokens[pos++];
  const need = (value) => {
    if (peek() !== value) throw new Error(`Expected ${value} in ${sql}`);
    pop();
  };
  const nullable = (op, a, b) => ({
    $let: {
      vars: { a, b },
      in: {
        $cond: [
          { $or: [{ $eq: ['$$a', null] }, { $eq: ['$$b', null] }] },
          null,
          { [op]: ['$$a', '$$b'] },
        ],
      },
    },
  });
  const boolean = (op, a, b) => ({
    $let: {
      vars: { a, b },
      in: {
        $cond: [
          { $or: [{ $eq: ['$$a', op === 'OR'] }, { $eq: ['$$b', op === 'OR'] }] },
          op === 'OR',
          {
            $cond: [{ $or: [{ $eq: ['$$a', null] }, { $eq: ['$$b', null] }] }, null, op === 'AND'],
          },
        ],
      },
    },
  });
  function primary() {
    let value;
    if (peek() === 'NOT') {
      pop();
      const child = expression(3);
      value = { $cond: [{ $eq: [child, null] }, null, { $not: [child] }] };
    } else if (peek() === '-') {
      pop();
      value = { $multiply: [-1, primary()] };
    } else if (peek() === '(') {
      pop();
      value = expression(0);
      need(')');
    } else if (peek() === 'ARRAY') {
      pop();
      need('[');
      value = [];
      while (peek() !== ']') {
        value.push(expression(0));
        if (peek() !== ',') break;
        pop();
      }
      need(']');
    } else {
      const token = pop();
      if (!token) throw new Error(`Unexpected end: ${sql}`);
      if (token.startsWith("'")) value = token.slice(1, -1).replaceAll("''", "'");
      else if (/^\d/.test(token)) value = Number(token);
      else if (token.toUpperCase() === 'NULL') value = null;
      else if (['TRUE', 'FALSE'].includes(token.toUpperCase()))
        value = token.toUpperCase() === 'TRUE';
      else if (peek() === '(') {
        pop();
        if (token.toUpperCase() === 'EXTRACT') {
          need('ISODOW');
          need('FROM');
          const date = expression(0);
          need(')');
          return { $isoDayOfWeek: { date, timezone: 'UTC' } };
        }
        const args = [];
        while (peek() !== ')') {
          args.push(expression(0));
          if (peek() !== ',') break;
          pop();
        }
        need(')');
        const call = token.toLowerCase();
        if (call === 'any') value = { any: args[0] };
        else if (call === 'jsonb_typeof') value = { $type: args[0] };
        else if (call === 'length' || call === 'btrim')
          value = {
            $let: {
              vars: { input: args[0] },
              in: {
                $cond: [
                  { $eq: ['$$input', null] },
                  null,
                  call === 'length'
                    ? { $strLenCP: { $ifNull: ['$$input', ''] } }
                    : { $trim: { input: { $ifNull: ['$$input', ''] } } },
                ],
              },
            },
          };
        else throw new Error(`Unsupported SQL function ${call}: ${sql}`);
      } else {
        const column = token.replaceAll('"', '');
        const field = model.fields.find(
          (item) =>
            item.name === column ||
            item.dbName === column ||
            (item.isId && column === 'id') ||
            (item.isId && item.name === 'userId' && column === 'user_id'),
        );
        if (!field) throw new Error(`Unknown field ${model.name}.${column}`);
        value = { $ifNull: [`$${field.dbName ?? field.name}`, null] };
        const decimal = policy[model.name]?.decimals[field.name];
        if (decimal) value = { $round: [{ $toDecimal: value }, decimal.scale] };
      }
    }
    while (peek() === '::') {
      pop();
      pop();
    }
    return value;
  }
  const precedence = {
    OR: 1,
    AND: 2,
    '=': 3,
    '<>': 3,
    '!=': 3,
    '<': 3,
    '>': 3,
    '<=': 3,
    '>=': 3,
    '~': 3,
    IS: 3,
    '||': 4,
    '+': 5,
    '-': 5,
    '*': 6,
    '/': 6,
  };
  function expression(min) {
    let left = primary();
    while ((precedence[peek()] ?? -1) >= min) {
      const op = pop().toUpperCase();
      if (op === 'IS') {
        const negated = peek() === 'NOT';
        if (negated) pop();
        need('NULL');
        left = { [negated ? '$ne' : '$eq']: [left, null] };
        continue;
      }
      const right = expression(precedence[op] + 1);
      if (op === 'AND' || op === 'OR') left = boolean(op, left, right);
      else if (right && typeof right === 'object' && 'any' in right) {
        if (op !== '=') throw new Error(`Unsupported ANY operation ${op}`);
        left = { $cond: [{ $eq: [left, null] }, null, { $in: [left, right.any] }] };
      } else if (op === '~')
        left = {
          $cond: [
            { $eq: [left, null] },
            null,
            { $regexMatch: { input: { $ifNull: [left, ''] }, regex: right } },
          ],
        };
      else {
        const operators = {
          '=': '$eq',
          '<>': '$ne',
          '!=': '$ne',
          '>': '$gt',
          '<': '$lt',
          '>=': '$gte',
          '<=': '$lte',
          '+': '$add',
          '-': '$subtract',
          '*': '$multiply',
          '/': '$divide',
          '||': '$concat',
        };
        left = nullable(operators[op], left, right);
      }
    }
    return left;
  }
  const value = expression(0);
  if (pos !== tokens.length) throw new Error(`Unconsumed SQL near ${tokens.slice(pos).join(' ')}`);
  return { $ne: [value, false] };
}
const result = {};
for (const check of checks) {
  const model = Prisma.dmmf.datamodel.models.find((item) => item.dbName === check.table);
  if (!model) throw new Error(`No model for ${check.table}`);
  (result[check.table] ??= []).push({
    name: check.name,
    expression: compile(check.definition, model),
  });
}
fs.writeFileSync(
  new URL('../prisma/mongodb-validators.json', import.meta.url),
  '{\n' +
    Object.entries(result)
      .map(
        ([table, entries]) =>
          `  ${JSON.stringify(table)}: [\n${entries.map((entry) => `    ${JSON.stringify(entry)}`).join(',\n')}\n  ]`,
      )
      .join(',\n') +
    '\n}\n',
);
console.info(
  `Compiled ${checks.length} legacy CHECK constraints for ${Object.keys(result).length} collections.`,
);
