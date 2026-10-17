import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { MongoClient, BSON } from 'mongodb';
import pg from 'pg';
import { applyMongoSchema, scalarFields, dbField, schemaPath } from './mongo-schema.mjs';

const applying = process.argv.includes('--apply');
const resuming = process.argv.includes('--resume');
const sourceUrl =
  process.env.POSTGRES_SOURCE_URL ??
  (process.env.DATABASE_URL?.startsWith('postgres') ? process.env.DATABASE_URL : undefined);
const targetUrl =
  process.env.MONGODB_TARGET_URL ??
  (process.env.DATABASE_URL?.startsWith('mongodb') ? process.env.DATABASE_URL : undefined);
if (!sourceUrl || !targetUrl)
  throw new Error('Set POSTGRES_SOURCE_URL and MONGODB_TARGET_URL; default is read-only dry-run.');
const backupDir = path.resolve(
  process.env.MIGRATION_BACKUP_DIR ??
    `backups/postgres-to-mongo-${new Date().toISOString().replaceAll(':', '-')}`,
);
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
const sourceSchema = fs.readFileSync(
  new URL('../prisma/legacy-postgresql/schema.prisma', import.meta.url),
  'utf8',
);
const models = Prisma.dmmf.datamodel.models;
const sourceModels = new Map(
  [...sourceSchema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map((match) => {
    const body = match[2];
    const fields = new Map(
      [...body.matchAll(/^\s*(\w+)\s+(\w+)(\??|\[\])([^\n]*)/gm)].map((field) => [
        field[1],
        {
          name: field[1],
          type: field[2],
          column: field[4].match(/@map\("([^"]+)"\)/)?.[1] ?? field[1],
          dateOnly: /@db.Date\b/.test(field[4]),
          decimal: /@db.Decimal/.test(field[4]),
        },
      ]),
    );
    const compoundId = body
      .match(/@@id\(\[([^\]]+)\]/)?.[1]
      .split(',')
      .map((field) => field.trim());
    return [
      match[1],
      { table: body.match(/@@map\("([^"]+)"\)/)?.[1] ?? match[1], fields, compoundId },
    ];
  }),
);
const quote = (value) => `"${value.replaceAll('"', '""')}"`;
const stable = (value) => {
  const normalized = BSON.EJSON.serialize(value, { relaxed: false });
  const sort = (item) =>
    Array.isArray(item)
      ? item.map(sort)
      : item && typeof item === 'object'
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, sort(item[key])]),
          )
        : item;
  return JSON.stringify(sort(normalized));
};
function convertRow(model, original, row) {
  const result = {};
  for (const field of scalarFields(model)) {
    const sourceField = original.fields.get(field.name);
    const key = dbField(field);
    if (!sourceField) {
      if (field.isId && original.compoundId) {
        const identity = original.compoundId.map((name) => row[original.fields.get(name).column]);
        result[key] = `legacy-${createHash('sha256').update(stable(identity)).digest('hex')}`;
      } else if (field.hasDefaultValue && typeof field.default !== 'object')
        result[key] = field.default;
      else throw new Error(`No source mapping for ${model.name}.${field.name}`);
      continue;
    }
    if (!(sourceField.column in row))
      throw new Error(`Missing source column ${original.table}.${sourceField.column}`);
    const value = row[sourceField.column];
    if (value === null) {
      result[key] = null;
      continue;
    }
    if (field.type === 'BigInt') result[key] = BSON.Long.fromString(String(value));
    else if (sourceField.decimal) {
      const number = Number(value);
      if (!Number.isFinite(number) || !new Prisma.Decimal(String(number)).equals(String(value)))
        throw new Error(
          `Decimal cannot be preserved as Float: ${original.table}.${sourceField.column}. Source backup retains its exact value.`,
        );
      result[key] = new BSON.Double(number);
    } else if (field.type === 'DateTime')
      result[key] = sourceField.dateOnly ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
    else result[key] = value;
  }
  return result;
}

const source = new pg.Client({ connectionString: sourceUrl, connectionTimeoutMillis: 10_000 });
const target = new MongoClient(targetUrl, {
  serverSelectionTimeoutMS: 10_000,
  promoteValues: false,
});
const manifest = {
  version: 1,
  mode: applying ? 'APPLY' : 'DRY_RUN',
  startedAt: new Date().toISOString(),
  schemaHash: createHash('sha256').update(fs.readFileSync(schemaPath)).digest('hex'),
  collections: [],
  verified: false,
};
let committedSnapshot = false;
try {
  await source.connect();
  await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await source.query("SET TIME ZONE 'UTC'");
  const inventory = (
    await source.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name",
    )
  ).rows.map((row) => row.table_name);
  const expected = new Set([...sourceModels.values()].map((model) => model.table));
  const extra = inventory.filter((table) => table !== '_prisma_migrations' && !expected.has(table));
  if (extra.length) throw new Error(`Unmapped PostgreSQL tables: ${extra.join(', ')}`);
  for (const table of expected)
    if (!inventory.includes(table))
      throw new Error(
        `Missing source table: ${table}. Apply legacy PostgreSQL migrations before export.`,
      );
  if (applying) {
    await target.connect();
    const hello = await target.db('admin').command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid')
      throw new Error('Target requires a MongoDB replica set or sharded cluster');
    const db = target.db();
    const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray();
    const run = await db.collection('_migration_runs').findOne({ _id: 'postgres-to-mongo-v1' });
    if (resuming && (!run || run.schemaHash !== manifest.schemaHash || run.state !== 'IMPORTING'))
      throw new Error('--resume requires this schema and an interrupted IMPORTING run');
    if (!resuming) {
      for (const collection of existingCollections)
        if (await db.collection(collection.name).findOne({}))
          throw new Error('Target must be empty; migration never overwrites existing data.');
      await db
        .collection('_migration_runs')
        .insertOne({
          _id: 'postgres-to-mongo-v1',
          schemaHash: manifest.schemaHash,
          state: 'IMPORTING',
          startedAt: new Date(),
        });
    }
    await applyMongoSchema(db);
  }
  // Export every row from one immutable PostgreSQL snapshot before importing any
  // documents. Source rows (including exact decimals) remain in protected NDJSON.
  for (const model of models) {
    const original = sourceModels.get(model.name);
    const file = path.join(backupDir, `${original.table}.ndjson`);
    const handle = fs.openSync(file, 'wx', 0o600);
    const hash = createHash('sha256');
    let count = 0;
    try {
      const columns = scalarFields(model).flatMap((field) => {
        const mapping = original.fields.get(field.name);
        return mapping
          ? [
              `${quote(mapping.column)}${mapping.dateOnly ? '::text' : ''} AS ${quote(mapping.column)}`,
            ]
          : [];
      });
      const idNames = original.compoundId ?? [scalarFields(model).find((field) => field.isId).name];
      const order = idNames.map((name) => quote(original.fields.get(name).column)).join(', ');
      await source.query(
        `DECLARE migration_rows NO SCROLL CURSOR FOR SELECT ${columns.join(', ')} FROM ${quote(original.table)} ORDER BY ${order}`,
      );
      for (;;) {
        const { rows } = await source.query('FETCH FORWARD 500 FROM migration_rows');
        if (!rows.length) break;
        for (const row of rows) {
          const document = convertRow(model, original, row);
          hash.update(stable(document) + '\n');
          fs.writeSync(
            handle,
            BSON.EJSON.stringify({ source: row, document }, { relaxed: false }) + '\n',
          );
          count++;
        }
      }
      await source.query('CLOSE migration_rows');
    } finally {
      fs.closeSync(handle);
    }
    manifest.collections.push({
      model: model.name,
      collection: original.table,
      count,
      checksum: hash.digest('hex'),
      file: path.basename(file),
    });
  }
  await source.query('COMMIT');
  committedSnapshot = true;
  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    { mode: 0o600 },
  );
  if (applying) {
    const { createInterface } = await import('node:readline');
    const db = target.db();
    for (const entry of manifest.collections) {
      const collection = db.collection(entry.collection);
      const sourceHash = createHash('sha256');
      let imported = 0;
      const rows = createInterface({
        input: fs.createReadStream(path.join(backupDir, entry.file)),
        crlfDelay: Infinity,
      });
      for await (const line of rows) {
        if (!line) continue;
        const { document } = BSON.EJSON.parse(line, { relaxed: false });
        const existing = await collection.findOne({ _id: document._id });
        if (existing) {
          if (!resuming || stable(existing) !== stable(document))
            throw new Error(`Target mismatch in ${entry.collection}; no records overwritten.`);
        } else await collection.insertOne(document);
        const actual = await collection.findOne({ _id: document._id });
        if (stable(actual) !== stable(document))
          throw new Error(`Content verification failed in ${entry.collection}`);
        sourceHash.update(stable(actual) + '\n');
        imported++;
      }
      if (
        imported !== entry.count ||
        Number(await collection.countDocuments()) !== entry.count ||
        sourceHash.digest('hex') !== entry.checksum
      )
        throw new Error(`Count/checksum mismatch in ${entry.collection}`);
      console.info(`${entry.collection}: ${imported} verified`);
    }
    // Validate all declared references, including models whose ID was mapped to _id.
    for (const model of models) {
      for (const relation of model.fields.filter(
        (field) => field.kind === 'object' && field.relationFromFields?.length,
      )) {
        const childField = model.fields.find(
          (field) => field.name === relation.relationFromFields[0],
        );
        const parent = models.find((item) => item.name === relation.type);
        const parentField = parent.fields.find(
          (field) => field.name === relation.relationToFields[0],
        );
        const field = dbField(childField);
        const invalid = await db
          .collection(model.dbName)
          .aggregate([
            { $match: { [field]: { $ne: null } } },
            {
              $lookup: {
                from: parent.dbName,
                localField: field,
                foreignField: dbField(parentField),
                as: '__parent',
              },
            },
            { $match: { '__parent.0': { $exists: false } } },
            { $limit: 1 },
          ])
          .hasNext();
        if (invalid) throw new Error(`Orphan reference: ${model.name}.${relation.name}`);
      }
    }
    await db
      .collection('_migration_runs')
      .updateOne(
        { _id: 'postgres-to-mongo-v1' },
        {
          $set: {
            state: 'VERIFIED',
            completedAt: new Date(),
            counts: manifest.collections.map(({ collection, count }) => ({ collection, count })),
          },
        },
      );
    manifest.verified = true;
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n',
      { mode: 0o600 },
    );
  }
  console.info(
    `${manifest.mode}: ${manifest.collections.length} collections, ${manifest.collections.reduce((sum, entry) => sum + entry.count, 0)} rows. Backup: ${backupDir}. Source database unchanged.`,
  );
} finally {
  if (!committedSnapshot) await source.query('ROLLBACK').catch(() => {});
  await source.end();
  await target.close();
}
