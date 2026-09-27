import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.argv[2] !== 'cleanup') throw new Error('Usage: npm run notifications:cleanup');
  let deleted = 0;
  for (;;) {
    const rows = await prisma.notification.findMany({ where: { expiresAt: { lte: new Date() } }, select: { id: true }, orderBy: { expiresAt: 'asc' }, take: 500 });
    if (!rows.length) break;
    const result = await prisma.notification.deleteMany({ where: { id: { in: rows.map((row) => row.id) }, expiresAt: { lte: new Date() } } });
    deleted += result.count;
    if (rows.length < 500) break;
  }
  console.info(JSON.stringify({ action: 'notifications:cleanup', deleted }));
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
