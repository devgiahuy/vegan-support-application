import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
  console.info('Foundation seed completed; no domain records are required in Phase 00.');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
