import 'dotenv/config';
import { createPrismaClient } from '../src/database/client.js';
import { normalizeAllergyCatalog } from './seed-data/composition.data.js';

const prisma = createPrismaClient();
try {
  if (process.argv.includes('--status')) {
    const counts = await Promise.all(
      ['UNKNOWN', 'PARTIAL', 'COMPLETE'].map(async (status) => ({
        status,
        count: await prisma.ingredient.count({
          where: { compositionStatus: status as 'UNKNOWN' | 'PARTIAL' | 'COMPLETE' },
        }),
      })),
    );
    console.info(
      JSON.stringify({
        compositionCounts: counts,
        componentEdges: await prisma.ingredientComponent.count(),
      }),
    );
  } else {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN', status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (!admin) throw new Error('An active Admin is required for audited demo normalization.');
    console.info(JSON.stringify(await normalizeAllergyCatalog(prisma, admin.id)));
  }
} finally {
  await prisma.$disconnect();
}
