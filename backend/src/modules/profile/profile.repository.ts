import { lockDocument } from '../../database/locking.js';
import { AppError } from '../../common/errors/app-error.js';
import {
  ContributorApplicationStatus,
  type HealthProfile,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import type {
  HealthProfileInput,
  SaveDietPreferencesInput,
  UpdateBasicProfileInput,
} from './profile.schemas.js';

const profileInclude = {
  applications: {
    where: { status: ContributorApplicationStatus.PENDING },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
  contributorProfile: true,
  healthProfile: true,
  dietPreference: true,
  allergies: {
    where: { active: true },
    orderBy: { allergenCode: 'asc' },
  },
  ingredientExclusions: {
    where: { active: true },
    orderBy: { normalizedName: 'asc' },
  },
  ingredientAllergies: {
    where: { active: true },
    include: { ingredient: true },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.UserInclude;

export type ProfileRecord = Prisma.UserGetPayload<{ include: typeof profileInclude }>;

interface CalculatedHealthMetrics {
  bmi: number;
  bmr: number;
  tdee: number;
}

export interface NormalizedIngredientExclusion {
  ingredientId?: string;
  ingredientName: string;
  normalizedName: string;
  reason?: string;
}

export class ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findActiveAllergens(codes: string[]) {
    return this.prisma.allergenDefinition.findMany({
      where: { code: { in: codes }, active: true },
      select: { code: true, label: true },
    });
  }

  findProfile(userId: string): Promise<ProfileRecord | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, include: profileInclude });
  }

  async updateBasicProfile(userId: string, input: UpdateBasicProfileInput): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
    });
  }

  upsertHealthProfile(
    userId: string,
    input: HealthProfileInput,
    metrics: CalculatedHealthMetrics,
  ): Promise<HealthProfile> {
    const data = { ...input, ...metrics };
    return this.prisma.healthProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  findActiveIngredients(ids: string[]) {
    return this.prisma.ingredient.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: { id: true, canonicalName: true, normalizedName: true },
    });
  }

  async saveDietPreferences(
    userId: string,
    input: SaveDietPreferencesInput,
    exclusions: NormalizedIngredientExclusion[],
    confirmedAt: Date,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: userId });
      const current = await transaction.dietPreference.findUnique({ where: { userId } });
      if ((current?.dietaryRevision ?? 0) !== input.expectedDietaryRevision) {
        throw new AppError({
          statusCode: 409,
          code: 'DIET_PREFERENCES_CONFLICT',
          message: 'Thiết lập ăn uống đã thay đổi. Vui lòng tải lại.',
          fields: { currentRevision: [String(current?.dietaryRevision ?? 0)] },
        });
      }
      const [oldAllergies, oldIngredientAllergies, oldExclusions] = await Promise.all([
        transaction.userAllergy.findMany({
          where: { userId, active: true },
          select: { allergenCode: true },
        }),
        transaction.userIngredientAllergy.findMany({
          where: { userId, active: true },
          select: { ingredientId: true },
        }),
        transaction.userIngredientExclusion.findMany({
          where: { userId, active: true },
          select: { ingredientId: true, normalizedName: true },
        }),
      ]);
      const normalized = (values: string[]) => [...new Set(values)].sort();
      const previousKey = current
        ? JSON.stringify({
            options: [
              current.allowEggs,
              current.allowDairy,
              current.allowHoney,
              current.allowFivePungent,
              current.policyVersion,
            ],
            allergens: normalized(oldAllergies.map((a) => a.allergenCode)),
            ingredients: normalized(oldIngredientAllergies.map((a) => a.ingredientId)),
            exclusions: normalized(
              oldExclusions.map((e) => JSON.stringify([e.ingredientId, e.normalizedName])),
            ),
          })
        : null;
      const nextKey = JSON.stringify({
        options: [
          input.allowEggs,
          input.allowDairy,
          input.allowHoney,
          input.allowFivePungent,
          input.policyVersion,
        ],
        allergens: normalized(input.allergies.map((a) => a.allergenCode)),
        ingredients: normalized(
          (input.ingredientAllergies ?? oldIngredientAllergies).map((a) => a.ingredientId),
        ),
        exclusions: normalized(
          exclusions.map((e) => JSON.stringify([e.ingredientId ?? null, e.normalizedName])),
        ),
      });
      const constraintsChanged = previousKey !== nextKey;
      const data = {
        allowEggs: input.allowEggs,
        allowDairy: input.allowDairy,
        allowHoney: input.allowHoney,
        allowFivePungent: input.allowFivePungent,
        policyVersion: input.policyVersion,
        dietaryRevision: (current?.dietaryRevision ?? 0) + (constraintsChanged ? 1 : 0),
        confirmedAt,
      };
      await transaction.dietPreference.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
      });
      if (constraintsChanged) {
        const plans = await transaction.mealPlan.findMany({
          where: { userId, deletedAt: null },
          select: { id: true },
        });
        await transaction.mealAnalysis.updateMany({
          where: { mealPlanId: { in: plans.map((plan) => plan.id) }, status: 'CURRENT' },
          data: { status: 'STALE' },
        });
        const programs = await transaction.mealProgram.findMany({
          where: { userId },
          select: { id: true },
        });
        await transaction.mealProgramAnalysis.updateMany({
          where: {
            mealProgramId: { in: programs.map((program) => program.id) },
            status: 'CURRENT',
          },
          data: { status: 'STALE' },
        });
        await transaction.mealProgramWeek.updateMany({
          where: { mealProgramId: { in: programs.map((program) => program.id) } },
          data: { projectionStatus: 'STALE' },
        });
      }

      await transaction.userAllergy.deleteMany({ where: { userId } });
      if (input.allergies.length) {
        await transaction.userAllergy.createMany({
          data: input.allergies.map((allergy) => ({
            userId,
            allergenCode: allergy.allergenCode,
            ...(allergy.label ? { label: allergy.label } : {}),
            ...(allergy.severity ? { severity: allergy.severity } : {}),
          })),
        });
      }

      await transaction.userIngredientExclusion.deleteMany({ where: { userId } });
      if (input.ingredientAllergies !== undefined) {
        const ids = input.ingredientAllergies.map((entry) => entry.ingredientId);
        const active = await transaction.ingredient.count({
          where: { id: { in: ids }, status: 'ACTIVE' },
        });
        if (active !== ids.length)
          throw new AppError({
            statusCode: 400,
            code: 'INVALID_INGREDIENT_ALLERGIES',
            message: 'Nguyên liệu dị ứng đã thay đổi. Vui lòng chọn lại từ danh mục chuẩn.',
          });
        await transaction.userIngredientAllergy.deleteMany({ where: { userId } });
        if (input.ingredientAllergies.length)
          await transaction.userIngredientAllergy.createMany({
            data: input.ingredientAllergies.map((entry) => ({ userId, ...entry })),
          });
      }
      if (exclusions.length) {
        await transaction.userIngredientExclusion.createMany({
          data: exclusions.map((exclusion) => ({ userId, ...exclusion })),
        });
      }
    });
  }
}
