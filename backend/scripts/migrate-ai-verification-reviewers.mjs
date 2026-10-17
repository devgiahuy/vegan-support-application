import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const OLD_INDEX = 'ai_verifications_one_active_per_artifact';
const NEW_INDEX = 'ai_verifications_one_active_per_reviewer';
const mode = process.argv[2] ?? 'status';

if (!['deploy', 'status'].includes(mode)) {
  throw new Error('Usage: node scripts/migrate-ai-verification-reviewers.mjs <deploy|status>');
}

const url = process.env.DATABASE_URL;
if (!url?.startsWith('mongodb')) throw new Error('DATABASE_URL must use MongoDB');

const client = new PrismaClient();
try {
  const listed = await client.$runCommandRaw({ listIndexes: 'ai_verifications' });
  const indexes = Array.isArray(listed.cursor?.firstBatch) ? listed.cursor.firstBatch : [];
  const hasOld = indexes.some((index) => index.name === OLD_INDEX);
  const hasNew = indexes.some((index) => index.name === NEW_INDEX);

  if (mode === 'status') {
    console.info(
      JSON.stringify({ migration: NEW_INDEX, applied: hasNew && !hasOld, hasOld, hasNew }),
    );
  } else {
    if (!hasNew) {
      await client.$runCommandRaw({
        createIndexes: 'ai_verifications',
        indexes: [
          {
            key: { artifact_id: 1, artifact_version: 1, reviewer_id: 1 },
            name: NEW_INDEX,
            unique: true,
            partialFilterExpression: { status: 'ACTIVE' },
          },
        ],
      });
    }
    if (hasOld)
      await client.$runCommandRaw({
        dropIndexes: 'ai_verifications',
        index: OLD_INDEX,
      });
    console.info(`Applied forward migration: ${NEW_INDEX}`);
  }
} finally {
  await client.$disconnect();
}
