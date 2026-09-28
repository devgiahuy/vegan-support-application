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
import type { AppConfig } from '../../config/env.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
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

const STRICT_TOLERANCE = 0.15;
const EXPANDED_TOLERANCE = 0.2;
const MAX_RECIPE_USES = 2;
const TOTAL_SLOTS = 21 as const;
const MEAL_SPLITS: Record<MealType, number> = {
  [MealType.BREAKFAST]: 0.25,
  [MealType.LUNCH]: 0.4,
  [MealType.DINNER]: 0.35,
};
const MEAL_ORDER = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER] as const;

interface RevisionNutritionSnapshot {
  recipeDetail: { vitaminB12Mcg: Prisma.Decimal | null } | null;
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

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function dateFromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
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
  ]);
  return stringList(value).filter((code): code is MealPlanWarningCode =>
    allowed.has(code as MealPlanWarningCode),
  );
}

function normalizedUnit(unit: string): { unit: string; factor: number } {
  const normalized = normalizeVietnameseText(unit);
  if (['kg', 'kilogram'].includes(normalized)) return { unit: 'g', factor: 1_000 };
  if (['g', 'gram'].includes(normalized)) return { unit: 'g', factor: 1 };
  if (['l', 'lit', 'liter'].includes(normalized)) return { unit: 'ml', factor: 1_000 };
  if (['ml', 'mililit'].includes(normalized)) return { unit: 'ml', factor: 1 };
  return { unit: normalized || unit.trim().toLowerCase(), factor: 1 };
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
    warning:
      quality === NutritionDataQuality.UNAVAILABLE
        ? ('MICRONUTRIENT_DATA_UNAVAILABLE' as const)
        : quality === NutritionDataQuality.PARTIAL
          ? ('MICRONUTRIENT_DATA_PARTIAL' as const)
          : null,
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
      const conversion = normalizedUnit(ingredient.unit);
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
        message: 'Cần hoàn thiện health profile trước khi tạo meal plan',
      });
    }
    const weekStart = dateFromDateOnly(input.weekStart);
    const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const profile = await this.contentRepository.findSearchProfile(userId);
    this.assertPeriodicSchedule(profile, dates);

    const supersedesMealPlanId = input.supersedesMealPlanId;
    if (supersedesMealPlanId) {
      const superseded = await this.repository.findOwnedPlan(userId, supersedesMealPlanId);
      if (!superseded || dateOnly(superseded.weekStart) !== input.weekStart) {
        throw new AppError({
          statusCode: 409,
          code: 'MEAL_PLAN_SUPERSEDES_INVALID',
          message: 'Plan được regenerate phải thuộc cùng user và cùng tuần',
        });
      }
    }

    const targetCalories = Math.round(
      Number(health.tdee) * this.config.mealPlanGoalFactors[input.goal],
    );
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
      for (const mealType of MEAL_ORDER) {
        const target = Math.round(targetCalories * MEAL_SPLITS[mealType]);
        const selected = this.selectCandidate(
          dayContext.candidates,
          target,
          ranking,
          useCounts,
          coveredIngredients,
          seedHash,
          `${dayContext.day}:${mealType}`,
        );
        if (!selected) {
          slots.push({
            data: {
              date: dayContext.date,
              mealType,
              position: position++,
              status: MealSlotStatus.UNFILLED,
              targetCalories: target,
              reasonCodes: [],
              warningCodes: ['UNFILLED_SLOT'],
            },
            revision: null,
          });
          continue;
        }
        const revision = selected.post.publishedRevision!;
        const calories = revision.recipeDetail!.calories!;
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
            targetCalories: target,
            calories,
            tolerancePercent: Number(((Math.abs(calories - target) / target) * 100).toFixed(2)),
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
        constraintSnapshot,
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
    const strict = candidates.filter(
      (candidate) =>
        Math.abs(candidate.publishedRevision!.recipeDetail!.calories! - originalCalories) <= 100,
    );
    let widened = false;
    let pool = strict.filter((candidate) => (counts.get(candidate.id) ?? 0) < MAX_RECIPE_USES);
    if (!pool.length) {
      widened = true;
      pool = candidates.filter((candidate) => {
        const calories = candidate.publishedRevision!.recipeDetail!.calories!;
        return (
          Math.abs(calories - item.targetCalories) / item.targetCalories <= EXPANDED_TOLERANCE &&
          (counts.get(candidate.id) ?? 0) < MAX_RECIPE_USES
        );
      });
    }
    if (!pool.length) {
      throw new AppError({
        statusCode: 409,
        code: 'NO_ELIGIBLE_RECIPE',
        message: 'Không có recipe thay thế nào giữ được hard constraints và calorie tolerance',
      });
    }
    const seedHash = sha256(input.seed ?? `${plan.seedHash}:${item.id}:${input.idempotencyKey}`);
    pool.sort((a, b) => {
      const aRanking = ranking.get(a.id)?.score ?? 0;
      const bRanking = ranking.get(b.id)?.score ?? 0;
      const behavior = bRanking - aRanking;
      if (behavior) return behavior;
      const calorie =
        Math.abs(a.publishedRevision!.recipeDetail!.calories! - item.targetCalories) -
        Math.abs(b.publishedRevision!.recipeDetail!.calories! - item.targetCalories);
      return calorie || sha256(`${seedHash}:${a.id}`).localeCompare(sha256(`${seedHash}:${b.id}`));
    });
    const replacement = pool[0]!;
    const revision = replacement.publishedRevision!;
    const calories = revision.recipeDetail!.calories!;
    const replacementWarnings: MealPlanWarningCode[] = widened ? ['CALORIE_TOLERANCE_WIDENED'] : [];
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
              recipeDetail: { vitaminB12Mcg: null },
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
        calories,
        tolerancePercent: Number(
          ((Math.abs(calories - item.targetCalories) / item.targetCalories) * 100).toFixed(2),
        ),
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

  private selectCandidate(
    candidates: PublishedPostRecord[],
    target: number,
    ranking: Map<string, { score: number; reasonCodes: string[] }>,
    useCounts: Map<string, number>,
    coveredIngredients: Set<string>,
    seedHash: string,
    slotKey: string,
  ): {
    post: PublishedPostRecord;
    reasonCodes: string[];
    warningCodes: MealPlanWarningCode[];
  } | null {
    const within = (candidate: PublishedPostRecord, tolerance: number) =>
      Math.abs(candidate.publishedRevision!.recipeDetail!.calories! - target) / target <= tolerance;
    const choose = (pool: PublishedPostRecord[], widened: boolean, repeated: boolean) => {
      pool.sort((a, b) => {
        const newIngredients = (candidate: PublishedPostRecord) =>
          candidate.publishedRevision!.ingredients.filter(
            (ingredient) =>
              ingredient.ingredientId && !coveredIngredients.has(ingredient.ingredientId),
          ).length;
        const coverage = newIngredients(b) - newIngredients(a);
        if (coverage) return coverage;
        const behavior = (ranking.get(b.id)?.score ?? 0) - (ranking.get(a.id)?.score ?? 0);
        if (behavior) return behavior;
        const calorie =
          Math.abs(a.publishedRevision!.recipeDetail!.calories! - target) -
          Math.abs(b.publishedRevision!.recipeDetail!.calories! - target);
        if (calorie) return calorie;
        return sha256(`${seedHash}:${slotKey}:${a.id}`).localeCompare(
          sha256(`${seedHash}:${slotKey}:${b.id}`),
        );
      });
      const post = pool[0]!;
      const reasons = ranking.get(post.id)?.reasonCodes.slice(0, 2) ?? [];
      if (!reasons.includes('INGREDIENT_COVERAGE')) reasons.push('INGREDIENT_COVERAGE');
      return {
        post,
        reasonCodes: reasons.slice(0, 3),
        warningCodes: [
          ...(widened ? (['CALORIE_TOLERANCE_WIDENED'] as const) : []),
          ...(repeated ? (['RECIPE_REPEATED'] as const) : []),
        ],
      };
    };
    const strictUnused = candidates.filter(
      (candidate) => within(candidate, STRICT_TOLERANCE) && !useCounts.has(candidate.id),
    );
    if (strictUnused.length) return choose(strictUnused, false, false);
    const expandedUnused = candidates.filter(
      (candidate) => within(candidate, EXPANDED_TOLERANCE) && !useCounts.has(candidate.id),
    );
    if (expandedUnused.length) return choose(expandedUnused, true, false);
    const strictRepeat = candidates.filter(
      (candidate) =>
        within(candidate, STRICT_TOLERANCE) && (useCounts.get(candidate.id) ?? 0) < MAX_RECIPE_USES,
    );
    if (strictRepeat.length) return choose(strictRepeat, false, true);
    const expandedRepeat = candidates.filter(
      (candidate) =>
        within(candidate, EXPANDED_TOLERANCE) &&
        (useCounts.get(candidate.id) ?? 0) < MAX_RECIPE_USES,
    );
    return expandedRepeat.length ? choose(expandedRepeat, true, true) : null;
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
      message: 'Cần chọn ngày PERIODIC trong tuần trước khi tạo meal plan',
      fields: { availableDates: [...weekDates] },
    });
  }

  private explanation(slots: PlannedSlot[], targetCalories: number, goal: MealGoal): string {
    const filled = slots.filter((slot) => slot.data.status === MealSlotStatus.FILLED).length;
    return `Kế hoạch ${goal} deterministic: ${filled}/${TOTAL_SLOTS} bữa được lấp đầy theo mục tiêu ${targetCalories} kcal/ngày; hard constraints luôn được áp dụng trước scoring.`;
  }

  private assertNoHardViolation(reasons: string[]): void {
    const unique = [...new Set(reasons)];
    if (!unique.length) return;
    throw new AppError({
      statusCode: 409,
      code: 'MEAL_PLAN_HARD_CONSTRAINT_VIOLATION',
      message:
        'Món đã chọn vi phạm allergy, explicit exclusion, diet pattern hoặc enabled tradition rule',
      fields: { reasons: unique },
    });
  }

  private summary(plan: MealPlanRecord) {
    const micronutrientSummary =
      plan.micronutrientSummary &&
      typeof plan.micronutrientSummary === 'object' &&
      !Array.isArray(plan.micronutrientSummary)
        ? plan.micronutrientSummary
        : {};
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
      warnings: warningList(plan.warnings),
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
    return {
      ...this.summary(plan),
      constraintSnapshot,
      items: plan.items.map((item) => ({
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
        reasonCodes: stringList(item.reasonCodes),
        warningCodes: warningList(item.warningCodes),
      })),
      shoppingList: plan.shoppingItems.map((item) => ({
        ingredientId: item.ingredientId,
        canonicalName: item.canonicalName,
        amount: Number(item.amount),
        unit: item.unit,
        sourceItemCount: item.sourceItemCount,
      })),
    };
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
      const calories = Math.max(
        1,
        Math.round((revision.recipeDetail.calories ?? target.targetCalories) * input.servings),
      );
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
          calories,
          tolerancePercent: Number(
            ((Math.abs(calories - target.targetCalories) / target.targetCalories) * 100).toFixed(2),
          ),
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
          ? target.targetCalories
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
          calories,
          tolerancePercent: Number(
            ((Math.abs(calories - target.targetCalories) / target.targetCalories) * 100).toFixed(2),
          ),
          reasonCodes: ['MANUAL_ADD'],
          warningCodes: [],
        },
        revision: {
          recipeDetail: { vitaminB12Mcg: null },
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
              recipeDetail: { vitaminB12Mcg: null },
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
      message: 'Không tìm thấy meal plan',
    });
  }

  private versionConflict() {
    return new AppError({
      statusCode: 409,
      code: 'MEAL_PLAN_VERSION_CONFLICT',
      message: 'Meal plan đã thay đổi, vui lòng tải lại trước khi thao tác',
    });
  }

  private idempotencyConflict() {
    return new AppError({
      statusCode: 409,
      code: 'MEAL_PLAN_IDEMPOTENCY_CONFLICT',
      message: 'Idempotency key đã được dùng cho payload khác',
    });
  }
}
