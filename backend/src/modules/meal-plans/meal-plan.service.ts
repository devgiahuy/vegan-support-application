import { createHash } from 'node:crypto';
import {
  MealSlotStatus,
  MealPlanItemSourceType,
  MealType,
  MediaKind,
  NutritionDataQuality,
  PracticeSchedule,
  type MealGoal,
  type Prisma,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import {
  addMealMacroValues,
  emptyMealMacroValues,
  estimateMealMacroTargets,
  macroTargetDeviationScore,
  scaleMealMacroValues,
  type MealMacroValues,
} from '../../common/nutrition/meal-macros.js';
import { normalizeAggregationUnit } from '../../common/units/unit-normalization.js';
import type { AppConfig } from '../../config/env.js';
import type { ContentRepository, PublishedPostRecord } from '../content/content.repository.js';
import { buildAuthenticatedSearchConstraints } from '../content/search-constraints.js';
import { RECOMMENDATION_SCORING_VERSION } from '../recommendations/recommendation.schemas.js';
import type { RecommendationService } from '../recommendations/recommendation.service.js';
import type { MealAnalysisService } from '../meal-analysis/meal-analysis.service.js';
import {
  MealPlanIdempotencyConflictError,
  MealPlanVersionConflictError,
  type MealPlanItemData,
  type MealPlanRepository,
  type MealPlanRecord,
  type ShoppingItemData,
} from './meal-plan.repository.js';
import {
  MEAL_PLAN_ALGORITHM_VERSION,
  type DeleteMealPlanQuery,
  type GenerateMealPlanInput,
  type MealPlanListQuery,
  type ManualAddMealPlanItemInput,
  type MealPlanWarningCode,
  type SwapMealPlanItemInput,
} from './meal-plan.schemas.js';
import { buildWeeklySlotBlueprint, WEEKLY_MEAL_ORDER } from './weekly-plan.js';

const EXPANDED_TOLERANCE = 0.2;
const MAX_RECIPE_USES = 2;
const TOTAL_SLOTS = 21 as const;
const GENERATED_SERVING_OPTIONS = [0.75, 1, 1.25] as const;
const MAX_DAILY_COMBINATION_CANDIDATES = 24;
const INCOMPLETE_MACRO_SCORE_PENALTY = 2;
const WEEKLY_REUSE_SCORE_PENALTY = 0.35;
const SAME_DAY_REPEAT_SCORE_PENALTY = 1.2;
const MEAL_SPLITS: Record<MealType, number> = {
  [MealType.BREAKFAST]: 0.25,
  [MealType.LUNCH]: 0.4,
  [MealType.DINNER]: 0.35,
};

interface RevisionNutritionSnapshot {
  recipeDetail: {
    vitaminB12Mcg: Prisma.Decimal | null;
    proteinGrams: Prisma.Decimal | null;
    fiberGrams: Prisma.Decimal | null;
    fatGrams: Prisma.Decimal | null;
    carbsGrams: Prisma.Decimal | null;
  } | null;
  ingredients: Array<{
    ingredientId: string | null;
    amount: Prisma.Decimal;
    unit: string;
    ingredient: { canonicalName: string } | null;
  }>;
}

interface PlannedSlot {
  data: MealPlanItemData;
  revision: RevisionNutritionSnapshot | null;
}

interface GeneratedCandidateSelection {
  post: PublishedPostRecord;
  servings: number;
  reasonCodes: string[];
  warningCodes: MealPlanWarningCode[];
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function dateFromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function planSlotLabel(date: Date, mealType: MealType): string {
  const weekday = ['Ch? Nh?t', 'Th? Hai', 'Th? Ba', 'Th? Tu', 'Th? Nam', 'Th? S�u', 'Th? B?y'][
    date.getUTCDay()
  ];
  const meal = {
    [MealType.BREAKFAST]: 'b?a s�ng',
    [MealType.LUNCH]: 'b?a trua',
    [MealType.DINNER]: 'b?a t?i',
  }[mealType];
  return `${meal} ${weekday} (${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')})`;
}

function stringList(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function warningList(value: Prisma.JsonValue): MealPlanWarningCode[] {
  const allowed = new Set<MealPlanWarningCode>([
    'CALORIE_TOLERANCE_WIDENED',
    'RECIPE_REPEATED',
    'UNFILLED_SLOT',
    'SHOPPING_UNIT_NOT_COMBINED',
    'MICRONUTRIENT_DATA_PARTIAL',
    'MICRONUTRIENT_DATA_UNAVAILABLE',
    'NUTRITION_TARGET_OUTSIDE_TOLERANCE',
  ]);
  return stringList(value).filter((code): code is MealPlanWarningCode =>
    allowed.has(code as MealPlanWarningCode),
  );
}

const USER_FACING_PLAN_WARNING_CODES = new Set<MealPlanWarningCode>([
  'RECIPE_REPEATED',
  'UNFILLED_SLOT',
  'SHOPPING_UNIT_NOT_COMBINED',
]);

function userFacingWarningList(value: Prisma.JsonValue): MealPlanWarningCode[] {
  return warningList(value).filter((code) => USER_FACING_PLAN_WARNING_CODES.has(code));
}

export function mealPlanWarningCopy(code: MealPlanWarningCode) {
  return {
    RECIPE_REPEATED: {
      severity: 'INFO' as const,
      severityLabel: 'Thông tin' as const,
      message: 'M?t s? m�n du?c l?p l?i trong tu?n',
      detail:
        'S? m�n ph� h?p v?i y�u c?u an u?ng c?a b?n hi?n c�n h?n ch?, n�n m?t v�i m�n du?c d�ng l?i d? ho�n th�nh th?c don.',
      suggestion: 'B?n c� th? d?i m?t b?a sang m�n ph� h?p kh�c n?u mu?n th?c don da d?ng hon.',
    },
    UNFILLED_SLOT: {
      severity: 'WARNING' as const,
      severityLabel: 'Nên lưu ý' as const,
      message: 'M?t s? b?a chua c� m�n ph� h?p',
      detail:
        'H? th?ng chua t�m th?y m�n d�p ?ng d?ng th?i d? ?ng, nguy�n li?u c?n tr�nh, ch? d? an v� quy t?c truy?n th?ng c?a b?n.',
      suggestion:
        'B?n c� th? th�m m?t m�n ph� h?p ho?c b? sung c�ng th?c m?i r?i t?o l?i th?c don.',
    },
    SHOPPING_UNIT_NOT_COMBINED: {
      severity: 'INFO' as const,
      severityLabel: 'Thông tin' as const,
      message: 'M?t s? nguy�n li?u du?c t�ch th�nh nhi?u d�ng mua s?m',
      detail:
        'C�ng m?t nguy�n li?u dang d�ng c�c don v? kh�c nhau v� chua d? th�ng tin d? c?ng l?i ch�nh x�c.',
      suggestion: 'B?n c� th? ki?m tra t?ng d�ng v� quy d?i v? c�ng m?t don v? tru?c khi mua.',
    },
    CALORIE_TOLERANCE_WIDENED: null,
    MICRONUTRIENT_DATA_PARTIAL: null,
    MICRONUTRIENT_DATA_UNAVAILABLE: null,
    NUTRITION_TARGET_OUTSIDE_TOLERANCE: null,
  }[code];
}

function nutritionSummary(revisions: Array<RevisionNutritionSnapshot | null>) {
  const filled = revisions.filter((revision): revision is RevisionNutritionSnapshot =>
    Boolean(revision),
  );
  const withData = filled.filter((revision) => revision.recipeDetail?.vitaminB12Mcg != null);
  const quality =
    withData.length === 0
      ? NutritionDataQuality.UNAVAILABLE
      : withData.length === filled.length
        ? NutritionDataQuality.COMPLETE
        : NutritionDataQuality.PARTIAL;
  return {
    quality,
    summary: {
      vitaminB12Mcg:
        withData.length > 0
          ? Number(
              withData
                .reduce(
                  (sum, revision) => sum + Number(revision.recipeDetail?.vitaminB12Mcg ?? 0),
                  0,
                )
                .toFixed(2),
            )
          : null,
      recipesWithData: withData.length,
      filledRecipeCount: filled.length,
    },
    warning: null,
  };
}

function revisionMacros(revision: RevisionNutritionSnapshot | null): MealMacroValues {
  const detail = revision?.recipeDetail;
  return {
    proteinGrams: detail?.proteinGrams == null ? null : Number(detail.proteinGrams),
    fiberGrams: detail?.fiberGrams == null ? null : Number(detail.fiberGrams),
    fatGrams: detail?.fatGrams == null ? null : Number(detail.fatGrams),
    carbohydrateGrams: detail?.carbsGrams == null ? null : Number(detail.carbsGrams),
  };
}

function shoppingList(revisions: Array<RevisionNutritionSnapshot | null>): {
  items: ShoppingItemData[];
  warning: MealPlanWarningCode | null;
} {
  const groups = new Map<string, ShoppingItemData>();
  const unitsByIngredient = new Map<string, Set<string>>();
  for (const revision of revisions) {
    if (!revision) continue;
    for (const ingredient of revision.ingredients) {
      if (!ingredient.ingredientId || !ingredient.ingredient) continue;
      const conversion = normalizeAggregationUnit(ingredient.unit);
      const key = `${ingredient.ingredientId}:${conversion.unit}`;
      const current = groups.get(key);
      const amount = Number(ingredient.amount) * conversion.factor;
      groups.set(key, {
        ingredientId: ingredient.ingredientId,
        canonicalName: ingredient.ingredient.canonicalName,
        amount: Number(((current?.amount ?? 0) + amount).toFixed(3)),
        unit: conversion.unit,
        sourceItemCount: (current?.sourceItemCount ?? 0) + 1,
      });
      const units = unitsByIngredient.get(ingredient.ingredientId) ?? new Set<string>();
      units.add(conversion.unit);
      unitsByIngredient.set(ingredient.ingredientId, units);
    }
  }
  return {
    items: [...groups.values()].sort(
      (a, b) => a.canonicalName.localeCompare(b.canonicalName) || a.unit.localeCompare(b.unit),
    ),
    warning: [...unitsByIngredient.values()].some((units) => units.size > 1)
      ? 'SHOPPING_UNIT_NOT_COMBINED'
      : null,
  };
}

export class MealPlanService {
  constructor(
    private readonly repository: MealPlanRepository,
    private readonly contentRepository: ContentRepository,
    private readonly recommendationService: RecommendationService,
    private readonly config: AppConfig,
    private readonly mealAnalysisService: MealAnalysisService,
  ) {}

  async generate(userId: string, input: GenerateMealPlanInput) {
    const payloadHash = sha256({
      weekStart: input.weekStart,
      goal: input.goal,
      seed: input.seed ?? null,
      supersedesMealPlanId: input.supersedesMealPlanId ?? null,
    });
    const existing = await this.repository.findByIdempotency(userId, input.idempotencyKey);
    if (existing) {
      if (existing.payloadHash !== payloadHash) throw this.idempotencyConflict();
      return this.outputWithAnalysis(userId, existing);
    }
    const health = await this.repository.findHealthProfile(userId);
    if (!health) {
      throw new AppError({
        statusCode: 409,
        code: 'HEALTH_PROFILE_INCOMPLETE',
        message: 'B?n c?n b? sung th�ng tin s?c kh?e tru?c khi t?o th?c don tu?n.',
      });
    }
    const weekStart = dateFromDateOnly(input.weekStart);
    const dates = buildWeeklySlotBlueprint(weekStart)
      .filter((slot) => slot.mealType === MealType.BREAKFAST)
      .map((slot) => slot.date);
    const profile = await this.contentRepository.findSearchProfile(userId);
    this.assertPeriodicSchedule(profile, dates);

    const supersedesMealPlanId = input.supersedesMealPlanId;
    if (supersedesMealPlanId) {
      const superseded = await this.repository.findOwnedPlan(userId, supersedesMealPlanId);
      if (!superseded || dateOnly(superseded.weekStart) !== input.weekStart) {
        throw new AppError({
          statusCode: 409,
          code: 'MEAL_PLAN_SUPERSEDES_INVALID',
          message: 'Plan du?c regenerate ph?i thu?c c�ng user v� c�ng tu?n',
        });
      }
    }

    const targetCalories = Math.round(
      Number(health.tdee) * this.config.mealPlanGoalFactors[input.goal],
    );
    const macroTargets = estimateMealMacroTargets(targetCalories, this.config.mealPlanMacroTargets);
    const dayContexts = await Promise.all(
      dates.map(async (date) => {
        const day = dateOnly(date);
        const context = buildAuthenticatedSearchConstraints(profile, undefined, day);
        const candidates = await this.contentRepository.findMealPlannerCandidates(
          context.constraints,
        );
        return { date, day, context, candidates };
      }),
    );
    const allCandidates = [
      ...new Map(
        dayContexts
          .flatMap(({ candidates }) => candidates)
          .map((candidate) => [candidate.id, candidate]),
      ).values(),
    ];
    const ranking = await this.recommendationService.rankPublishedRecipes(userId, allCandidates);
    const seedHash = sha256(input.seed ?? `${userId}:${input.weekStart}:${input.goal}`);
    const useCounts = new Map<string, number>();
    const coveredIngredients = new Set<string>();
    const slots: PlannedSlot[] = [];
    let position = 0;
    for (const dayContext of dayContexts) {
      const selectedDay = this.selectDailyCombination(
        dayContext.candidates,
        ranking,
        useCounts,
        coveredIngredients,
        seedHash,
        dayContext.day,
        targetCalories,
        macroTargets,
      );
      for (const [index, mealType] of WEEKLY_MEAL_ORDER.entries()) {
        const target = Math.round(targetCalories * MEAL_SPLITS[mealType]);
        const selected = selectedDay?.[index] ?? null;
        if (!selected) {
          slots.push({
            data: {
              date: dayContext.date,
              mealType,
              position: position++,
              status: MealSlotStatus.UNFILLED,
              targetCalories: target,
              reasonCodes: ['NO_HARD_COMPATIBLE_CANDIDATE'],
              warningCodes: ['UNFILLED_SLOT'],
            },
            revision: null,
          });
          continue;
        }
        const revision = selected.post.publishedRevision!;
        const baseCalories = revision.recipeDetail!.calories;
        const calories =
          baseCalories === null ? null : Math.max(1, Math.round(baseCalories * selected.servings));
        useCounts.set(selected.post.id, (useCounts.get(selected.post.id) ?? 0) + 1);
        for (const ingredient of revision.ingredients) {
          if (ingredient.ingredientId) coveredIngredients.add(ingredient.ingredientId);
        }
        slots.push({
          data: {
            date: dayContext.date,
            mealType,
            position: position++,
            status: MealSlotStatus.FILLED,
            recipeId: selected.post.id,
            recipeRevisionId: revision.id,
            servings: selected.servings,
            targetCalories: target,
            ...(calories === null ? {} : { calories }),
            ...(calories === null
              ? {}
              : {
                  tolerancePercent: Number(
                    ((Math.abs(calories - target) / target) * 100).toFixed(2),
                  ),
                }),
            reasonCodes: selected.reasonCodes,
            warningCodes: selected.warningCodes,
          },
          revision,
        });
      }
    }

    const aggregate = this.aggregate(slots);
    const constraintSnapshot = {
      timezone: 'Asia/Ho_Chi_Minh',
      days: dayContexts.map(({ day, context }) => ({ date: day, ...context.summary })),
      calorieTolerance: { initialPercent: 15, maximumPercent: 20 },
      maxRecipeUses: MAX_RECIPE_USES,
      estimatedNutritionTargets: macroTargets,
    };
    const explanation = this.explanation(slots, targetCalories, input.goal);
    try {
      const created = await this.repository.createPlan({
        userId,
        weekStart,
        goal: input.goal,
        targetCalories,
        ...(supersedesMealPlanId ? { supersedesMealPlanId } : {}),
        idempotencyKey: input.idempotencyKey,
        payloadHash,
        seedHash,
        algorithmVersion: MEAL_PLAN_ALGORITHM_VERSION,
        recommendationVersion: RECOMMENDATION_SCORING_VERSION,
        constraintSnapshot: constraintSnapshot as unknown as Prisma.InputJsonValue,
        warnings: aggregate.warnings,
        nutritionDataQuality: aggregate.nutrition.quality,
        micronutrientSummary: aggregate.nutrition.summary,
        explanation,
        items: slots.map((slot) => slot.data),
        shoppingItems: aggregate.shopping.items,
      });
      if (created.payloadHash !== payloadHash) throw this.idempotencyConflict();
      return this.outputWithAnalysis(userId, created);
    } catch (error) {
      if (error instanceof MealPlanIdempotencyConflictError) throw this.idempotencyConflict();
      if (!this.repository.isUniqueConstraintError(error)) throw error;
      const raced = await this.repository.findByIdempotency(userId, input.idempotencyKey);
      if (raced?.payloadHash === payloadHash) return this.outputWithAnalysis(userId, raced);
      throw this.idempotencyConflict();
    }
  }

  async list(userId: string, query: MealPlanListQuery) {
    const result = await this.repository.listOwnedPlans(
      userId,
      query.page,
      query.limit,
      query.weekStart ? dateFromDateOnly(query.weekStart) : undefined,
    );
    return {
      data: result.records.map((record) => this.summary(record)),
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
      },
    };
  }

  async get(userId: string, id: string) {
    const plan = await this.repository.findOwnedPlan(userId, id);
    if (!plan) throw this.notFound();
    return this.outputWithAnalysis(userId, plan);
  }

  async swap(userId: string, planId: string, itemId: string, input: SwapMealPlanItemInput) {
    const payloadHash = sha256({
      planId,
      itemId,
      expectedVersion: input.expectedVersion,
      seed: input.seed ?? null,
    });
    const existingMutation = await this.repository.findMutationByIdempotency(
      userId,
      input.idempotencyKey,
    );
    if (existingMutation) {
      if (existingMutation.payloadHash !== payloadHash) throw this.idempotencyConflict();
      const plan = await this.repository.findOwnedPlan(userId, existingMutation.mealPlanId);
      if (!plan) throw this.notFound();
      return this.outputWithAnalysis(userId, plan);
    }
    const plan = await this.repository.findOwnedPlan(userId, planId);
    if (!plan) throw this.notFound();
    if (plan.lockVersion !== input.expectedVersion) throw this.versionConflict();
    const item = plan.items.find((candidate) => candidate.id === itemId);
    if (!item) throw this.notFound();
    const profile = await this.contentRepository.findSearchProfile(userId);
    const context = buildAuthenticatedSearchConstraints(profile, undefined, dateOnly(item.date));
    const candidates = (
      await this.contentRepository.findMealPlannerCandidates(context.constraints)
    ).filter((candidate) => candidate.id !== item.recipeId);
    const ranking = await this.recommendationService.rankPublishedRecipes(userId, candidates);
    const counts = new Map<string, number>();
    for (const current of plan.items) {
      if (current.id !== item.id && current.recipeId)
        counts.set(current.recipeId, (counts.get(current.recipeId) ?? 0) + 1);
    }
    const originalCalories = item.calories ?? item.targetCalories;
    const strict = candidates.filter((candidate) => {
      const candidateCalories = candidate.publishedRevision!.recipeDetail!.calories;
      return candidateCalories !== null && Math.abs(candidateCalories - originalCalories) <= 100;
    });
    let widened = false;
    let pool = strict.filter((candidate) => (counts.get(candidate.id) ?? 0) < MAX_RECIPE_USES);
    if (!pool.length) {
      widened = true;
      pool = candidates.filter((candidate) => {
        const calories = candidate.publishedRevision!.recipeDetail!.calories;
        return (
          calories !== null &&
          Math.abs(calories - item.targetCalories) / item.targetCalories <= EXPANDED_TOLERANCE &&
          (counts.get(candidate.id) ?? 0) < MAX_RECIPE_USES
        );
      });
    }
    if (!pool.length) pool = candidates;
    if (!pool.length) {
      throw new AppError({
        statusCode: 409,
        code: 'NO_ELIGIBLE_RECIPE',
        message:
          'Chua t�m th?y m�n thay th? v?a ph� h?p v?i y�u c?u an u?ng c?a b?n v?a g?n m?c nang lu?ng c?a b?a hi?n t?i.',
      });
    }
    const seedHash = sha256(input.seed ?? `${plan.seedHash}:${item.id}:${input.idempotencyKey}`);
    pool.sort((a, b) => {
      const aRanking = ranking.get(a.id)?.score ?? 0;
      const bRanking = ranking.get(b.id)?.score ?? 0;
      const behavior = bRanking - aRanking;
      if (behavior) return behavior;
      const aCalories = a.publishedRevision!.recipeDetail!.calories;
      const bCalories = b.publishedRevision!.recipeDetail!.calories;
      const calorie =
        (aCalories === null
          ? Number.POSITIVE_INFINITY
          : Math.abs(aCalories - item.targetCalories)) -
        (bCalories === null ? Number.POSITIVE_INFINITY : Math.abs(bCalories - item.targetCalories));
      return calorie || sha256(`${seedHash}:${a.id}`).localeCompare(sha256(`${seedHash}:${b.id}`));
    });
    const replacement = pool[0]!;
    const revision = replacement.publishedRevision!;
    const calories = revision.recipeDetail!.calories;
    const replacementWarnings: MealPlanWarningCode[] = widened ? ['CALORIE_TOLERANCE_WIDENED'] : [];
    if (
      calories === null ||
      Math.abs(calories - item.targetCalories) / item.targetCalories > EXPANDED_TOLERANCE
    )
      replacementWarnings.push('NUTRITION_TARGET_OUTSIDE_TOLERANCE');
    if ((counts.get(replacement.id) ?? 0) > 0) replacementWarnings.push('RECIPE_REPEATED');
    const slots = plan.items.map<PlannedSlot>((current) => ({
      data: {
        date: current.date,
        mealType: current.mealType,
        position: current.position,
        status: current.status,
        sourceType: current.sourceType,
        ...(current.recipeId ? { recipeId: current.recipeId } : {}),
        ...(current.recipeRevisionId ? { recipeRevisionId: current.recipeRevisionId } : {}),
        ...(current.customMealId ? { customMealId: current.customMealId } : {}),
        ...(current.customMealSnapshot ? { customMealSnapshot: current.customMealSnapshot } : {}),
        servings: Number(current.servings),
        targetCalories: current.targetCalories,
        ...(current.calories ? { calories: current.calories } : {}),
        ...(current.tolerancePercent ? { tolerancePercent: Number(current.tolerancePercent) } : {}),
        reasonCodes: stringList(current.reasonCodes),
        warningCodes: warningList(current.warningCodes),
      },
      revision:
        current.recipeRevision ??
        (current.customMeal
          ? {
              recipeDetail: {
                vitaminB12Mcg: null,
                proteinGrams: current.customMeal.userProteinGrams,
                fiberGrams: current.customMeal.userFiberGrams,
                fatGrams: current.customMeal.userFatGrams,
                carbsGrams: current.customMeal.userCarbsGrams,
              },
              ingredients: current.customMeal.ingredients.flatMap((ingredient) =>
                ingredient.ingredientId && ingredient.ingredient
                  ? [
                      {
                        ingredientId: ingredient.ingredientId,
                        amount: ingredient.amount,
                        unit: ingredient.unit,
                        ingredient: { canonicalName: ingredient.ingredient.canonicalName },
                      },
                    ]
                  : [],
              ),
            }
          : null),
    }));
    const replacementIndex = slots.findIndex((slot) => slot.data.position === item.position);
    slots[replacementIndex] = {
      data: {
        date: item.date,
        mealType: item.mealType,
        position: item.position,
        status: MealSlotStatus.FILLED,
        recipeId: replacement.id,
        recipeRevisionId: revision.id,
        targetCalories: item.targetCalories,
        ...(calories === null ? {} : { calories }),
        ...(calories === null
          ? {}
          : {
              tolerancePercent: Number(
                ((Math.abs(calories - item.targetCalories) / item.targetCalories) * 100).toFixed(2),
              ),
            }),
        reasonCodes: [
          ...(ranking.get(replacement.id)?.reasonCodes.slice(0, 2) ?? []),
          'SWAP_CALORIE_MATCH',
        ].slice(0, 3),
        warningCodes: replacementWarnings,
      },
      revision,
    };
    const aggregate = this.aggregate(slots);
    try {
      const updated = await this.repository.swapItem({
        userId,
        planId,
        itemId,
        expectedVersion: input.expectedVersion,
        idempotencyKey: input.idempotencyKey,
        payloadHash,
        item: slots[replacementIndex].data,
        warnings: aggregate.warnings,
        nutritionDataQuality: aggregate.nutrition.quality,
        micronutrientSummary: aggregate.nutrition.summary,
        explanation: this.explanation(slots, plan.targetCalories, plan.goal),
        shoppingItems: aggregate.shopping.items,
      });
      return this.outputWithAnalysis(userId, updated);
    } catch (error) {
      if (error instanceof MealPlanVersionConflictError) throw this.versionConflict();
      if (error instanceof MealPlanIdempotencyConflictError) throw this.idempotencyConflict();
      if (!this.repository.isUniqueConstraintError(error)) throw error;
      const raced = await this.repository.findMutationByIdempotency(userId, input.idempotencyKey);
      if (raced?.payloadHash === payloadHash) return this.get(userId, planId);
      throw this.idempotencyConflict();
    }
  }

  async delete(userId: string, id: string, query: DeleteMealPlanQuery) {
    try {
      const found = await this.repository.softDelete(userId, id, query.expectedVersion);
      if (!found) throw this.notFound();
      return { id, deleted: true as const };
    } catch (error) {
      if (error instanceof MealPlanVersionConflictError) throw this.versionConflict();
      throw error;
    }
  }

  private selectDailyCombination(
    candidates: PublishedPostRecord[],
    ranking: Map<string, { score: number; reasonCodes: string[] }>,
    useCounts: Map<string, number>,
    coveredIngredients: Set<string>,
    seedHash: string,
    day: string,
    targetCalories: number,
    macroTargets: MealMacroValues,
  ): GeneratedCandidateSelection[] | null {
    if (!candidates.length) return null;

    const incompleteCount = (values: MealMacroValues) =>
      Object.values(values).filter((value) => value === null).length;
    const candidateScore = (candidate: PublishedPostRecord) =>
      Math.min(
        ...GENERATED_SERVING_OPTIONS.map((servings) => {
          const values = scaleMealMacroValues(revisionMacros(candidate.publishedRevision), servings);
          return (
            macroTargetDeviationScore(
              values,
              scaleMealMacroValues(macroTargets, 1 / WEEKLY_MEAL_ORDER.length),
              this.config.mealPlanMacroTargets.tolerancePercent,
            ) +
            incompleteCount(values) * INCOMPLETE_MACRO_SCORE_PENALTY +
            (useCounts.get(candidate.id) ?? 0) * WEEKLY_REUSE_SCORE_PENALTY
          );
        }),
      );
    const shortlist = [...candidates]
      .sort((a, b) => {
        const score = candidateScore(a) - candidateScore(b);
        if (score) return score;
        const behavior = (ranking.get(b.id)?.score ?? 0) - (ranking.get(a.id)?.score ?? 0);
        if (behavior) return behavior;
        return sha256(`${seedHash}:${day}:${a.id}`).localeCompare(sha256(`${seedHash}:${day}:${b.id}`));
      })
      .slice(0, MAX_DAILY_COMBINATION_CANDIDATES);
    const options = shortlist.flatMap((post) =>
      GENERATED_SERVING_OPTIONS.map((servings) => ({
        post,
        servings,
        macros: scaleMealMacroValues(revisionMacros(post.publishedRevision), servings),
      })),
    );

    const totalMacros = (combination: typeof options): MealMacroValues => {
      const total = (key: keyof MealMacroValues) => {
        const values = combination.map((option) => option.macros[key]);
        return values.some((value) => value === null)
          ? null
          : Number(values.reduce<number>((sum, value) => sum + Number(value), 0).toFixed(2));
      };
      return {
        proteinGrams: total('proteinGrams'),
        fiberGrams: total('fiberGrams'),
        fatGrams: total('fatGrams'),
        carbohydrateGrams: total('carbohydrateGrams'),
      };
    };
    const coverage = (combination: typeof options) =>
      combination.reduce(
        (count, option) =>
          count +
          option.post.publishedRevision!.ingredients.filter(
            (ingredient) => ingredient.ingredientId && !coveredIngredients.has(ingredient.ingredientId),
          ).length,
        0,
      );

    let best:
      | {
          combination: typeof options;
          score: number;
          coverage: number;
          behavior: number;
          calorieDeviation: number;
        }
      | undefined;
    for (const breakfast of options) {
      for (const lunch of options) {
        for (const dinner of options) {
          const combination = [breakfast, lunch, dinner];
          const macros = totalMacros(combination);
          const counts = new Map<string, number>();
          for (const option of combination)
            counts.set(option.post.id, (counts.get(option.post.id) ?? 0) + 1);
          const varietyPenalty =
            combination.reduce(
              (sum, option) => sum + (useCounts.get(option.post.id) ?? 0),
              0,
            ) * WEEKLY_REUSE_SCORE_PENALTY +
            [...counts.values()].reduce(
              (sum, count) => sum + Math.max(0, count - 1) * SAME_DAY_REPEAT_SCORE_PENALTY,
              0,
            );
          const score =
            macroTargetDeviationScore(
              macros,
              macroTargets,
              this.config.mealPlanMacroTargets.tolerancePercent,
            ) +
            incompleteCount(macros) * INCOMPLETE_MACRO_SCORE_PENALTY +
            varietyPenalty;
          const candidateCoverage = coverage(combination);
          const behavior = combination.reduce(
            (sum, option) => sum + (ranking.get(option.post.id)?.score ?? 0),
            0,
          );
          const calorieDeviation = combination.reduce((sum, option, index) => {
            const calories = option.post.publishedRevision!.recipeDetail!.calories;
            const target = Math.round(targetCalories * MEAL_SPLITS[WEEKLY_MEAL_ORDER[index]!]);
            return (
              sum +
              (calories === null
                ? Number.POSITIVE_INFINITY
                : Math.abs(calories * option.servings - target) / target)
            );
          }, 0);
          const isBetter =
            !best ||
            score < best.score ||
            (score === best.score &&
              (candidateCoverage > best.coverage ||
                (candidateCoverage === best.coverage &&
                  (behavior > best.behavior ||
                    (behavior === best.behavior && calorieDeviation < best.calorieDeviation)))));
          const isExactTie =
            best &&
            score === best.score &&
            candidateCoverage === best.coverage &&
            behavior === best.behavior &&
            calorieDeviation === best.calorieDeviation;
          const resolvesExactTie =
            isExactTie &&
            best !== undefined &&
            sha256(
              `${seedHash}:${day}:${combination
                .map((option) => `${option.post.id}:${option.servings}`)
                .join(':')}`,
            ) <
              sha256(
                `${seedHash}:${day}:${best.combination
                  .map((option) => `${option.post.id}:${option.servings}`)
                  .join(':')}`,
              );
          if (isBetter || resolvesExactTie) {
            best = { combination, score, coverage: candidateCoverage, behavior, calorieDeviation };
          }
        }
      }
    }
    if (!best) return null;

    const runningUses = new Map(useCounts);
    return best.combination.map((option, index) => {
      const previousUses = runningUses.get(option.post.id) ?? 0;
      runningUses.set(option.post.id, previousUses + 1);
      const target = Math.round(targetCalories * MEAL_SPLITS[WEEKLY_MEAL_ORDER[index]!]);
      const calories = option.post.publishedRevision!.recipeDetail!.calories;
      const reasons = ranking.get(option.post.id)?.reasonCodes.slice(0, 2) ?? [];
      if (!reasons.includes('INGREDIENT_COVERAGE')) reasons.push('INGREDIENT_COVERAGE');
      return {
        post: option.post,
        servings: option.servings,
        reasonCodes: reasons.slice(0, 3),
        warningCodes: [
          ...(previousUses > 0 ? (['RECIPE_REPEATED'] as const) : []),
          ...(calories === null ||
          Math.abs(calories * option.servings - target) / target > EXPANDED_TOLERANCE
            ? (['CALORIE_TOLERANCE_WIDENED'] as const)
            : []),
        ],
      };
    });
  }

  private aggregate(slots: PlannedSlot[]) {
    const revisions = slots.map((slot) => slot.revision);
    const nutrition = nutritionSummary(revisions);
    const shopping = shoppingList(revisions);
    const warnings = new Set<MealPlanWarningCode>();
    for (const slot of slots) {
      for (const warning of warningList(slot.data.warningCodes as Prisma.JsonValue))
        warnings.add(warning);
    }
    if (nutrition.warning) warnings.add(nutrition.warning);
    if (shopping.warning) warnings.add(shopping.warning);
    return { nutrition, shopping, warnings: [...warnings].sort() };
  }

  private assertPeriodicSchedule(
    profile: Awaited<ReturnType<ContentRepository['findSearchProfile']>>,
    dates: Date[],
  ) {
    if (profile?.dietPreference?.practiceSchedule !== PracticeSchedule.PERIODIC) return;
    const weekDates = new Set(dates.map(dateOnly));
    if (profile.dietScheduleDates.some((item) => weekDates.has(dateOnly(item.date)))) return;
    throw new AppError({
      statusCode: 409,
      code: 'DIET_SCHEDULE_REQUIRED',
      message: 'Vui l�ng ch?n ng�y �p d?ng ch? d? an theo l?ch trong tu?n tru?c khi t?o th?c don.',
      fields: { availableDates: [...weekDates] },
    });
  }

  private explanation(slots: PlannedSlot[], targetCalories: number, goal: MealGoal): string {
    const filled = slots.filter((slot) => slot.data.status === MealSlotStatus.FILLED).length;
    const goalLabel = { MAINTAIN: 'gi? c�n', LOSE: 'gi?m c�n', GAIN: 'tang c�n' }[goal];
    return `Th?c don d� x?p ${filled}/${TOTAL_SLOTS} b?a cho m?c ti�u ${goalLabel}, d?a tr�n m?c nang lu?ng kho?ng ${targetCalories} kcal m?i ng�y. D? ?ng, nguy�n li?u c?n tr�nh, ch? d? an v� quy t?c truy?n th?ng c?a b?n lu�n du?c ki?m tra tru?c khi ch?n m�n.`;
  }

  private assertNoHardViolation(reasons: string[]): void {
    const unique = [...new Set(reasons)];
    if (!unique.length) return;
    throw new AppError({
      statusCode: 409,
      code: 'MEAL_PLAN_HARD_CONSTRAINT_VIOLATION',
      message:
        'M�n n�y kh�ng ph� h?p v?i �t nh?t m?t y�u c?u an u?ng b?t bu?c c?a b?n, nhu d? ?ng, nguy�n li?u c?n tr�nh, ch? d? an ho?c quy t?c truy?n th?ng. Vui l�ng ch?n m�n kh�c.',
      fields: { reasons: unique },
    });
  }

  private warningDetails(plan: MealPlanRecord, warnings: MealPlanWarningCode[]) {
    return warnings.flatMap((code) => {
      const copy = mealPlanWarningCopy(code);
      if (!copy) return [];
      const affectedSlots = plan.items
        .filter((item) => warningList(item.warningCodes).includes(code))
        .map((item) => ({
          itemId: item.id,
          date: dateOnly(item.date),
          mealType: item.mealType,
          name: item.recipeRevision?.title ?? item.customMeal?.name ?? null,
        }));
      const locations = plan.items
        .filter((item) => warningList(item.warningCodes).includes(code))
        .map((item) => planSlotLabel(item.date, item.mealType));
      const locationDetail = locations.length
        ? ` V? tr�: ${locations.join(', ')}.`
        : ' Luu � n�y �p d?ng cho danh s�ch mua s?m c?a c? tu?n.';
      return [
        {
          code,
          ...copy,
          detail: `${copy.detail}${locationDetail}`,
          suggestion: copy.suggestion,
          advisory: true as const,
          affectedSlots,
        },
      ];
    });
  }

  private userSummary(warnings: MealPlanWarningCode[]) {
    if (warnings.includes('UNFILLED_SLOT')) {
      return {
        status: 'HARD_CONSTRAINT_BLOCKED' as const,
        title: 'M?t s? b?a du?c d? tr?ng d? b?o v? y�u c?u an u?ng c?a b?n',
        detail:
          'H? th?ng kh�ng dua m�n kh�ng ph� h?p v�o th?c don. D? ?ng, nguy�n li?u c?n tr�nh, ch? d? an v� quy t?c truy?n th?ng v?n du?c gi? nguy�n.',
        suggestion: 'B?n c� th? th�m m?t m�n ph� h?p ho?c t?o l?i th?c don khi c� th�m c�ng th?c.',
        hardConstraintsPreserved: true as const,
      };
    }
    if (warnings.length > 0) {
      return {
        status: 'ADVISORY_ADJUSTMENTS' as const,
        title: 'Th?c don c� v�i g?i � b?n c� th? di?u ch?nh',
        detail:
          'Kh�ng c� m�n n�o vi ph?m y�u c?u an u?ng b?t bu?c. C�c luu � c�n l?i ch? nh?m gi�p th?c don thu?n ti?n v� da d?ng hon.',
        suggestion: 'B?n c� th? xem t?ng luu � v� di?u ch?nh n?u th?y ph� h?p.',
        hardConstraintsPreserved: true as const,
      };
    }
    return {
      status: 'NO_SERIOUS_ISSUE' as const,
      title: 'Chua th?y v?n d? nghi�m tr?ng trong th?c don',
      detail:
        'C�c m�n d� ch?n ph� h?p v?i y�u c?u an u?ng b?t bu?c theo th�ng tin hi?n c�. Ch? s? dinh du?ng v?n l� s? li?u u?c t�nh.',
      suggestion: null,
      hardConstraintsPreserved: true as const,
    };
  }

  private summary(plan: MealPlanRecord) {
    const micronutrientSummary =
      plan.micronutrientSummary &&
      typeof plan.micronutrientSummary === 'object' &&
      !Array.isArray(plan.micronutrientSummary)
        ? plan.micronutrientSummary
        : {};
    const warnings = userFacingWarningList(plan.warnings);
    return {
      id: plan.id,
      weekStart: dateOnly(plan.weekStart),
      goal: plan.goal,
      targetCalories: plan.targetCalories,
      version: plan.version,
      lockVersion: plan.lockVersion,
      supersedesMealPlanId: plan.supersedesMealPlanId,
      algorithmVersion: plan.algorithmVersion,
      recommendationVersion: plan.recommendationVersion,
      warnings,
      warningDetails: this.warningDetails(plan, warnings),
      userSummary: this.userSummary(warnings),
      nutritionDataQuality: plan.nutritionDataQuality,
      micronutrientSummary: {
        vitaminB12Mcg:
          typeof micronutrientSummary.vitaminB12Mcg === 'number'
            ? micronutrientSummary.vitaminB12Mcg
            : null,
        recipesWithData:
          typeof micronutrientSummary.recipesWithData === 'number'
            ? micronutrientSummary.recipesWithData
            : 0,
        filledRecipeCount:
          typeof micronutrientSummary.filledRecipeCount === 'number'
            ? micronutrientSummary.filledRecipeCount
            : 0,
      },
      explanation: plan.explanation,
      filledSlots: plan.items.filter((item) => item.status === MealSlotStatus.FILLED).length,
      totalSlots: TOTAL_SLOTS,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  private output(plan: MealPlanRecord) {
    const constraintSnapshot =
      plan.constraintSnapshot &&
      typeof plan.constraintSnapshot === 'object' &&
      !Array.isArray(plan.constraintSnapshot)
        ? plan.constraintSnapshot
        : {};
    const items = plan.items.map((item) => {
      const reasonCodes = stringList(item.reasonCodes);
      const macros = this.itemMacros(item);
      return {
        id: item.id,
        date: dateOnly(item.date),
        mealType: item.mealType,
        position: item.position,
        status: item.status,
        sourceType: item.sourceType,
        servings: Number(item.servings),
        targetCalories: item.targetCalories,
        calories: item.calories,
        tolerancePercent: item.tolerancePercent ? Number(item.tolerancePercent) : null,
        proteinGrams: macros.proteinGrams,
        fiberGrams: macros.fiberGrams,
        fatGrams: macros.fatGrams,
        carbohydrateGrams: macros.carbohydrateGrams,
        recipe:
          item.recipe && item.recipeRevision?.recipeDetail
            ? {
                id: item.recipe.id,
                revisionId: item.recipeRevision.id,
                slug: item.recipe.slug,
                title: item.recipeRevision.title,
                coverImageUrl:
                  item.recipeRevision.media.find((media) => media.kind === MediaKind.COVER_IMAGE)
                    ?.secureUrl ?? null,
                difficulty: item.recipeRevision.recipeDetail.difficulty,
              }
            : null,
        customMeal: item.customMeal
          ? {
              id: item.customMeal.id,
              name: item.customMeal.name,
              nutritionCoverage: item.customMeal.nutritionCoverage,
            }
          : null,
        reasonCodes,
        warningCodes: userFacingWarningList(item.warningCodes),
        unresolved:
          item.status === MealSlotStatus.UNFILLED
            ? {
                code: reasonCodes[0] ?? 'NO_HARD_COMPATIBLE_CANDIDATE',
                reason:
                  'Chua t�m th?y m�n ph� h?p v?i d? ?ng, nguy�n li?u c?n tr�nh, ch? d? an v� quy t?c truy?n th?ng c?a b?n. B?a n�y du?c d? tr?ng thay v� t? th�m m�n kh�ng ph� h?p.',
                hardConstraintsPreserved: true as const,
              }
            : null,
      };
    });
    const dayNames = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ] as const;
    const dates = buildWeeklySlotBlueprint(plan.weekStart)
      .filter((slot) => slot.mealType === MealType.BREAKFAST)
      .map((slot) => slot.date);
    const estimatedNutritionTargets = estimateMealMacroTargets(
      plan.targetCalories,
      this.config.mealPlanMacroTargets,
    );
    const days = dates.map((date, index) => {
      const dateValue = dateOnly(date);
      const records = plan.items.filter((item) => dateOnly(item.date) === dateValue);
      const outputItems = items.filter((item) => item.date === dateValue);
      const findSlot = (mealType: MealType) =>
        outputItems.find((item) => item.mealType === mealType)!;
      const macroValues = records.reduce(
        (total, item) => addMealMacroValues(total, this.itemMacros(item)),
        emptyMealMacroValues(),
      );
      const knownMetricCount = Object.values(macroValues).filter((value) => value !== null).length;
      const estimatedTotals = {
        ...macroValues,
        estimated: true as const,
        confidence: knownMetricCount === 4 ? 0.9 : knownMetricCount > 0 ? 0.6 : 0.2,
        uncertaintyNotes:
          knownMetricCount === 4
            ? []
            : [
                'M?t s? m�n chua c� d? d? li?u d? u?c t�nh ch?t d?m, ch?t xo, ch?t b�o v� tinh b?t. C�c ch? s? trong ng�y c� th? th?p hon th?c t?.',
              ],
      };
      return {
        date: dateValue,
        dayOfWeek: dayNames[index]!,
        slots: {
          breakfast: findSlot(MealType.BREAKFAST),
          lunch: findSlot(MealType.LUNCH),
          dinner: findSlot(MealType.DINNER),
        },
        estimatedTotals,
      };
    });
    return {
      ...this.summary(plan),
      constraintSnapshot,
      items,
      days,
      estimatedNutritionTargets,
      shoppingList: plan.shoppingItems.map((item) => ({
        ingredientId: item.ingredientId,
        canonicalName: item.canonicalName,
        amount: Number(item.amount),
        unit: item.unit,
        sourceItemCount: item.sourceItemCount,
      })),
    };
  }

  private itemMacros(item: MealPlanRecord['items'][number]): MealMacroValues {
    if (item.recipeRevision?.recipeDetail) {
      return scaleMealMacroValues(revisionMacros(item.recipeRevision), Number(item.servings));
    }
    if (item.customMeal) {
      const values: MealMacroValues = {
        proteinGrams:
          item.customMeal.userProteinGrams === null
            ? null
            : Number(item.customMeal.userProteinGrams),
        fiberGrams:
          item.customMeal.userFiberGrams === null ? null : Number(item.customMeal.userFiberGrams),
        fatGrams:
          item.customMeal.userFatGrams === null ? null : Number(item.customMeal.userFatGrams),
        carbohydrateGrams:
          item.customMeal.userCarbsGrams === null ? null : Number(item.customMeal.userCarbsGrams),
      };
      return scaleMealMacroValues(values, Number(item.servings) / item.customMeal.servings);
    }
    return emptyMealMacroValues();
  }

  async manualAdd(
    userId: string,
    planId: string,
    itemId: string,
    input: ManualAddMealPlanItemInput,
  ) {
    const payloadHash = sha256({ planId, itemId, ...input, idempotencyKey: undefined });
    const existingMutation = await this.repository.findMutationByIdempotency(
      userId,
      input.idempotencyKey,
    );
    if (existingMutation) {
      if (existingMutation.payloadHash !== payloadHash) throw this.idempotencyConflict();
      const existing = await this.repository.findOwnedPlan(userId, existingMutation.mealPlanId);
      if (!existing) throw this.notFound();
      return this.outputWithAnalysis(userId, existing);
    }
    const plan = await this.repository.findOwnedPlan(userId, planId);
    if (!plan) throw this.notFound();
    if (plan.lockVersion !== input.expectedVersion) throw this.versionConflict();
    const target = plan.items.find((item) => item.id === itemId);
    if (!target) throw this.notFound();
    const searchProfile = await this.contentRepository.findSearchProfile(userId);
    const constraints = buildAuthenticatedSearchConstraints(
      searchProfile,
      undefined,
      dateOnly(target.date),
    ).constraints;
    let replacement: PlannedSlot;
    if (input.sourceType === MealPlanItemSourceType.RECIPE) {
      const recipe = await this.contentRepository.findPublishedPost(input.recipeId!);
      const revision = recipe?.publishedRevision;
      if (!recipe || !revision?.recipeDetail) throw this.notFound();
      const hardReasons: string[] = [];
      const allergens = new Set(revision.recipeDetail.allergenCodes as string[]);
      if (constraints.allergenCodes.some((code) => allergens.has(code)))
        hardReasons.push('ALLERGY');
      if (
        revision.ingredients.some(
          (ingredient) =>
            (ingredient.ingredientId &&
              constraints.excludedIngredientIds.includes(ingredient.ingredientId)) ||
            constraints.excludedNormalizedNames.includes(ingredient.normalizedName),
        )
      )
        hardReasons.push('INGREDIENT_EXCLUSION');
      if (
        constraints.dietPattern &&
        revision.dietCompatibility.some(
          (entry) => entry.dietPattern === constraints.dietPattern && !entry.compatible,
        )
      )
        hardReasons.push('DIET_PATTERN');
      const traditionWarnings = Array.isArray(revision.recipeDetail.traditionWarnings)
        ? revision.recipeDetail.traditionWarnings
        : [];
      if (
        traditionWarnings.some(
          (warning) =>
            warning &&
            typeof warning === 'object' &&
            !Array.isArray(warning) &&
            typeof warning.tradition === 'string' &&
            constraints.traditions.includes(warning.tradition as never),
        )
      )
        hardReasons.push('TRADITION_RULE');
      this.assertNoHardViolation(hardReasons);
      const calories =
        revision.recipeDetail.calories === null
          ? null
          : Math.max(1, Math.round(revision.recipeDetail.calories * input.servings));
      replacement = {
        data: {
          date: target.date,
          mealType: target.mealType,
          position: target.position,
          status: MealSlotStatus.FILLED,
          sourceType: MealPlanItemSourceType.RECIPE,
          recipeId: recipe.id,
          recipeRevisionId: revision.id,
          servings: input.servings,
          targetCalories: target.targetCalories,
          ...(calories === null ? {} : { calories }),
          ...(calories === null
            ? {}
            : {
                tolerancePercent: Number(
                  (
                    (Math.abs(calories - target.targetCalories) / target.targetCalories) *
                    100
                  ).toFixed(2),
                ),
              }),
          reasonCodes: ['MANUAL_ADD'],
          warningCodes: [],
        },
        revision,
      };
    } else {
      const custom = await this.repository.findOwnedCustomMeal(userId, input.customMealId!);
      if (!custom) throw this.notFound();
      const hardReasons: string[] = [];
      for (const ingredient of custom.ingredients) {
        if (!ingredient.ingredient) {
          hardReasons.push('UNRESOLVED_INGREDIENT');
          continue;
        }
        if (
          constraints.excludedIngredientIds.includes(ingredient.ingredient.id) ||
          constraints.excludedNormalizedNames.includes(ingredient.normalizedName)
        )
          hardReasons.push('INGREDIENT_EXCLUSION');
        if (
          ingredient.ingredient.allergens.some((entry) =>
            constraints.allergenCodes.includes(entry.allergenCode),
          )
        )
          hardReasons.push('ALLERGY');
        if (
          constraints.dietPattern &&
          ingredient.ingredient.dietCompatibilities.some(
            (entry) => entry.dietPattern === constraints.dietPattern && !entry.compatible,
          )
        )
          hardReasons.push('DIET_PATTERN');
        if (
          ingredient.ingredient.traditionWarnings.some((entry) =>
            constraints.traditions.includes(entry.tradition),
          )
        )
          hardReasons.push('TRADITION_RULE');
      }
      this.assertNoHardViolation(hardReasons);
      const calories =
        custom.userCalories === null
          ? null
          : Math.max(1, Math.round((custom.userCalories / custom.servings) * input.servings));
      const snapshot = {
        id: custom.id,
        name: custom.name,
        servings: custom.servings,
        updatedAt: custom.updatedAt.toISOString(),
        ingredients: custom.ingredients.map((ingredient) => ({
          ingredientId: ingredient.ingredientId,
          displayName: ingredient.displayName,
          amount: Number(ingredient.amount),
          unit: ingredient.unit,
        })),
      };
      replacement = {
        data: {
          date: target.date,
          mealType: target.mealType,
          position: target.position,
          status: MealSlotStatus.FILLED,
          sourceType: MealPlanItemSourceType.CUSTOM_MEAL,
          customMealId: custom.id,
          customMealSnapshot: snapshot,
          servings: input.servings,
          targetCalories: target.targetCalories,
          ...(calories === null ? {} : { calories }),
          ...(calories === null
            ? {}
            : {
                tolerancePercent: Number(
                  (
                    (Math.abs(calories - target.targetCalories) / target.targetCalories) *
                    100
                  ).toFixed(2),
                ),
              }),
          reasonCodes: ['MANUAL_ADD'],
          warningCodes: [],
        },
        revision: {
          recipeDetail: {
            vitaminB12Mcg: null,
            proteinGrams: custom.userProteinGrams,
            fiberGrams: custom.userFiberGrams,
            fatGrams: custom.userFatGrams,
            carbsGrams: custom.userCarbsGrams,
          },
          ingredients: custom.ingredients.flatMap((ingredient) =>
            ingredient.ingredientId && ingredient.ingredient
              ? [
                  {
                    ingredientId: ingredient.ingredientId,
                    amount: ingredient.amount,
                    unit: ingredient.unit,
                    ingredient: { canonicalName: ingredient.ingredient.canonicalName },
                  },
                ]
              : [],
          ),
        },
      };
    }
    const slots = plan.items.map<PlannedSlot>((current) => ({
      data: {
        date: current.date,
        mealType: current.mealType,
        position: current.position,
        status: current.status,
        sourceType: current.sourceType,
        ...(current.recipeId ? { recipeId: current.recipeId } : {}),
        ...(current.recipeRevisionId ? { recipeRevisionId: current.recipeRevisionId } : {}),
        ...(current.customMealId ? { customMealId: current.customMealId } : {}),
        ...(current.customMealSnapshot ? { customMealSnapshot: current.customMealSnapshot } : {}),
        servings: Number(current.servings),
        targetCalories: current.targetCalories,
        ...(current.calories ? { calories: current.calories } : {}),
        ...(current.tolerancePercent ? { tolerancePercent: Number(current.tolerancePercent) } : {}),
        reasonCodes: stringList(current.reasonCodes),
        warningCodes: warningList(current.warningCodes),
      },
      revision:
        current.recipeRevision ??
        (current.customMeal
          ? {
              recipeDetail: {
                vitaminB12Mcg: null,
                proteinGrams: current.customMeal.userProteinGrams,
                fiberGrams: current.customMeal.userFiberGrams,
                fatGrams: current.customMeal.userFatGrams,
                carbsGrams: current.customMeal.userCarbsGrams,
              },
              ingredients: current.customMeal.ingredients.flatMap((ingredient) =>
                ingredient.ingredientId && ingredient.ingredient
                  ? [
                      {
                        ingredientId: ingredient.ingredientId,
                        amount: ingredient.amount,
                        unit: ingredient.unit,
                        ingredient: { canonicalName: ingredient.ingredient.canonicalName },
                      },
                    ]
                  : [],
              ),
            }
          : null),
    }));
    const index = slots.findIndex((slot) => slot.data.position === target.position);
    slots[index] = replacement;
    const aggregate = this.aggregate(slots);
    try {
      const updated = await this.repository.manualAddItem({
        userId,
        planId,
        itemId,
        expectedVersion: input.expectedVersion,
        idempotencyKey: input.idempotencyKey,
        payloadHash,
        item: replacement.data,
        warnings: aggregate.warnings,
        nutritionDataQuality: aggregate.nutrition.quality,
        micronutrientSummary: aggregate.nutrition.summary,
        explanation: this.explanation(slots, plan.targetCalories, plan.goal),
        shoppingItems: aggregate.shopping.items,
      });
      return this.outputWithAnalysis(userId, updated);
    } catch (error) {
      if (error instanceof MealPlanVersionConflictError) throw this.versionConflict();
      if (error instanceof MealPlanIdempotencyConflictError) throw this.idempotencyConflict();
      throw error;
    }
  }

  private async outputWithAnalysis(userId: string, plan: MealPlanRecord) {
    let analysis;
    try {
      analysis = await this.mealAnalysisService.getCurrent(userId, plan.id);
    } catch (error) {
      if (
        !(error instanceof AppError) ||
        !['NOT_FOUND', 'MEAL_ANALYSIS_STALE'].includes(error.code)
      )
        throw error;
      analysis = await this.mealAnalysisService.analyzeDefault(userId, plan.id, plan.lockVersion);
    }
    return { ...this.output(plan), analysis };
  }

  private notFound() {
    return new AppError({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Kh�ng t�m th?y th?c don',
    });
  }

  private versionConflict() {
    return new AppError({
      statusCode: 409,
      code: 'MEAL_PLAN_VERSION_CONFLICT',
      message: 'Th?c don d� thay d?i. Vui l�ng t?i l?i tru?c khi thao t�c.',
    });
  }

  private idempotencyConflict() {
    return new AppError({
      statusCode: 409,
      code: 'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      message: 'Y�u c?u n�y d� du?c g?i tru?c d� v?i n?i dung kh�c. Vui l�ng t?i l?i r?i th? l?i.',
    });
  }
}
