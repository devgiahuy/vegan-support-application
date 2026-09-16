import {
  MealPlanMutationType,
  type MealGoal,
  type MealSlotStatus,
  type MealType,
  type NutritionDataQuality,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';

const mealPlanInclude = {
  items: {
    include: {
      recipe: { select: { id: true, slug: true } },
      recipeRevision: {
        include: {
          recipeDetail: true,
          ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
          media: { orderBy: { position: 'asc' } },
        },
      },
    },
    orderBy: { position: 'asc' },
  },
  shoppingItems: { orderBy: [{ canonicalName: 'asc' }, { unit: 'asc' }] },
} satisfies Prisma.MealPlanInclude;

export type MealPlanRecord = Prisma.MealPlanGetPayload<{ include: typeof mealPlanInclude }>;

export interface MealPlanItemData {
  date: Date;
  mealType: MealType;
  position: number;
  status: MealSlotStatus;
  recipeId?: string;
  recipeRevisionId?: string;
  targetCalories: number;
  calories?: number;
  tolerancePercent?: number;
  reasonCodes: Prisma.InputJsonValue;
  warningCodes: Prisma.InputJsonValue;
}

export interface ShoppingItemData {
  ingredientId: string;
  canonicalName: string;
  amount: number;
  unit: string;
  sourceItemCount: number;
}

export interface CreateMealPlanData {
  userId: string;
  weekStart: Date;
  goal: MealGoal;
  targetCalories: number;
  supersedesMealPlanId?: string;
  idempotencyKey: string;
  payloadHash: string;
  seedHash: string;
  algorithmVersion: string;
  recommendationVersion: string;
  constraintSnapshot: Prisma.InputJsonValue;
  warnings: Prisma.InputJsonValue;
  nutritionDataQuality: NutritionDataQuality;
  micronutrientSummary: Prisma.InputJsonValue;
  explanation: string;
  items: MealPlanItemData[];
  shoppingItems: ShoppingItemData[];
}

export interface SwapMealPlanData {
  userId: string;
  planId: string;
  itemId: string;
  expectedVersion: number;
  idempotencyKey: string;
  payloadHash: string;
  item: Omit<MealPlanItemData, 'date' | 'mealType' | 'position'>;
  warnings: Prisma.InputJsonValue;
  nutritionDataQuality: NutritionDataQuality;
  micronutrientSummary: Prisma.InputJsonValue;
  explanation: string;
  shoppingItems: ShoppingItemData[];
}

export class MealPlanVersionConflictError extends Error {
  constructor() {
    super('MEAL_PLAN_VERSION_CONFLICT');
    this.name = 'MealPlanVersionConflictError';
  }
}

export class MealPlanIdempotencyConflictError extends Error {
  constructor() {
    super('MEAL_PLAN_IDEMPOTENCY_CONFLICT');
    this.name = 'MealPlanIdempotencyConflictError';
  }
}

export class MealPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findHealthProfile(userId: string) {
    return this.prisma.healthProfile.findUnique({ where: { userId } });
  }

  findByIdempotency(userId: string, idempotencyKey: string): Promise<MealPlanRecord | null> {
    return this.prisma.mealPlan.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: mealPlanInclude,
    });
  }

  findMutationByIdempotency(userId: string, idempotencyKey: string) {
    return this.prisma.mealPlanMutation.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  findOwnedPlan(
    userId: string,
    id: string,
    includeDeleted = false,
  ): Promise<MealPlanRecord | null> {
    return this.prisma.mealPlan.findFirst({
      where: { id, userId, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: mealPlanInclude,
    });
  }

  async listOwnedPlans(
    userId: string,
    page: number,
    limit: number,
    weekStart?: Date,
  ): Promise<{ records: MealPlanRecord[]; total: number }> {
    const where = { userId, deletedAt: null, ...(weekStart ? { weekStart } : {}) };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.mealPlan.findMany({
        where,
        include: mealPlanInclude,
        orderBy: [{ weekStart: 'desc' }, { version: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mealPlan.count({ where }),
    ]);
    return { records, total };
  }

  async createPlan(data: CreateMealPlanData): Promise<MealPlanRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users" WHERE "id" = ${data.userId}::uuid FOR UPDATE
      `;
      const existing = await transaction.mealPlan.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: data.userId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        include: mealPlanInclude,
      });
      if (existing) {
        if (existing.payloadHash !== data.payloadHash) {
          throw new MealPlanIdempotencyConflictError();
        }
        return existing;
      }
      const [latest, latestActive] = await Promise.all([
        transaction.mealPlan.findFirst({
          where: { userId: data.userId, weekStart: data.weekStart },
          orderBy: { version: 'desc' },
          select: { version: true },
        }),
        transaction.mealPlan.findFirst({
          where: { userId: data.userId, weekStart: data.weekStart, deletedAt: null },
          orderBy: { version: 'desc' },
          select: { id: true },
        }),
      ]);
      const supersedesMealPlanId = data.supersedesMealPlanId ?? latestActive?.id;
      return transaction.mealPlan.create({
        data: {
          userId: data.userId,
          weekStart: data.weekStart,
          goal: data.goal,
          targetCalories: data.targetCalories,
          version: (latest?.version ?? 0) + 1,
          ...(supersedesMealPlanId ? { supersedesMealPlanId } : {}),
          idempotencyKey: data.idempotencyKey,
          payloadHash: data.payloadHash,
          seedHash: data.seedHash,
          algorithmVersion: data.algorithmVersion,
          recommendationVersion: data.recommendationVersion,
          constraintSnapshot: data.constraintSnapshot,
          warnings: data.warnings,
          nutritionDataQuality: data.nutritionDataQuality,
          micronutrientSummary: data.micronutrientSummary,
          explanation: data.explanation,
          items: { create: data.items },
          shoppingItems: { create: data.shoppingItems },
        },
        include: mealPlanInclude,
      });
    });
  }

  async swapItem(data: SwapMealPlanData): Promise<MealPlanRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users" WHERE "id" = ${data.userId}::uuid FOR UPDATE
      `;
      const existingMutation = await transaction.mealPlanMutation.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: data.userId,
            idempotencyKey: data.idempotencyKey,
          },
        },
      });
      if (existingMutation) {
        if (existingMutation.payloadHash !== data.payloadHash) {
          throw new MealPlanIdempotencyConflictError();
        }
        const existingPlan = await transaction.mealPlan.findFirstOrThrow({
          where: { id: existingMutation.mealPlanId, userId: data.userId, deletedAt: null },
          include: mealPlanInclude,
        });
        return existingPlan;
      }
      const updated = await transaction.mealPlan.updateMany({
        where: {
          id: data.planId,
          userId: data.userId,
          deletedAt: null,
          lockVersion: data.expectedVersion,
        },
        data: {
          lockVersion: { increment: 1 },
          warnings: data.warnings,
          nutritionDataQuality: data.nutritionDataQuality,
          micronutrientSummary: data.micronutrientSummary,
          explanation: data.explanation,
        },
      });
      if (!updated.count) throw new MealPlanVersionConflictError();
      await transaction.mealPlanItem.update({
        where: { id: data.itemId, mealPlanId: data.planId },
        data: data.item,
      });
      await transaction.mealPlanShoppingItem.deleteMany({ where: { mealPlanId: data.planId } });
      if (data.shoppingItems.length) {
        await transaction.mealPlanShoppingItem.createMany({
          data: data.shoppingItems.map((item) => ({ mealPlanId: data.planId, ...item })),
        });
      }
      await transaction.mealPlanMutation.create({
        data: {
          userId: data.userId,
          mealPlanId: data.planId,
          mealPlanItemId: data.itemId,
          type: MealPlanMutationType.SWAP,
          idempotencyKey: data.idempotencyKey,
          payloadHash: data.payloadHash,
          resultingLockVersion: data.expectedVersion + 1,
        },
      });
      return transaction.mealPlan.findUniqueOrThrow({
        where: { id: data.planId },
        include: mealPlanInclude,
      });
    });
  }

  async softDelete(userId: string, id: string, expectedVersion: number): Promise<boolean> {
    const current = await this.findOwnedPlan(userId, id, true);
    if (!current) return false;
    if (current.deletedAt) return true;
    const result = await this.prisma.mealPlan.updateMany({
      where: { id, userId, deletedAt: null, lockVersion: expectedVersion },
      data: { deletedAt: new Date(), lockVersion: { increment: 1 } },
    });
    if (!result.count) {
      const deleted = await this.prisma.mealPlan.findFirst({
        where: { id, userId, deletedAt: { not: null } },
        select: { id: true },
      });
      if (deleted) return true;
      throw new MealPlanVersionConflictError();
    }
    return true;
  }

  isUniqueConstraintError(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
  }
}
