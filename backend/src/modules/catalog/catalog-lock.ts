import type { Prisma } from '@prisma/client';

/** Serialize composition/classification writes with commits that trust their snapshot. */
export async function lockIngredientCatalog(transaction: Prisma.TransactionClient): Promise<void> {
  await transaction.catalogGraphState.upsert({
    where: { id: 'ingredient-composition' },
    create: { id: 'ingredient-composition', version: 1 },
    update: { version: { increment: 1 } },
  });
}
