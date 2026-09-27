import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { AI_GOVERNANCE_RETENTION_DAYS } from './ai-governance.service.js';

const db = new PrismaClient();
async function main(): Promise<void> {
  if (process.argv[2] !== 'cleanup') throw new Error('Usage: npm run ai-governance:cleanup');
  const cutoff = new Date(Date.now() - AI_GOVERNANCE_RETENTION_DAYS * 86_400_000);
  let deleted = 0;
  let chatLogsDeleted = 0;
  for (;;) {
    const rows = await db.aiGovernanceEvent.findMany({ where: { createdAt: { lt: cutoff } }, orderBy: { createdAt: 'asc' }, select: { id: true }, take: 500 });
    if (!rows.length) break;
    deleted += (await db.aiGovernanceEvent.deleteMany({ where: { id: { in: rows.map((row) => row.id) }, createdAt: { lt: cutoff } } })).count;
    if (rows.length < 500) break;
  }
  for (;;) {
    const rows = await db.aiRequestLog.findMany({ where: { createdAt: { lt: cutoff } }, orderBy: { createdAt: 'asc' }, select: { id: true }, take: 500 });
    if (!rows.length) break;
    chatLogsDeleted += (await db.aiRequestLog.deleteMany({ where: { id: { in: rows.map((row) => row.id) }, createdAt: { lt: cutoff } } })).count;
    if (rows.length < 500) break;
  }
  console.info(JSON.stringify({ action: 'ai-governance:cleanup', deleted, chatLogsDeleted, cutoff: cutoff.toISOString() }));
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(async () => db.$disconnect());
