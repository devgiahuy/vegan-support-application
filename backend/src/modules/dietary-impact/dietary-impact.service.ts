import {lockIngredientCatalog} from '../catalog/catalog-lock.js';
import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { AppError } from '../../common/errors/app-error.js';
import { lockDocument } from '../../database/locking.js';
import {
  loadIngredientSafetyCatalog,
  type IngredientSafetyCatalog,
} from '../catalog/ingredient-safety.js';
import {
  buildAuthenticatedSearchConstraints,
  buildDietaryConstraints,
  dateOnlyInSearchTimezone,
} from '../content/search-constraints.js';
import type {
  ContentRepository,
  PublishedPostRecord,
  SearchConstraints,
} from '../content/content.repository.js';
import { ProfileRepository } from '../profile/profile.repository.js';
import type { ProfileService } from '../profile/profile.service.js';
import type { SaveDietPreferencesInput } from '../profile/profile.schemas.js';
import { MealPlanRepository, mealPlanInclude, type MealPlanRecord } from '../meal-plans/meal-plan.repository.js';
import type { RecommendationService } from '../recommendations/recommendation.service.js';
import {
  aggregateRepair,
  itemName,
  jsonInput,
  sumNutrition,
} from './dietary-impact.calculations.js';
import {
  repairApplySchema,
  repairPlanSchema,
  type AffectedMeal,
  type Compatibility,
  type DietaryImpact,
  type ProgramReference,
  type RepairApplyInput,
  type RepairPlan,
  type RepairPreviewInput,
  type RepairResult,
} from './dietary-impact.schemas.js';

const unknownReasons = new Set([
  'UNRESOLVED_INGREDIENT',
  'INGREDIENT_COMPOSITION_UNCERTAIN',
  'INGREDIENT_DIETARY_UNCERTAIN',
  'SOURCE_UNAVAILABLE',
  'ALLERGEN_SELECTION_UNRESOLVED',
]);
const storedReplacement = z
  .object({ itemId: z.string().uuid(), recipeId: z.string().uuid(), revisionId: z.string().uuid() })
  .strict();
const storedPlan = z
  .object({
    view: repairPlanSchema,
    planFingerprint: z.string(),
    replacements: z.array(storedReplacement),
  })
  .strict();
const proposalPayload = z
  .object({
    dietaryRevision: z.number().int().positive(),
    profileFingerprint: z.string(),
    catalogFingerprint: z.string(),
    assessedFrom: z.string(),
    plans: z.array(storedPlan),
  })
  .strict();
type StoredPlan = z.infer<typeof storedPlan>;
function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function day(date: Date) {
  return date.toISOString().slice(0, 10);
}
function planFingerprint(plan: MealPlanRecord) {
  return hash(
    plan.items.map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      recipeRevisionId: item.recipeRevisionId,
      servings: item.servings,
      customUpdatedAt: item.customMeal?.updatedAt,
      customIngredients: item.customMeal?.ingredients.map((i) => [
        i.ingredientId,
        i.normalizedName,
        Number(i.amount),
        i.unit,
      ]),
    })),
  );
}
function conflict(message = 'Thiết lập hoặc thực đơn đã thay đổi. Vui lòng tải lại phương án.') {
  return new AppError({ statusCode: 409, code: 'DIET_REPAIR_CONFLICT', message });
}
function notFound() {
  return new AppError({
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Không tìm thấy thực đơn hoặc phương án thuộc tài khoản của bạn.',
  });
}
function fingerprint(constraints: SearchConstraints) {
  return hash({
    ...constraints,
    allergenCodes: [...constraints.allergenCodes].sort(),
    allergicIngredientIds: [...(constraints.allergicIngredientIds ?? [])].sort(),
    excludedIngredientIds: [...constraints.excludedIngredientIds].sort(),
    excludedNormalizedNames: [...constraints.excludedNormalizedNames].sort(),
  });
}

export class DietaryImpactService {
  private readonly plans: MealPlanRepository;
  constructor(
    private readonly database: PrismaClient,
    private readonly profiles: ProfileService,
    private readonly content: ContentRepository,
    private readonly ranking: RecommendationService,
  ) {
    this.plans = new MealPlanRepository(database);
  }

  private async context(userId: string) {
    const profile = await this.content.findSearchProfile(userId);
    if (!profile) throw notFound();
    const assessedFrom = dateOnlyInSearchTimezone(new Date());
    const { constraints } = buildAuthenticatedSearchConstraints(profile, undefined, assessedFrom);
    return {
      constraints,
      assessedFrom,
      dietaryRevision: profile.dietPreference?.dietaryRevision ?? 0,
    };
  }

  async preview(userId: string, input: SaveDietPreferencesInput): Promise<DietaryImpact> {
    const normalized = await this.profiles.validateDietPreferences(userId, input);
    const existing = await new ProfileRepository(this.database).findProfile(userId);
    if (!existing) throw notFound();
    const constraints = buildDietaryConstraints(normalized.input, {
      allergenCodes: normalized.input.allergies.map((a) => a.allergenCode),
      allergicIngredientIds:
        normalized.input.ingredientAllergies?.map((a) => a.ingredientId) ??
        existing.ingredientAllergies.map((a) => a.ingredientId),
      excludedIngredientIds: normalized.exclusions.flatMap((e) =>
        e.ingredientId ? [e.ingredientId] : [],
      ),
      excludedNormalizedNames: normalized.exclusions.map((e) => e.normalizedName),
    });
    const current=await this.context(userId);
    if(fingerprint(current.constraints)===fingerprint(constraints))return {dietaryRevision:input.expectedDietaryRevision,assessedFrom:current.assessedFrom,affectedPlanCount:0,affectedMealCount:0,plans:[]};
    return this.collect(
      userId,
      constraints,
      input.expectedDietaryRevision,
      dateOnlyInSearchTimezone(new Date()),
    );
  }

  async current(userId: string): Promise<DietaryImpact> {
    const context = await this.context(userId);
    return this.collect(userId, context.constraints, context.dietaryRevision, context.assessedFrom);
  }

  private async collect(
    userId: string,
    constraints: SearchConstraints,
    dietaryRevision: number,
    assessedFrom: string,
  ): Promise<DietaryImpact> {
    const rows = await this.database.mealPlan.findMany({
      where: {
        userId,
        deletedAt: null,
        items: { some: { date: { gte: new Date(assessedFrom + 'T00:00:00.000Z') } } },
      },
      select: { id: true, supersededBy: { where: { deletedAt: null }, select: { id: true } } },
    });
    const catalog = await this.content.safetyCatalog();
    const plans: DietaryImpact['plans'] = [];
    for (const row of rows) {
      const programs = await this.programReferences(userId, row.id);
      if (row.supersededBy.length && !programs.length) continue;
      const allRefs = await this.database.mealProgramWeekAlternative.findMany({
        where: { mealPlanId: row.id },
        select: {
          rank: true,
          week: { select: { selectedAlternativeRank: true, mealProgramId: true } },
        },
      });
      if (allRefs.length && !allRefs.some((ref) => ref.rank === ref.week.selectedAlternativeRank))
        continue;
      const plan = await this.requirePlan(userId, row.id);
      const assessment = this.assess(plan, constraints, catalog, dietaryRevision, assessedFrom);
      if (!assessment.affectedMealCount) continue;
      plans.push({
        planId: plan.id,
        weekStart: day(plan.weekStart),
        expectedVersion: plan.lockVersion,
        status: assessment.status,
        items: assessment.items,
        programs,
        canRepair: programs.every((program) => program.status !== 'CONFIRMED'),
      });
    }
    return {
      dietaryRevision,
      assessedFrom,
      affectedPlanCount: plans.length,
      affectedMealCount: plans.reduce((total, plan) => total + plan.items.length, 0),
      plans,
    };
  }

  async planCompatibility(userId: string, planId: string): Promise<Compatibility> {
    const context = await this.context(userId);
    return this.assess(
      await this.requirePlan(userId, planId),
      context.constraints,
      await this.content.safetyCatalog(),
      context.dietaryRevision,
      context.assessedFrom,
    );
  }

  async programCompatibility(userId: string, programId: string): Promise<Compatibility> {
    const program = await this.database.mealProgram.findFirst({
      where: { id: programId, userId },
      include: { weeks: { include: { alternatives: true } } },
    });
    if (!program) throw notFound();
    const context = await this.context(userId);
    const catalog = await this.content.safetyCatalog();
    const items = new Map<string, AffectedMeal>();
    let historical = true;
    for (const week of program.weeks) {
      const selected = week.alternatives.find((a) => a.rank === week.selectedAlternativeRank);
      if (!selected) continue;
      const plan = await this.requirePlan(userId, selected.mealPlanId);
      const assessed = this.assess(
        plan,
        context.constraints,
        catalog,
        context.dietaryRevision,
        context.assessedFrom,
      );
      if (assessed.status !== 'HISTORICAL') historical = false;
      for (const item of assessed.items) items.set(item.itemId, item);
    }
    return {
      status: historical ? 'HISTORICAL' : items.size ? 'NEEDS_REVIEW' : 'COMPATIBLE',
      dietaryRevision: context.dietaryRevision,
      assessedFrom: context.assessedFrom,
      affectedMealCount: items.size,
      items: [...items.values()],
    };
  }

  private assess(
    plan: MealPlanRecord,
    constraints: SearchConstraints,
    catalog: IngredientSafetyCatalog,
    dietaryRevision: number,
    assessedFrom: string,
  ): Compatibility {
    const items: AffectedMeal[] = [];
    for (const item of plan.items) {
      if (day(item.date) < assessedFrom || item.status !== 'FILLED') continue;
      const source = item.sourceType === 'CUSTOM_MEAL' ? item.customMeal : item.recipeRevision;
      const ingredients = source?.ingredients;
      const snapshot = item.recipeRevision?.recipeDetail?.allergenCodes;
      const reasons = catalog.reasons(ingredients?.map((i) => i.ingredientId) ?? [], constraints, {
        unresolved:
          !ingredients?.length ||
          ingredients.some((i) => i.resolutionStatus !== 'EXACT' || !i.ingredientId),
        snapshotAllergens: Array.isArray(snapshot)
          ? snapshot.filter((x): x is string => typeof x === 'string')
          : [],
      });
      if (ingredients?.some((i) => constraints.excludedNormalizedNames.includes(i.normalizedName)))
        reasons.push('INGREDIENT_EXCLUSION');
      if (
        item.sourceType === 'CUSTOM_MEAL'
          ? !item.customMeal || !!item.customMeal.deletedAt
          : !item.recipeRevision?.recipeDetail
      )
        reasons.push('SOURCE_UNAVAILABLE');
      const unique = [...new Set(reasons)];
      if (!unique.length) continue;
      items.push({
        itemId: item.id,
        date: day(item.date),
        mealType: item.mealType,
        name: itemName(item),
        reasons: unique,
        unverified: unique.every((reason) => unknownReasons.has(reason)),
      });
    }
    return {
      status: plan.items.every((item) => day(item.date) < assessedFrom)
        ? 'HISTORICAL'
        : items.length
          ? 'NEEDS_REVIEW'
          : 'COMPATIBLE',
      dietaryRevision,
      assessedFrom,
      affectedMealCount: items.length,
      items,
    };
  }

  private async requirePlan(userId: string, id: string) {
    const plan = await this.plans.findOwnedPlan(userId, id);
    if (!plan) throw notFound();
    return plan;
  }
  private async programReferences(userId: string, planId: string, includeReplaced=false): Promise<ProgramReference[]> {
    const references = await this.database.mealProgramWeekAlternative.findMany({
      where: { mealPlanId: planId, week: { mealProgram: { userId, ...(includeReplaced?{}:{replacedByProgramId: null}) } } },
      include: { week: { include: { mealProgram: true } } },
    });
    return [
      ...new Map(
        references
          .filter((ref) => ref.rank === ref.week.selectedAlternativeRank)
          .map((ref) => {
            const program = ref.week.mealProgram;
            return [
              program.id,
              {
                id: program.id,
                title: program.title,
                status: program.status,
                expectedVersion: program.version,
              },
            ];
          }),
      ).values(),
    ];
  }

  async previewRepair(userId: string, input: RepairPreviewInput) {
    const context = await this.context(userId);
    if (context.dietaryRevision !== input.expectedDietaryRevision) throw conflict();
    const catalog = await this.content.safetyCatalog();
    const candidates = await this.content.findMealPlannerCandidates(context.constraints);
    const ranking = await this.ranking.rankPublishedRecipes(userId, candidates);
    const prepared: StoredPlan[] = [];
    for (const planId of input.planIds) {
      const plan = await this.requirePlan(userId, planId);
      const programs = await this.programReferences(userId, planId, true);
      const assessment = this.assess(
        plan,
        context.constraints,
        catalog,
        context.dietaryRevision,
        context.assessedFrom,
      );
      const replacements = new Map<string, PublishedPostRecord>();
      const records: z.infer<typeof storedReplacement>[] = [];
      const view: RepairPlan = {
        planId,
        weekStart: day(plan.weekStart),
        expectedVersion: plan.lockVersion,
        status: 'UNCHANGED',
        message: 'Thực đơn hiện đã phù hợp.',
        programs,
        replacements: [],
        beforeNutrition: sumNutrition(plan),
        afterNutrition: sumNutrition(plan),
        shoppingBefore: plan.shoppingItems.map(
          ({ ingredientId, canonicalName, amount, unit, sourceItemCount }) => ({
            ingredientId,
            canonicalName,
            amount,
            unit,
            sourceItemCount,
          }),
        ),
        shoppingAfter: [],
      };
      view.shoppingAfter = view.shoppingBefore;
      if (assessment.items.length && programs.some((p) => p.status === 'CONFIRMED')) {
        view.status = 'PROGRAM_REVISION_REQUIRED';
        view.message = 'Chương trình đã xác nhận. Hãy tạo bản điều chỉnh trước khi thay món.';
      } else if (assessment.items.length) {
        const uses = new Map<string, number>();
        for (const item of plan.items)
          if (item.recipeId) uses.set(item.recipeId, (uses.get(item.recipeId) ?? 0) + 1);
        for (const affected of assessment.items) {
          const item = plan.items.find((i) => i.id === affected.itemId)!;
          const pool = candidates.filter((candidate) => candidate.id !== item.recipeId);
          pool.sort((a, b) => {
            const cost = (post: PublishedPostRecord) => {
              const calories = post.publishedRevision?.recipeDetail?.calories;
              return (
                (calories == null
                  ? 2
                  : Math.abs(Number(calories) * item.servings - item.targetCalories) /
                    item.targetCalories) +
                (uses.get(post.id) ?? 0) * 0.35 -
                (ranking.get(post.id)?.score ?? 0) * 0.01
              );
            };
            return cost(a) - cost(b) || a.id.localeCompare(b.id);
          });
          const replacement = pool[0];
          if (!replacement?.publishedRevision) break;
          replacements.set(item.id, replacement);
          uses.set(replacement.id, (uses.get(replacement.id) ?? 0) + 1);
          records.push({
            itemId: item.id,
            recipeId: replacement.id,
            revisionId: replacement.publishedRevision.id,
          });
          const calories = replacement.publishedRevision.recipeDetail?.calories;
          view.replacements.push({
            itemId: item.id,
            date: day(item.date),
            mealType: item.mealType,
            beforeName: affected.name,
            afterName: replacement.publishedRevision.title,
            recipeId: replacement.id,
            servings: item.servings,
            calories: calories == null ? null : Math.round(Number(calories) * item.servings),
          });
        }
        if (records.length !== assessment.items.length) {
          view.status = 'NO_CANDIDATES';
          view.message =
            'Chưa tìm đủ món thay thế. Thực đơn này sẽ được giữ nguyên để bạn xử lý sau.';
          view.replacements = [];
          records.length = 0;
          replacements.clear();
        } else {
          view.status = 'READY';
          view.message = 'Chỉ thay những bữa không phù hợp từ hôm nay trở đi.';
          view.afterNutrition = sumNutrition(plan, replacements);
          view.shoppingAfter = aggregateRepair(plan, replacements).shopping;
        }
      }
      prepared.push({ view, planFingerprint: planFingerprint(plan), replacements: records });
    }
    const fresh = await this.context(userId);
    if (
      fresh.dietaryRevision !== context.dietaryRevision ||
      fingerprint(fresh.constraints) !== fingerprint(context.constraints)
    )
      throw conflict();
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    const stored = await this.database.dietaryRepairProposal.create({
      data: {
        userId,
        expiresAt,
        payload: jsonInput({
          dietaryRevision: context.dietaryRevision,
          profileFingerprint: fingerprint(context.constraints),
          catalogFingerprint: catalog.fingerprint,
          assessedFrom: context.assessedFrom,
          plans: prepared,
        }),
      },
    });
    return {
      proposalId: stored.id,
      expiresAt: expiresAt.toISOString(),
      dietaryRevision: context.dietaryRevision,
      plans: prepared.map((plan) => plan.view),
    };
  }

  async applyRepair(userId: string, input: RepairApplyInput) {
    const proposal = await this.database.dietaryRepairProposal.findFirst({
      where: { id: input.proposalId, userId },
    });
    if (!proposal) throw notFound();
    const payload = proposalPayload.parse(proposal.payload);
    if (proposal.applyKey && proposal.applyKey !== input.idempotencyKey)
      throw new AppError({
        statusCode: 409,
        code: 'IDEMPOTENCY_CONFLICT',
        message: 'Phương án đã được áp dụng với yêu cầu khác.',
      });
    if (proposal.appliedAt && proposal.result) return repairApplySchema.parse(proposal.result);
    if (proposal.expiresAt.getTime() < Date.now())
      throw new AppError({
        statusCode: 409,
        code: 'DIET_REPAIR_EXPIRED',
        message: 'Phương án đã hết hạn. Vui lòng tìm món thay thế lại.',
      });
    const initial = await this.context(userId);
    if (
      initial.dietaryRevision !== payload.dietaryRevision ||
      fingerprint(initial.constraints) !== payload.profileFingerprint
    )
      throw conflict();
    if (initial.assessedFrom !== payload.assessedFrom)
      throw conflict('Đã sang ngày mới. Vui lòng xem lại phạm vi thay món.');
    const results: RepairResult[] = [];
    for (const prepared of payload.plans) {
      const prior = proposal.result
        ? repairApplySchema
            .parse(proposal.result)
            .results.find((result) => result.planId === prepared.view.planId)
        : undefined;
      if (prior) {
        results.push(prior);
        continue;
      }
      try {
        results.push(await this.applyPlan(userId, input, payload, prepared));
      } catch (error) {
        const durable = await this.database.dietaryRepairProposal.findFirst({
          where: { id: input.proposalId, userId },
        });
        const recorded = durable?.result
          ? repairApplySchema
              .parse(durable.result)
              .results.find((result) => result.planId === prepared.view.planId)
          : undefined;
        if (recorded) {
          results.push(recorded);
          continue;
        }
        if (
          !(error instanceof AppError) &&
          !(error instanceof Prisma.PrismaClientKnownRequestError)
        )
          throw error;
        const assessment = await this.planCompatibility(userId, prepared.view.planId).catch(
          () => null,
        );
        const result: RepairResult = {
          planId: prepared.view.planId,
          status: 'FAILED',
          message:
            error instanceof AppError
              ? error.message
              : 'Thực đơn vừa thay đổi. Vui lòng tải lại phương án.',
          remainingAffectedMeals:
            assessment?.affectedMealCount ?? prepared.view.replacements.length,
        };
        await this.recordResult(userId, input, payload.dietaryRevision, result);
        results.push(result);
      }
    }
    const result = { dietaryRevision: payload.dietaryRevision, results };
    await this.database.dietaryRepairProposal.updateMany({
      where: { id: input.proposalId, userId, applyKey: input.idempotencyKey },
      data: { appliedAt: new Date(), result: jsonInput(result) },
    });
    return result;
  }

  private async recordResult(
    userId: string,
    input: RepairApplyInput,
    dietaryRevision: number,
    result: RepairResult,
  ) {
    return this.database.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: userId });
      const proposal = await transaction.dietaryRepairProposal.findFirst({
        where: { id: input.proposalId, userId },
      });
      if (!proposal) throw notFound();
      if (proposal.applyKey && proposal.applyKey !== input.idempotencyKey) throw conflict();
      const saved = proposal.result ? repairApplySchema.parse(proposal.result).results : [];
      if (!saved.some((item) => item.planId === result.planId)) saved.push(result);
      await transaction.dietaryRepairProposal.update({
        where: { id: proposal.id },
        data: {
          applyKey: input.idempotencyKey,
          result: jsonInput({ dietaryRevision, results: saved }),
        },
      });
    });
  }

  private async applyPlan(
    userId: string,
    input: RepairApplyInput,
    payload: z.infer<typeof proposalPayload>,
    prepared: StoredPlan,
  ): Promise<RepairResult> {
    const plan = await this.requirePlan(userId, prepared.view.planId);
    if (planFingerprint(plan) !== prepared.planFingerprint)
      throw conflict('Món ăn đã thay đổi sau khi xem trước. Vui lòng tải lại.');
    const candidates = new Map<string, PublishedPostRecord>();
    for (const replacement of prepared.replacements) {
      const post = await this.content.findPublishedPost(replacement.recipeId);
      if (!post || post.publishedRevision?.id !== replacement.revisionId) throw conflict();
      candidates.set(replacement.itemId, post);
    }
    const aggregate = aggregateRepair(plan, candidates);
    const currentContext = await this.context(userId);
    if (fingerprint(currentContext.constraints) !== payload.profileFingerprint) throw conflict();
    return this.database.$transaction(
      async (transaction) => {
        await lockDocument(transaction, 'user', { id: userId });
        const proposal = await transaction.dietaryRepairProposal.findFirst({
          where: { id: input.proposalId, userId },
        });
        if (!proposal) throw notFound();
        if (proposal.applyKey && proposal.applyKey !== input.idempotencyKey) throw conflict();
        const saved = proposal.result ? repairApplySchema.parse(proposal.result).results : [];
        const replay = saved.find((result) => result.planId === plan.id);
        if (replay) return replay;
        const profile = await transaction.dietPreference.findUnique({ where: { userId } });
        if (profile?.dietaryRevision !== payload.dietaryRevision) throw conflict();
        await lockIngredientCatalog(transaction);
        const catalog = await loadIngredientSafetyCatalog(transaction);
        if (catalog.fingerprint !== payload.catalogFingerprint)
          throw conflict('Dữ liệu nguyên liệu đã thay đổi. Vui lòng tìm món thay thế lại.');
        const current = await transaction.mealPlan.findFirst({
          where: { id: plan.id, userId, deletedAt: null },
          include: mealPlanInclude,
        });
        if (current?.lockVersion !== prepared.view.expectedVersion) throw conflict();
        if(planFingerprint(current)!==prepared.planFingerprint)throw conflict('Món ăn đã thay đổi sau khi xem trước. Vui lòng tải lại.');
        const refs = await transaction.mealProgramWeekAlternative.findMany({
          where: {
            mealPlanId: plan.id,
            week: { mealProgram: { userId, status: 'CONFIRMED' } },
          },
          select: { rank: true, week: { select: { selectedAlternativeRank: true } } },
        });
        const blocked = prepared.replacements.length>0 && refs.some((ref) => ref.rank === ref.week.selectedAlternativeRank);
        const status =
          blocked || prepared.view.status === 'PROGRAM_REVISION_REQUIRED'
            ? 'PROGRAM_REVISION_REQUIRED'
            : prepared.view.status === 'READY'
              ? 'UPDATED'
              : prepared.view.status === 'UNCHANGED'
                ? 'UNCHANGED'
                : 'FAILED';
        let remainingAffectedMeals = 0;
        if (status === 'UPDATED') {
          for (const replacement of prepared.replacements) {
            const post = candidates.get(replacement.itemId)!;
            const source = await transaction.post.findFirst({
              where: {
                id: post.id,
                status: 'PUBLISHED',
                deletedAt: null,
                publishedRevisionId: replacement.revisionId,
              },
            });
            if (!source) throw conflict();
            const item = plan.items.find((item) => item.id === replacement.itemId);
            if (!item || day(item.date) < payload.assessedFrom) throw conflict();
            const calories = post.publishedRevision!.recipeDetail?.calories;
            await transaction.mealPlanItem.update({
              where: { id: item.id, mealPlanId: plan.id },
              data: {
                sourceType: 'RECIPE',
                recipeId: post.id,
                recipeRevisionId: replacement.revisionId,
                customMealId: null,
                customMealSnapshot: null,
                servings: item.servings,
                status: 'FILLED',
                calories:
                  calories == null
                    ? null
                    : Math.max(1, Math.round(Number(calories) * item.servings)),
                tolerancePercent:
                  calories == null
                    ? null
                    : (Math.abs(Number(calories) * item.servings - item.targetCalories) /
                        item.targetCalories) *
                      100,
                reasonCodes: ['DIETARY_REPAIR'],
                warningCodes:
                  calories == null ||
                  Math.abs(Number(calories) * item.servings - item.targetCalories) /
                    item.targetCalories >
                    0.2
                    ? ['NUTRITION_TARGET_OUTSIDE_TOLERANCE']
                    : [],
              },
            });
          }
          await transaction.mealPlan.update({
            where: { id: plan.id },
            data: {
              lockVersion: { increment: 1 },
              constraintSnapshot: jsonInput({
                ...(plan.constraintSnapshot &&
                typeof plan.constraintSnapshot === 'object' &&
                !Array.isArray(plan.constraintSnapshot)
                  ? plan.constraintSnapshot
                  : {}),
                dietaryRevision: payload.dietaryRevision,
                catalogFingerprint: catalog.fingerprint,
                foodGroups: currentContext.constraints.blockedFoodGroups,
                days: [...new Set(plan.items.map((item) => day(item.date)))].map((date) => ({
                  date,
                  foodGroups: currentContext.constraints.blockedFoodGroups,
                  dietaryRevision: payload.dietaryRevision,
                  allergyCount:
                    currentContext.constraints.allergenCodes.length +
                    (currentContext.constraints.allergicIngredientIds?.length ?? 0),
                  ingredientExclusionCount:
                    currentContext.constraints.excludedNormalizedNames.length,
                })),
              }),
              warnings: aggregate.warnings,
              nutritionDataQuality: aggregate.nutritionDataQuality,
              micronutrientSummary: aggregate.micronutrientSummary,
              explanation: 'Đã điều chỉnh các món không phù hợp với thiết lập ăn uống hiện tại.',
            },
          });
          await transaction.mealPlanShoppingItem.deleteMany({ where: { mealPlanId: plan.id } });
          if (aggregate.shopping.length)
            await transaction.mealPlanShoppingItem.createMany({
              data: aggregate.shopping.map((item) => ({ ...item, mealPlanId: plan.id })),
            });
          await transaction.mealAnalysis.updateMany({
            where: { mealPlanId: plan.id, status: 'CURRENT' },
            data: { status: 'STALE' },
          });
          const weeks = await transaction.mealProgramWeekAlternative.findMany({
            where: { mealPlanId: plan.id },
            select: { weekId: true, week: { select: { mealProgramId: true } } },
          });
          if (weeks.length) {
            await transaction.mealProgramWeek.updateMany({
              where: { id: { in: weeks.map((week) => week.weekId) } },
              data: { projectionStatus: 'STALE' },
            });
            await transaction.mealProgramAnalysis.updateMany({
              where: {
                mealProgramId: { in: weeks.map((week) => week.week.mealProgramId) },
                status: 'CURRENT',
              },
              data: { status: 'STALE' },
            });
          }
        } else
          remainingAffectedMeals = this.assess(
            plan,
            currentContext.constraints,
            catalog,
            payload.dietaryRevision,
            payload.assessedFrom,
          ).affectedMealCount;
        const result: RepairResult = {
          planId: plan.id,
          status,
          message:
            status === 'UPDATED'
              ? 'Đã thay các món không phù hợp.'
              : status === 'PROGRAM_REVISION_REQUIRED'
                ? 'Hãy tạo bản điều chỉnh của chương trình đã xác nhận.'
                : prepared.view.message,
          remainingAffectedMeals,
        };
        saved.push(result);
        await transaction.dietaryRepairProposal.update({
          where: { id: proposal.id },
          data: {
            applyKey: input.idempotencyKey,
            result: jsonInput({ dietaryRevision: payload.dietaryRevision, results: saved }),
          },
        });
        return result;
      },
      { timeout: 30_000 },
    );
  }
}
