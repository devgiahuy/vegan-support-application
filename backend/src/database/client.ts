import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import legacyPolicy from './legacy-policy.json' with { type: 'json' };
import { dispatchNotifications } from '../modules/notifications/notification-events.js';

type Row = Record<string, unknown>;
type Delegate = Record<string, (args: Row) => Promise<unknown>>;
type Model = (typeof Prisma.dmmf.datamodel.models)[number];
const models = Prisma.dmmf.datamodel.models;
const eventModels = new Set([
  'PostRevision',
  'ContributorDecision',
  'Report',
  'AiVerification',
  'Restaurant',
  'StorageAccount',
  'ModerationAction',
]);
const mutations = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);
const policies = legacyPolicy as Record<
  string,
  {
    relations: Record<string, string>;
    decimals: Record<string, { precision: number; scale: number }>;
    lengths: Record<string, number>;
    dates: string[];
  }
>;

const delegateName = (name: string) => name[0]!.toLowerCase() + name.slice(1);
function delegate(client: Prisma.TransactionClient, model: Model): Delegate {
  return Reflect.get(client, delegateName(model.name)) as Delegate;
}
function object(value: unknown): Row | null {
  return value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)
    ? (value as Row)
    : null;
}
function list(value: unknown): Row[] {
  return (Array.isArray(value) ? value : [value]).flatMap((item) =>
    object(item) ? [item as Row] : [],
  );
}

async function touchReference(
  tx: Prisma.TransactionClient,
  model: Model,
  where: Row,
): Promise<boolean> {
  const row = (await delegate(tx, model).findFirst!({ where })) as Row | null;
  if (!row) return false;
  const timestamps = Object.fromEntries(
    model.fields.filter((field) => field.isUpdatedAt).map((field) => [field.name, row[field.name]]),
  );
  const result = (await delegate(tx, model).updateMany!({
    where,
    data: { referenceVersion: { increment: 1 }, ...timestamps },
  })) as { count: number };
  return result.count === 1;
}

/** Materialize nullable fields so SQL-style null filters retain their meaning in MongoDB. */
function normalizeData(model: Model, value: unknown, creating: boolean): void {
  for (const data of list(value)) {
    const foreignKeyFields = new Set(
      model.fields.flatMap((field) => field.relationFromFields ?? []),
    );
    for (const field of model.fields) {
      if (!creating && field.isId) {
        delete data[field.name];
        continue;
      }
      if (field.kind === 'object') {
        const relation = object(data[field.name]);
        const related = models.find((item) => item.name === field.type);
        if (!relation || !related) continue;
        if (relation.create) normalizeData(related, relation.create, true);
        const many = object(relation.createMany);
        if (many) normalizeData(related, many.data, true);
        for (const operation of list(relation.connectOrCreate))
          normalizeData(related, operation.create, true);
        for (const operation of list(relation.upsert)) {
          normalizeData(related, operation.create, true);
          normalizeData(related, operation.update, false);
        }
        for (const operation of list(relation.update))
          normalizeData(related, operation.data ?? operation, false);
        continue;
      }
      if (
        creating &&
        !field.isRequired &&
        !field.hasDefaultValue &&
        data[field.name] === undefined &&
        !foreignKeyFields.has(field.name)
      )
        data[field.name] = null;
      if (
        policies[model.name]?.dates.includes(field.name) &&
        data[field.name] != null &&
        !object(data[field.name])
      ) {
        const date = new Date(
          String(
            data[field.name] instanceof Date
              ? (data[field.name] as Date).toISOString()
              : data[field.name],
          ),
        );
        data[field.name] = new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
      }
      const decimal = policies[model.name]?.decimals[field.name];
      const operations = object(data[field.name]);
      const key = operations && 'set' in operations ? 'set' : null;
      const scalar = key ? operations![key] : data[field.name];
      if (
        decimal &&
        (typeof scalar === 'string' || typeof scalar === 'number' || typeof scalar === 'bigint')
      ) {
        const rounded = new Prisma.Decimal(String(scalar)).toDecimalPlaces(decimal.scale);
        if (
          !rounded.isFinite() ||
          rounded.abs().gte(new Prisma.Decimal(10).pow(decimal.precision - decimal.scale))
        )
          throw new Error(`Numeric value out of range: ${model.name}.${field.name}`);
        if (key) operations![key] = rounded.toNumber();
        else data[field.name] = rounded.toNumber();
      }
      const maxLength = policies[model.name]?.lengths[field.name];
      if (maxLength && typeof scalar === 'string' && [...scalar].length > maxLength)
        throw new Error(`String value too long: ${model.name}.${field.name}`);
    }
  }
}

/** Checked nested creates cannot accept scalar foreign keys. Backfill absent nullable keys in
 * the same transaction so subsequent Mongo null predicates still behave like SQL. */
async function materializeNullableReferences(
  tx: Prisma.TransactionClient,
  model: Model,
  ids: string[],
  data: unknown,
): Promise<void> {
  if (!ids.length) return;
  const nullableKeys = model.fields.filter(
    (field) =>
      !field.isRequired &&
      model.fields.some((relation) => relation.relationFromFields?.includes(field.name)),
  );
  if (nullableKeys.length) {
    const result = await tx.$runCommandRaw({
      update: model.dbName ?? model.name,
      updates: [
        {
          q: { _id: { $in: ids } },
          u: [
            {
              $set: Object.fromEntries(
                nullableKeys.map((field) => [
                  field.dbName ?? field.name,
                  { $ifNull: [`$${field.dbName ?? field.name}`, null] },
                ]),
              ),
            },
          ],
          multi: true,
        },
      ],
    });
    if (result.ok !== 1 || (Array.isArray(result.writeErrors) && result.writeErrors.length))
      throw new Error(`Unable to materialize nullable references for ${model.name}`);
  }
  for (const input of list(data)) {
    for (const relation of model.fields.filter((field) => field.kind === 'object')) {
      const operation = object(input[relation.name]);
      if (
        !operation ||
        !(list(operation.create).length || object(operation.createMany) || operation.upsert)
      )
        continue;
      const child = models.find((item) => item.name === relation.type);
      const backReference = child?.fields.find(
        (field) => field.relationName === relation.relationName && field.relationFromFields?.length,
      );
      if (!child || !backReference || relation.relationFromFields?.length) continue;
      const childId = child.fields.find((field) => field.isId)!.name;
      const children = list(
        await delegate(tx, child).findMany!({
          where: { [backReference.relationFromFields![0]!]: { in: ids } },
          select: { [childId]: true },
        }),
      );
      const nestedData = [
        ...list(operation.create),
        ...list(object(operation.createMany)?.data),
        ...list(operation.upsert).flatMap((item) => [item.create, item.update]),
      ];
      await materializeNullableReferences(
        tx,
        child,
        children.map((row) => String(row[childId])),
        nestedData,
      );
    }
  }
}

async function validateReferences(
  tx: Prisma.TransactionClient,
  model: Model,
  value: unknown,
  nestedWrites = false,
): Promise<void> {
  for (const data of list(value)) {
    for (const relation of model.fields.filter(
      (field) => field.kind === 'object' && field.relationFromFields?.length,
    )) {
      const fields = relation.relationFromFields!;
      const reference = (field: string) => {
        const value = object(data[field]);
        return value && 'set' in value ? value.set : data[field];
      };
      if (fields.some((field) => reference(field) === undefined || reference(field) === null))
        continue;
      const target = models.find((item) => item.name === relation.type)!;
      const where = Object.fromEntries(
        fields.map((field, index) => [relation.relationToFields![index]!, reference(field)]),
      );
      // A real write also serializes reference creation against concurrent target deletion.
      if (!(await touchReference(tx, target, where))) {
        throw new Prisma.PrismaClientKnownRequestError(
          `Missing reference: ${model.name}.${relation.name}`,
          {
            code: 'P2003',
            clientVersion: Prisma.prismaVersion.client,
            meta: { field_name: fields.join(',') },
          },
        );
      }
    }
    if (!nestedWrites) continue;
    for (const relation of model.fields.filter((field) => field.kind === 'object')) {
      const nested = object(data[relation.name]);
      const child = models.find((item) => item.name === relation.type);
      if (!nested || !child) continue;
      for (const connection of list(nested.connect)) {
        const connected = (await delegate(tx, child).findUnique!({
          where: connection,
        })) as Row | null;
        if (!connected)
          throw new Prisma.PrismaClientKnownRequestError('Missing nested reference', {
            code: 'P2003',
            clientVersion: Prisma.prismaVersion.client,
          });
        const childId = child.fields.find((field) => field.isId)!.name;
        await touchReference(tx, child, { [childId]: connected[childId] });
      }
      for (const operation of ['create', 'update', 'upsert', 'connectOrCreate']) {
        for (const item of list(nested[operation])) {
          await validateReferences(
            tx,
            child,
            operation === 'upsert'
              ? [item.create, item.update]
              : operation === 'connectOrCreate'
                ? item.create
                : (item.data ?? item),
            true,
          );
        }
      }
      await validateReferences(tx, child, object(nested.createMany)?.data, true);
    }
  }
}

async function deleteWithRelations(
  tx: Prisma.TransactionClient,
  model: Model,
  rows: Row[],
): Promise<void> {
  const plan = new Map<string, { model: Model; row: Row }>();
  const keyOf = (m: Model, row: Row) =>
    `${m.name}:${String(row[m.fields.find((field) => field.isId)!.name])}`;
  const references = (target: Model) =>
    models.flatMap((child) =>
      child.fields
        .filter(
          (field) =>
            field.kind === 'object' &&
            field.type === target.name &&
            field.relationFromFields?.length,
        )
        .map((relation) => ({
          child,
          relation,
          action: policies[child.name]?.relations[relation.name] ?? 'Restrict',
        })),
    );
  const referenceWhere = (relation: Model['fields'][number], row: Row) =>
    Object.fromEntries(
      relation.relationFromFields!.map((field, index) => [
        field,
        row[relation.relationToFields![index]!],
      ]),
    );
  async function collect(target: Model, row: Row): Promise<void> {
    const key = keyOf(target, row);
    if (plan.has(key)) return;
    plan.set(key, { model: target, row });
    for (const { child, relation, action } of references(target)) {
      if (action !== 'Cascade') continue;
      for (const dependent of list(
        await delegate(tx, child).findMany!({ where: referenceWhere(relation, row) }),
      ))
        await collect(child, dependent);
    }
  }
  for (const row of rows) await collect(model, row);
  for (const { model: target, row } of plan.values()) {
    for (const { child, relation, action } of references(target)) {
      const where = referenceWhere(relation, row);
      const dependents = list(await delegate(tx, child).findMany!({ where }));
      if (
        action === 'Restrict' &&
        dependents.some((dependent) => !plan.has(keyOf(child, dependent)))
      )
        throw new Prisma.PrismaClientKnownRequestError(
          `Restricted deletion: ${child.name}.${relation.name}`,
          {
            code: 'P2003',
            clientVersion: Prisma.prismaVersion.client,
          },
        );
      if (action === 'SetNull') {
        const survivors = dependents.filter((dependent) => !plan.has(keyOf(child, dependent)));
        if (survivors.length) {
          const id = child.fields.find((field) => field.isId)!.name;
          await delegate(tx, child).updateMany!({
            where: { [id]: { in: survivors.map((dependent) => dependent[id]) } },
            data: Object.fromEntries(relation.relationFromFields!.map((field) => [field, null])),
          });
        }
      }
    }
  }
  for (const { model: target, row } of [...plan.values()].reverse()) {
    const id = target.fields.find((field) => field.isId)!.name;
    // The complete deletion graph is validated above. Native deletion avoids
    // Prisma's NoAction emulation rejecting cycles or multiple cascade paths.
    const deleted = await tx.$runCommandRaw({
      delete: target.dbName ?? target.name,
      deletes: [{ q: { _id: row[id] as string }, limit: 1 }],
    });
    if (deleted.ok !== 1 || deleted.writeErrors || deleted.n !== 1)
      throw new Error(`Native deletion failed for ${target.name}`);
  }
}

function wrapTransaction(tx: Prisma.TransactionClient): Prisma.TransactionClient {
  return new Proxy(tx, {
    get(target, property, receiver) {
      const model = models.find((item) => delegateName(item.name) === property);
      if (!model) {
        const value: unknown = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? (value.bind(target) as unknown) : value;
      }
      const raw = delegate(target, model);
      return new Proxy(raw, {
        get(_delegate, operation: string) {
          if (!mutations.has(operation)) return raw[operation]?.bind(raw);
          return async (input: Row) => {
            const args = { ...input };
            const idField = model.fields.find((field) => field.isId)!.name;
            const requestedId = object(operation === 'upsert' ? args.update : args.data)?.[idField];
            const creating = operation === 'create' || operation === 'createMany';
            if (creating || operation.startsWith('update'))
              normalizeData(model, args.data, creating);
            if (operation === 'upsert') {
              normalizeData(model, args.create, true);
              normalizeData(model, args.update, false);
            }
            if (operation === 'createMany') {
              if (!list(args.data).length) return { count: 0 };
              for (const row of list(args.data)) await validateReferences(tx, model, row);
              const rows = list(args.data);
              // createMany always takes scalar (unchecked) inputs, so nullable FK keys are safe here.
              for (const row of rows) {
                for (const field of model.fields) {
                  if (
                    !field.isRequired &&
                    model.fields.some((relation) =>
                      relation.relationFromFields?.includes(field.name),
                    )
                  ) {
                    row[field.name] ??= null;
                  }
                }
              }
              if (eventModels.has(model.name)) {
                for (const row of rows) row[idField] ??= randomUUID();
              }
              const result = await raw[operation]!(args);
              if (eventModels.has(model.name)) {
                for (const row of list(
                  await raw.findMany!({
                    where: { [idField]: { in: rows.map((item) => item[idField]) } },
                  }),
                ))
                  await dispatchNotifications(wrapTransaction(tx), model.name, null, row);
              }
              return result;
            }
            let previous: Row[] = [];
            if (!creating)
              previous = list(
                await raw[operation.endsWith('Many') ? 'findMany' : 'findUnique']!({
                  where: args.where,
                }),
              );
            if (
              !creating &&
              requestedId !== undefined &&
              previous.some((row) => row[idField] !== requestedId)
            )
              throw new Prisma.PrismaClientKnownRequestError('Document identity is immutable', {
                code: 'P2003',
                clientVersion: Prisma.prismaVersion.client,
              });
            if (operation.startsWith('delete')) {
              if (!previous.length && operation === 'delete') return raw.delete!(args);
              const result =
                operation === 'deleteMany'
                  ? { count: previous.length }
                  : await raw.findUnique!({
                      where: args.where,
                      ...(args.select ? { select: args.select } : {}),
                      ...(args.include ? { include: args.include } : {}),
                    });
              await deleteWithRelations(tx, model, previous);
              return result;
            }
            const data =
              operation === 'upsert' ? (previous.length ? args.update : args.create) : args.data;
            const id = model.fields.find((field) => field.isId)!.name;
            const originalSelect = object(args.select);
            if (originalSelect) args.select = { ...originalSelect, [id]: true };
            const result = await raw[operation]!(args);
            await validateReferences(tx, model, data, true);
            const changedIds =
              operation === 'updateMany'
                ? previous.map((row) => row[id])
                : list(result).map((row) => row[id]);
            await materializeNullableReferences(tx, model, changedIds.map(String), data);
            if (eventModels.has(model.name)) {
              for (const row of list(
                await raw.findMany!({ where: { [id]: { in: changedIds } } }),
              )) {
                await dispatchNotifications(
                  wrapTransaction(tx),
                  model.name,
                  previous.find((old) => old[id] === row[id]) ?? null,
                  row,
                );
              }
            }
            if (originalSelect && !originalSelect[id] && object(result)) delete (result as Row)[id];
            return result;
          };
        },
      });
    },
  });
}

/** All mutation retries stay inside the database boundary; provider calls are never replayed. */
export function createPrismaClient(options?: Prisma.PrismaClientOptions): PrismaClient {
  const client = new PrismaClient(options);
  async function transact(
    callback: (tx: Prisma.TransactionClient) => Promise<unknown>,
    transactionOptions?: { maxWait?: number; timeout?: number },
  ): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await client.$transaction((tx) => callback(wrapTransaction(tx)), {
          maxWait: 10_000,
          timeout: 30_000,
          ...transactionOptions,
        });
      } catch (error) {
        if (
          attempt >= 8 ||
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !['P2034', 'P2002'].includes(error.code)
        )
          throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1_000, 25 * 2 ** attempt) * (0.5 + Math.random())),
        );
      }
    }
  }
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === '$transaction') return transact;
      const model = models.find((item) => delegateName(item.name) === property);
      if (model) {
        const raw = delegate(target, model);
        return new Proxy(raw, {
          get(_delegate, operation: string) {
            return mutations.has(operation)
              ? (args: Row) =>
                  transact(async (tx) => {
                    const wrapped = delegate(tx, model);
                    return wrapped[operation]!(args);
                  })
              : raw[operation]?.bind(raw);
          },
        });
      }
      const value: unknown = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? (value.bind(target) as unknown) : value;
    },
  });
}
