import 'dotenv/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Prisma } from '@prisma/client';
import { Long, MongoClient } from 'mongodb';
import policy from '../src/database/legacy-policy.json' with { type: 'json' };
import checks from '../prisma/mongodb-validators.json' with { type: 'json' };

export const schemaPath = new URL('../prisma/schema.prisma', import.meta.url);
export const scalarFields = (model) => model.fields.filter((field) => field.kind !== 'object');
export const dbField = (field) => field.dbName ?? field.name;
const types = {
  String: 'string',
  Int: ['int', 'long', 'double'],
  BigInt: 'long',
  Float: ['double', 'int', 'long'],
  Boolean: 'bool',
  DateTime: 'date',
  Bytes: 'binData',
};
function fieldSchema(model, field) {
  const type = field.kind === 'enum' ? 'string' : types[field.type];
  let shape = type ? { bsonType: Array.isArray(type) ? [...type] : [type] } : {};
  if (field.kind === 'enum')
    shape.enum = Prisma.dmmf.datamodel.enums
      .find((item) => item.name === field.type)
      .values.map((item) => item.name);
  const maxLength = policy[model.name]?.lengths[field.name];
  if (maxLength) shape.maxLength = maxLength;
  if (field.type === 'Int')
    Object.assign(shape, { minimum: -2147483648, maximum: 2147483647, multipleOf: 1 });
  if (field.isList) shape = { bsonType: 'array', items: shape };
  if (!field.isRequired) {
    if (shape.bsonType)
      shape.bsonType = [
        ...(Array.isArray(shape.bsonType) ? shape.bsonType : [shape.bsonType]),
        'null',
      ];
    if (shape.enum) shape.enum.push(null);
  }
  return shape;
}
export async function applyMongoSchema(database) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  for (const model of Prisma.dmmf.datamodel.models) {
    const table = model.dbName ?? model.name;
    const fields = scalarFields(model);
    const expressions = checks[table]?.map((check) => check.expression) ?? [];
    const validator = {
      $and: [
        {
          $jsonSchema: {
            bsonType: 'object',
            required: fields.filter((field) => field.isRequired).map(dbField),
            properties: Object.fromEntries(
              fields.map((field) => [dbField(field), fieldSchema(model, field)]),
            ),
          },
        },
        ...(expressions.length ? [{ $expr: { $and: expressions } }] : []),
      ],
    };
    if (!(await database.listCollections({ name: table }, { nameOnly: true }).hasNext()))
      await database.createCollection(table, {
        validator,
        validationLevel: 'strict',
        validationAction: 'error',
      });
    else
      await database.command({
        collMod: table,
        validator,
        validationLevel: 'strict',
        validationAction: 'error',
      });
    // Safe additive defaults for existing documents after a schema change.
    // No field with an existing value is overwritten.
    const defaults = fields.filter(
      (field) =>
        field.hasDefaultValue && typeof field.default !== 'object' && field.type !== 'Json',
    );
    if (defaults.length)
      await database
        .collection(table)
        .updateMany({ $or: defaults.map((field) => ({ [dbField(field)]: { $exists: false } })) }, [
          {
            $set: Object.fromEntries(
              defaults.map((field) => [
                dbField(field),
                {
                  $cond: [
                    { $eq: [{ $type: `$${dbField(field)}` }, 'missing'] },
                    {
                      $literal:
                        field.type === 'BigInt'
                          ? Long.fromString(String(field.default))
                          : field.default,
                    },
                    `$${dbField(field)}`,
                  ],
                },
              ]),
            ),
          },
        ]);
    const indexes = [];
    for (const field of fields.filter((field) => field.isUnique))
      indexes.push({ fields: [field.name], unique: true });
    for (const index of model.uniqueIndexes) indexes.push({ fields: index.fields, unique: true });
    const block =
      schema.match(new RegExp(`^model ${model.name} \\{([\\s\\S]*?)^\\}`, 'm'))?.[1] ?? '';
    for (const match of block.matchAll(/@@index\(\[([^\]]+)\]/g))
      indexes.push({ fields: match[1].split(',').map((field) => field.trim()), unique: false });
    for (const relation of model.fields.filter(
      (field) => field.kind === 'object' && field.relationFromFields?.length,
    ))
      indexes.push({ fields: relation.relationFromFields, unique: false });
    for (const index of indexes) {
      const names = index.fields.map((name) => name.replace(/\(.*/, '').trim());
      const columns = names.map((name) => fields.find((field) => field.name === name));
      if (columns.some((field) => !field)) throw new Error(`Unknown index field in ${model.name}`);
      const key = Object.fromEntries(
        columns.map((field, i) => [dbField(field), /sort:\s*Desc/.test(index.fields[i]) ? -1 : 1]),
      );
      if (Object.keys(key).length === 1 && key._id) continue;
      const nullable = index.unique ? columns.filter((field) => !field.isRequired) : [];
      const filter = Object.fromEntries(
        nullable.map((field) => [dbField(field), { $type: types[field.type] ?? 'string' }]),
      );
      await database
        .collection(table)
        .createIndex(key, {
          name: `mongo_${Object.keys(key).join('_')}_${index.unique ? 'key' : 'idx'}`,
          ...(index.unique ? { unique: true } : {}),
          ...(nullable.length ? { partialFilterExpression: filter } : {}),
        });
    }
  }
  const special = [
    ['categories', { type: 1, slug: 1 }, { parent_id: null }, 'categories_root_type_slug_key'],
    [
      'categories',
      { type: 1, parent_id: 1, slug: 1 },
      { parent_id: { $type: 'string' } },
      'categories_child_type_parent_id_slug_key',
    ],
    ['storage_policies', { is_default: 1 }, { is_default: true }, 'storage_policies_one_default'],
    [
      'contributor_applications',
      { user_id: 1 },
      { status: 'PENDING' },
      'contributor_applications_one_pending_per_user',
    ],
    [
      'ai_verifications',
      { artifact_id: 1 },
      { status: 'ACTIVE' },
      'ai_verifications_one_active_per_artifact',
    ],
  ];
  for (const [table, key, partialFilterExpression, name] of special)
    await database
      .collection(table)
      .createIndex(key, { name, unique: true, partialFilterExpression });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith('mongodb')) throw new Error('DATABASE_URL must use MongoDB');
  const client = new MongoClient(url);
  try {
    await client.connect();
    const hello = await client.db('admin').command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid')
      throw new Error('MongoDB replica set or sharded cluster required');
    await applyMongoSchema(client.db());
    console.info(
      `MongoDB schema applied: ${Prisma.dmmf.datamodel.models.length} collections, reviewed validators and indexes.`,
    );
  } finally {
    await client.close();
  }
}
