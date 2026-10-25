import 'dotenv/config';
import assert from 'node:assert/strict';
import { createPrismaClient } from '../../database/client.js';
import { ContentRepository } from './content.repository.js';

const prisma = createPrismaClient();
const email = 'recipe-statistics-acceptance@example.com';
const keyPrefix = 'recipe-statistics-acceptance-';

async function main(): Promise<void> {
  const repository = new ContentRepository(prisma);
  const recipe = await prisma.post.findFirstOrThrow({
    where: { type: 'RECIPE', status: 'PUBLISHED', deletedAt: null },
    select: { id: true, publishedRevisionId: true },
    orderBy: { id: 'asc' },
  });
  assert(recipe.publishedRevisionId);
  const before = await repository.recipeUsageUserCount(recipe.id);
  const user = await prisma.user.upsert({
    where: { email },
    update: { status: 'ACTIVE' },
    create: {
      email,
      passwordHash: 'acceptance-only-not-a-login-credential',
      displayName: 'Recipe statistics acceptance user',
    },
  });
  await prisma.mealPlan.deleteMany({
    where: { userId: user.id, idempotencyKey: { startsWith: keyPrefix } },
  });
  try {
    for (const [index, weekStart] of [
      new Date('2030-01-07T00:00:00.000Z'),
      new Date('2030-01-14T00:00:00.000Z'),
    ].entries()) {
      await prisma.mealPlan.create({
        data: {
          userId: user.id,
          weekStart,
          goal: 'MAINTAIN',
          targetCalories: 2_000,
          version: 1,
          idempotencyKey: `${keyPrefix}${String(index)}`,
          payloadHash: String(index).padStart(64, 'a'),
          seedHash: String(index).padStart(64, 'b'),
          algorithmVersion: 'acceptance-v1',
          recommendationVersion: 'acceptance-v1',
          constraintSnapshot: {},
          warnings: [],
          nutritionDataQuality: 'UNAVAILABLE',
          micronutrientSummary: {},
          items: {
            create: {
              date: weekStart,
              mealType: 'LUNCH',
              position: 0,
              status: 'FILLED',
              sourceType: 'RECIPE',
              recipeId: recipe.id,
              recipeRevisionId: recipe.publishedRevisionId,
              servings: 1,
              targetCalories: 600,
              calories: 600,
              tolerancePercent: 0,
            },
          },
        },
      });
    }
    assert.equal(
      await repository.recipeUsageUserCount(recipe.id),
      before + 1,
      'one user adding the same recipe to multiple meal plans must count once',
    );
    console.info(
      'Recipe statistics acceptance passed: meal-plan usage counts distinct users and repeated additions count once.',
    );
  } finally {
    await prisma.mealPlan.deleteMany({
      where: { userId: user.id, idempotencyKey: { startsWith: keyPrefix } },
    });
    await prisma.user.deleteMany({ where: { email } });
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
