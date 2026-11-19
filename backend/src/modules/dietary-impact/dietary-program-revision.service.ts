import { createHash } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { lockDocument } from '../../database/locking.js';
import { dateOnlyInSearchTimezone } from '../content/search-constraints.js';
import { MealPlanRepository, type MealPlanRecord } from '../meal-plans/meal-plan.repository.js';
import type { MealProgramService } from '../meal-programs/meal-program.service.js';
import { jsonInput } from './dietary-impact.calculations.js';

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Copies plans before changing them: confirmed program snapshots remain immutable. */
export class DietaryProgramRevisionService {
  constructor(
    private readonly database: PrismaClient,
    private readonly programs: MealProgramService,
  ) {}

  async create(
    userId: string,
    programId: string,
    input: { expectedVersion: number; idempotencyKey: string },
  ) {
    const idempotencyKey = 'diet-revision:' + hash(input.idempotencyKey).slice(0, 48);
    const payloadHash = hash({ programId, ...input });
    const replay = await this.database.mealProgram.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
    if (replay) {
      if (replay.payloadHash !== payloadHash) throw this.conflict();
      return this.programs.get(userId, replay.id);
    }
    const source = await this.database.mealProgram.findFirst({
      where: { id: programId, userId },
      include: { weeks: { include: { alternatives: true }, orderBy: { weekIndex: 'asc' } } },
    });
    if (!source)
      throw new AppError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Không tìm thấy chương trình.',
      });
    if (source.status !== 'CONFIRMED')
      throw new AppError({
        statusCode: 409,
        code: 'MEAL_PROGRAM_REVISION_NOT_REQUIRED',
        message: 'Bạn có thể điều chỉnh trực tiếp chương trình chưa xác nhận.',
      });
    if (source.version !== input.expectedVersion || source.replacedByProgramId)
      throw this.conflict();
    const from = dateOnlyInSearchTimezone(new Date());
    if (
      source.weeks.every(
        (week) =>
          new Date(week.weekStart.getTime() + 6 * 86_400_000).toISOString().slice(0, 10) < from,
      )
    )
      throw new AppError({
        statusCode: 409,
        code: 'MEAL_PROGRAM_HISTORICAL',
        message: 'Chương trình đã kết thúc; không cần thay đổi lịch sử.',
      });
    const repository = new MealPlanRepository(this.database);
    const selected = new Map<string, MealPlanRecord>();
    for (const week of source.weeks) {
      const alternative = week.alternatives.find(
        (item) => item.rank === week.selectedAlternativeRank,
      );
      if (!alternative) continue;
      const plan = await repository.findOwnedPlan(userId, alternative.mealPlanId);
      if (!plan) throw this.conflict();
      selected.set(week.id, plan);
    }
    const created = await this.database.$transaction(
      async (transaction) => {
        await lockDocument(transaction, 'user', { id: userId });
        await lockDocument(transaction, 'mealProgram', { id: programId });
        const prior = await transaction.mealProgram.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey } },
        });
        if (prior) {
          if (prior.payloadHash !== payloadHash) throw this.conflict();
          return prior;
        }
        const current = await transaction.mealProgram.findFirst({
          where: { id: programId, userId },
        });
        if (
          current?.version !== input.expectedVersion ||
          current.status !== 'CONFIRMED' ||
          current.replacedByProgramId
        )
          throw this.conflict();
        const revision = await transaction.mealProgram.create({
          data: {
            userId,
            title: source.title + ' — điều chỉnh',
            goal: source.goal,
            startDate: source.startDate,
            timezone: source.timezone,
            horizonWeeks: source.horizonWeeks,
            status: 'DRAFT',
            version: 1,
            idempotencyKey,
            payloadHash,
            generationParameters: jsonInput(source.generationParameters),
            sourceProgramId: source.id,
            effectiveFrom: new Date(from + 'T00:00:00.000Z'),
          },
        });
        for (const week of source.weeks) {
          const original = selected.get(week.id);
          let planId = original?.id ?? null;
          if (original && original.items.some((item) => dateOnly(item.date) >= from)) {
            const fresh = await transaction.mealPlan.findFirst({
              where: { id: original.id, userId, deletedAt: null },
            });
            if (fresh?.lockVersion !== original.lockVersion) throw this.conflict();
            const latest = await transaction.mealPlan.findFirst({
              where: { userId, weekStart: original.weekStart },
              orderBy: { version: 'desc' },
              select: { version: true },
            });
            const plan = await transaction.mealPlan.create({
              data: this.copyPlan(
                original,
                (latest?.version ?? 0) + 1,
                idempotencyKey,
                revision.id,
              ),
            });
            planId = plan.id;
          }
          const newWeek = await transaction.mealProgramWeek.create({
            data: {
              mealProgramId: revision.id,
              weekIndex: week.weekIndex,
              weekStart: week.weekStart,
              status: planId ? 'READY' : 'PENDING',
              selectedAlternativeRank: planId ? 0 : null,
              projectionStatus: 'STALE',
            },
          });
          if (planId) {
            const originalAlternative = week.alternatives.find(
              (item) => item.rank === week.selectedAlternativeRank,
            )!;
            await transaction.mealProgramWeekAlternative.create({
              data: {
                weekId: newWeek.id,
                rank: 0,
                mealPlanId: planId,
                seed: 'diet-revision:' + revision.id,
                snapshot: jsonInput({
                  ...(originalAlternative.snapshot &&
                  typeof originalAlternative.snapshot === 'object' &&
                  !Array.isArray(originalAlternative.snapshot)
                    ? originalAlternative.snapshot
                    : {}),
                  id: planId,
                  dietaryRevisionPending: true,
                }),
              },
            });
          }
        }
        return revision;
      },
      { timeout: 30_000 },
    );
    return this.programs.get(userId, created.id);
  }


  private copyPlan(
    plan: MealPlanRecord,
    version: number,
    key: string,
    revisionId: string,
  ): Prisma.MealPlanUncheckedCreateInput {
    return {
      userId: plan.userId,
      weekStart: plan.weekStart,
      goal: plan.goal,
      targetCalories: plan.targetCalories,
      version,
      lockVersion: 1,
      supersedesMealPlanId: plan.id,
      idempotencyKey: 'diet-copy:' + hash({ key, planId: plan.id, revisionId }).slice(0, 56),
      payloadHash: hash({ key, planId: plan.id }),
      seedHash: plan.seedHash,
      algorithmVersion: plan.algorithmVersion,
      recommendationVersion: plan.recommendationVersion,
      constraintSnapshot: jsonInput(plan.constraintSnapshot),
      warnings: jsonInput(plan.warnings),
      nutritionDataQuality: plan.nutritionDataQuality,
      micronutrientSummary: jsonInput(plan.micronutrientSummary),
      explanation: plan.explanation,
      items: {
        create: plan.items.map((item) => ({
          date: item.date,
          mealType: item.mealType,
          position: item.position,
          status: item.status,
          sourceType: item.sourceType,
          recipeId: item.recipeId,
          recipeRevisionId: item.recipeRevisionId,
          customMealId: item.customMealId,
          customMealSnapshot:
            item.customMealSnapshot == null ? null : jsonInput(item.customMealSnapshot),
          servings: item.servings,
          targetCalories: item.targetCalories,
          calories: item.calories,
          tolerancePercent: item.tolerancePercent,
          reasonCodes: jsonInput(item.reasonCodes),
          warningCodes: jsonInput(item.warningCodes),
        })),
      },
      shoppingItems: {
        create: plan.shoppingItems.map((item) => ({
          ingredientId: item.ingredientId,
          canonicalName: item.canonicalName,
          amount: item.amount,
          unit: item.unit,
          sourceItemCount: item.sourceItemCount,
        })),
      },
    };
  }
  private conflict() {
    return new AppError({
      statusCode: 409,
      code: 'MEAL_PROGRAM_VERSION_CONFLICT',
      message: 'Chương trình đã thay đổi. Vui lòng tải lại trước khi tạo bản điều chỉnh.',
    });
  }
}
