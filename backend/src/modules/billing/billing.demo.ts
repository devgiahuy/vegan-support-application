import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import pino from 'pino';
import { createApp } from '../../app.js';
import { loadConfig } from '../../config/env.js';
import { createPrismaClient } from '../../database/client.js';
import { PrismaDatabase } from '../../database/database.js';
import { PasswordService } from '../auth/password.service.js';
import { seedBillingProducts } from './billing.catalog.js';

// Public demo credentials apply only to this isolated, local database.
const port = Number(process.env.BILLING_DEMO_PORT ?? 4100);
Object.assign(process.env, {
  NODE_ENV: 'development',
  PORT: String(port),
  DATABASE_URL:
    process.env.BILLING_DEMO_DATABASE_URL ??
    'mongodb://localhost:27018/vegan_billing_demo?replicaSet=rs0&directConnection=true',
  BILLING_ENABLED: 'true',
  BILLING_PROVIDER: 'payos',
  BILLING_PUBLIC_URL: process.env.BILLING_DEMO_PUBLIC_URL ?? 'http://localhost:' + port,
  BILLING_RETURN_URL: process.env.BILLING_DEMO_RETURN_URL ?? 'http://localhost:3100/billing',
  FRONTEND_ORIGIN:
    process.env.BILLING_DEMO_ORIGINS ?? 'http://localhost:3100,http://127.0.0.1:8090',
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ?? 'billing-demo-only-secret-at-least-32-characters',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? 'local-development',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? 'local-development',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? 'local-development',
  AI_PROVIDER: 'fake',
  VISION_PROVIDER: 'fake',
  RECEIPT_PROVIDER: 'fake',
  MAPS_PROVIDER: 'fake',
  VISION_ENABLED: 'true',
  RECEIPT_ENABLED: 'true',
  SEED_MEMBER_PASSWORD: process.env.SEED_MEMBER_PASSWORD ?? 'DemoMember2026!',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? 'DemoAdmin2026!',
});
if (!new URL(process.env.DATABASE_URL!).pathname.includes('billing_'))
  throw new Error('Billing demo requires an isolated billing_* database');
for (const args of [['scripts/mongo-schema.mjs'], ['--import', 'tsx', 'prisma/seed.ts']]) {
  const result = spawnSync(process.execPath, args, { env: process.env, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Demo schema/seed failed');
}
const config = loadConfig();
const db = createPrismaClient();
const database = new PrismaDatabase(db);
await database.check();
await seedBillingProducts(db);
await db.user.upsert({
  where: { email: 'billing-demo@example.test' },
  create: {
    email: 'billing-demo@example.test',
    displayName: 'Thành viên Demo',
    passwordHash: await new PasswordService().hash('DemoBilling2026!'),
    role: 'MEMBER',
  },
  update: {},
});
const server = createServer(createApp({ config, database, logger: pino({ level: 'info' }) }));
server.listen(port, '0.0.0.0', () => {
  console.info('Billing demo API: http://localhost:' + port);
  console.info('Demo login: billing-demo@example.test / DemoBilling2026!');
  console.info('Payment provider: payOS (real transfers, no sandbox).');
  console.info(
    'Checkout configured:',
    Boolean(
      config.billing.payosClientId && config.billing.payosApiKey && config.billing.payosChecksumKey,
    ),
  );
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    server.close(() => {
      void database.disconnect().then(() => process.exit(0));
    });
  });
