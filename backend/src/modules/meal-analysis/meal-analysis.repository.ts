import {
  FoodDataReviewStatus,
  MealAnalysisStatus,
  RecipeNutritionEstimateStatus,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';

const analysisPlanInclude = {
  items: {
    include: {
      recipeRevision: {
        include: {
          recipeDetail: true,
          ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
          nutritionEstimates: {
            where: { status: RecipeNutritionEstimateStatus.CURRENT },
            include: { lines: { orderBy: { position: 'asc' } } },
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      },
      customMeal: {
        include: { ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } } },
      },
    },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.MealPlanInclude;

const profileSelect = {
  healthProfile: true,
  dietPreference: true,
  dietPreferenceRules: { where: { enabled: true }, include: { ruleDefinition: true } },
  allergies: { where: { active: true } },
  ingredientExclusions: { where: { active: true } },
} satisfies Prisma.UserSelect;

export type AnalysisPlanRecord = Prisma.MealPlanGetPayload<{ include: typeof analysisPlanInclude }>;
export type AnalysisProfileRecord = Prisma.UserGetPayload<{ select: typeof profileSelect }>;
export type MealAnalysisRecord = Prisma.MealAnalysisGetPayload<Record<string, never>>;

export class MealAnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findOwnedPlan(userId: string, mealPlanId: string): Promise<AnalysisPlanRecord | null> {
    return this.prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId, deletedAt: null },
      include: analysisPlanInclude,
    });
  }

  findProfile(userId: string): Promise<AnalysisProfileRecord | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, select: profileSelect });
  }

  findLatest(mealPlanId: string): Promise<MealAnalysisRecord | null> {
    return this.prisma.mealAnalysis.findFirst({
      where: { mealPlanId },
      orderBy: { version: 'desc' },
    });
  }

  async findRules(ingredientIds: string[], at: Date) {
    const approvedEffective = {
      reviewStatus: FoodDataReviewStatus.APPROVED,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
    };
    const [references, guidelines, interactions] = await Promise.all([
      this.prisma.nutrientReferenceIntake.findMany({
        where: { ...approvedEffective, warningEligible: true },
        include: { nutrient: true, source: true },
        orderBy: [{ nutrientId: 'asc' }, { referenceType: 'asc' }, { sourceVersion: 'desc' }],
      }),
      this.prisma.ingredientIntakeGuideline.findMany({
        where: { ...approvedEffective, ingredientId: { in: ingredientIds } },
        include: { ingredient: true, source: true },
        orderBy: [{ ingredientId: 'asc' }, { period: 'asc' }, { sourceVersion: 'desc' }],
      }),
      this.prisma.ingredientInteractionRule.findMany({
        where: {
          ...approvedEffective,
          ingredientAId: { in: ingredientIds },
          ingredientBId: { in: ingredientIds },
        },
        include: { ingredientA: true, ingredientB: true, source: true },
        orderBy: [{ scope: 'asc' }, { sourceVersion: 'desc' }],
      }),
    ]);
    return { references, guidelines, interactions };
  }

  async findConversions(ingredientIds: string[], at: Date) {
    if (!ingredientIds.length) return [];
    return this.prisma.ingredientFoodProfile.findMany({
      where: {
        ingredientId: { in: ingredientIds },
        reviewStatus: FoodDataReviewStatus.APPROVED,
        effectiveFrom: { lte: at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
      },
      include: {
        householdConversions: { where: { reviewStatus: FoodDataReviewStatus.APPROVED } },
      },
      orderBy: [{ ingredientId: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  async save(data: {
    mealPlanId: string;
    algorithmVersion: string;
    inputFingerprint: string;
    requestSnapshot: Prisma.InputJsonValue;
    profileSnapshot: Prisma.InputJsonValue;
    ruleVersions: Prisma.InputJsonValue;
    warnings: Prisma.InputJsonValue;
    incompleteData: Prisma.InputJsonValue;
    summary: Prisma.InputJsonValue;
    confidence: number;
    disclaimer: string;
  }): Promise<MealAnalysisRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "meal_plans" WHERE "id" = ${data.mealPlanId}::uuid FOR UPDATE
      `;
      const latest = await transaction.mealAnalysis.findFirst({
        where: { mealPlanId: data.mealPlanId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      await transaction.mealAnalysis.updateMany({
        where: { mealPlanId: data.mealPlanId, status: MealAnalysisStatus.CURRENT },
        data: { status: MealAnalysisStatus.STALE },
      });
      return transaction.mealAnalysis.create({
        data: { ...data, version: (latest?.version ?? 0) + 1 },
      });
    });
  }

  markStale(id: string): Promise<MealAnalysisRecord> {
    return this.prisma.mealAnalysis.update({
      where: { id },
      data: { status: MealAnalysisStatus.STALE },
    });
  }
}
