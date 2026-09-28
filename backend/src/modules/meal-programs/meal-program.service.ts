import { createHash } from 'node:crypto';
import { MealProgramStatus, MealProgramWeekStatus, type Prisma } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import type { MealPlanService } from '../meal-plans/meal-plan.service.js';
import {
  MealProgramAlternativeNotFoundError,
  MealProgramIdempotencyConflictError,
  MealProgramVersionConflictError,
  type MealProgramRecord,
  type MealProgramRepository,
} from './meal-program.repository.js';
import {
  MEAL_PROGRAM_ABSOLUTE_MAX_STORED_ALTERNATIVES,
  MEAL_PROGRAM_ALGORITHM_VERSION,
  type CreateMealProgramInput,
  type MealProgramListQuery,
  type PatchMealProgramInput,
} from './meal-program.schemas.js';

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function dateFromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function jsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export class MealProgramService {
  constructor(
    private readonly repository: MealProgramRepository,
    private readonly mealPlanService: MealPlanService,
    private readonly config: AppConfig,
  ) {}

  async create(userId: string, input: CreateMealProgramInput) {
    this.assertCreateLimits(input);
    const payloadHash = sha256({
      title: input.title,
      goal: input.goal,
      startDate: input.startDate,
      timezone: input.timezone,
      horizonWeeks: input.horizonWeeks,
      alternativesPerWeek: input.alternativesPerWeek,
      seed: input.seed ?? null,
    });
    const existing = await this.repository.findByIdempotency(userId, input.idempotencyKey);
    if (existing?.payloadHash !== undefined && existing.payloadHash !== payloadHash) {
      throw this.idempotencyConflict();
    }
    const startDate = dateFromDateOnly(input.startDate);
    let program =
      existing ??
      (await this.repository.create({
        userId,
        title: input.title,
        goal: input.goal,
        startDate,
        timezone: input.timezone,
        horizonWeeks: input.horizonWeeks,
        idempotencyKey: input.idempotencyKey,
        payloadHash,
        generationParameters: inputJson({
          algorithmVersion: MEAL_PROGRAM_ALGORITHM_VERSION,
          alternativesPerWeek: input.alternativesPerWeek,
          seed: input.seed ?? null,
          limits: this.config.mealProgramLimits,
        }),
        weeks: Array.from({ length: input.horizonWeeks }, (_, weekIndex) => ({
          weekIndex,
          weekStart: addDays(startDate, weekIndex * 7),
        })),
      }));

    if (program.status !== MealProgramStatus.CONFIRMED) {
      await this.generateMissing(userId, program, input.alternativesPerWeek, input.seed);
      program = await this.repository.finalizeGeneration(program.id);
      if (program.weeks.some((week) => week.selectedAlternativeRank !== null)) {
        await this.analyze(program, null);
        program = (await this.repository.findOwned(userId, program.id)) ?? program;
      }
    }
    return this.detail(program);
  }

  async list(userId: string, query: MealProgramListQuery) {
    const result = await this.repository.list(userId, query.page, query.limit, query.status);
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
    const program = await this.repository.findOwned(userId, id);
    if (!program) throw this.notFound();
    return this.detail(program);
  }

  async patch(userId: string, id: string, input: PatchMealProgramInput) {
    const payloadHash = sha256({ programId: id, ...input, idempotencyKey: undefined });
    const priorMutation = await this.repository.findMutation(userId, input.idempotencyKey);
    if (priorMutation) {
      if (priorMutation.mealProgramId !== id || priorMutation.payloadHash !== payloadHash) {
        throw this.idempotencyConflict();
      }
      let replay = await this.requireOwned(userId, id);
      if (input.action !== 'UPDATE_METADATA' && input.action !== 'CONFIRM') {
        await this.analyze(replay, input.action === 'REANALYZE' ? 0 : input.weekIndex);
        replay = await this.requireOwned(userId, id);
      }
      return this.detail(replay);
    }

    let program = await this.requireOwned(userId, id);
    if (program.version !== input.expectedVersion) throw this.versionConflict();
    if (program.status === MealProgramStatus.CONFIRMED && input.action !== 'UPDATE_METADATA') {
      throw new AppError({
        statusCode: 409,
        code: 'MEAL_PROGRAM_CONFIRMED_IMMUTABLE',
        message: 'Confirmed meal programs cannot be changed',
      });
    }

    const common = {
      userId,
      programId: id,
      expectedVersion: input.expectedVersion,
      idempotencyKey: input.idempotencyKey,
      payloadHash,
    };
    try {
      switch (input.action) {
        case 'UPDATE_METADATA':
          program = await this.repository.updateMetadata({ ...common, title: input.title });
          break;
        case 'SELECT_ALTERNATIVE':
          program = await this.repository.selectAlternative({
            ...common,
            weekIndex: input.weekIndex,
            alternativeRank: input.alternativeRank,
          });
          await this.analyze(program, input.weekIndex);
          program = await this.requireOwned(userId, id);
          break;
        case 'REGENERATE_WEEK':
          program = await this.regenerate(userId, program, input, common);
          await this.analyze(program, input.weekIndex);
          program = await this.requireOwned(userId, id);
          break;
        case 'REANALYZE':
          program = await this.repository.touchReanalysis(common);
          await this.refreshSelectedSnapshots(userId, program);
          program = await this.requireOwned(userId, id);
          await this.analyze(program, 0);
          program = await this.requireOwned(userId, id);
          break;
        case 'CONFIRM': {
          if (program.status !== MealProgramStatus.DRAFT || !this.isComplete(program)) {
            throw new AppError({
              statusCode: 409,
              code: 'MEAL_PROGRAM_NOT_CONFIRMABLE',
              message: 'Every program week must have a selected alternative before confirmation',
            });
          }
          if (!program.analyses[0] || program.analyses[0].status !== 'CURRENT') {
            await this.analyze(program, null);
          }
          program = await this.repository.confirm(common);
          break;
        }
      }
    } catch (error) {
      if (error instanceof MealProgramVersionConflictError) throw this.versionConflict();
      if (error instanceof MealProgramIdempotencyConflictError) throw this.idempotencyConflict();
      if (error instanceof MealProgramAlternativeNotFoundError) {
        throw new AppError({
          statusCode: 404,
          code: 'MEAL_PROGRAM_ALTERNATIVE_NOT_FOUND',
          message: 'Meal program alternative not found',
        });
      }
      throw error;
    }
    return this.detail(program);
  }

  private assertCreateLimits(input: CreateMealProgramInput): void {
    if (
      input.horizonWeeks > this.config.mealProgramLimits.maxWeeks ||
      input.alternativesPerWeek > this.config.mealProgramLimits.maxAlternativesPerWeek
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'MEAL_PROGRAM_LIMIT_EXCEEDED',
        message: 'Meal program horizon or alternatives exceed configured limits',
      });
    }
  }

  private async generateMissing(
    userId: string,
    program: MealProgramRecord,
    alternativesPerWeek: number,
    requestedSeed?: string,
  ): Promise<void> {
    const baseSeed =
      requestedSeed ?? sha256(`${userId}:${program.id}:${dateOnly(program.startDate)}`);
    for (const week of program.weeks) {
      const ranks = new Set(week.alternatives.map((alternative) => alternative.rank));
      for (let rank = 0; rank < alternativesPerWeek; rank += 1) {
        if (ranks.has(rank)) continue;
        const seed = `${baseSeed}:${week.weekIndex}:${rank}`.slice(0, 120);
        try {
          const plan = await this.mealPlanService.generate(userId, {
            weekStart: dateOnly(week.weekStart),
            goal: program.goal,
            idempotencyKey: `program:${program.id}:${week.weekIndex}:${rank}`,
            seed,
          });
          await this.repository.addGeneratedAlternative(
            program.id,
            week.weekIndex,
            rank,
            plan.id,
            seed,
            inputJson(plan),
          );
        } catch (error) {
          await this.repository.recordWeekFailure(
            program.id,
            week.weekIndex,
            inputJson({
              code: error instanceof AppError ? error.code : 'MEAL_PROGRAM_WEEK_GENERATION_FAILED',
              message: error instanceof Error ? error.message : 'Week generation failed',
            }),
          );
        }
      }
    }
  }

  private async regenerate(
    userId: string,
    program: MealProgramRecord,
    input: Extract<PatchMealProgramInput, { action: 'REGENERATE_WEEK' }>,
    common: {
      userId: string;
      programId: string;
      expectedVersion: number;
      idempotencyKey: string;
      payloadHash: string;
    },
  ): Promise<MealProgramRecord> {
    const week = program.weeks.find((candidate) => candidate.weekIndex === input.weekIndex);
    if (!week) throw this.notFound();
    const parameters = jsonObject(program.generationParameters);
    const initialAlternatives =
      typeof parameters.alternativesPerWeek === 'number' ? parameters.alternativesPerWeek : 1;
    if (
      week.alternatives.length >= MEAL_PROGRAM_ABSOLUTE_MAX_STORED_ALTERNATIVES ||
      week.alternatives.length >=
        initialAlternatives + this.config.mealProgramLimits.maxRegenerationsPerWeek
    ) {
      throw new AppError({
        statusCode: 409,
        code: 'MEAL_PROGRAM_REGENERATION_LIMIT',
        message: 'The configured regeneration limit for this week has been reached',
      });
    }
    const rank = Math.max(-1, ...week.alternatives.map((alternative) => alternative.rank)) + 1;
    const seed = input.seed ?? sha256(`${program.id}:${input.idempotencyKey}:${input.weekIndex}`);
    const plan = await this.mealPlanService.generate(userId, {
      weekStart: dateOnly(week.weekStart),
      goal: program.goal,
      idempotencyKey: `program-regenerate:${sha256(input.idempotencyKey).slice(0, 32)}`,
      seed,
    });
    return this.repository.appendRegeneratedAlternative({
      ...common,
      weekIndex: input.weekIndex,
      rank,
      mealPlanId: plan.id,
      seed,
      snapshot: inputJson(plan),
      selectGenerated: input.selectGenerated,
    });
  }

  private async refreshSelectedSnapshots(
    userId: string,
    program: MealProgramRecord,
  ): Promise<void> {
    for (const week of program.weeks) {
      const selected = week.alternatives.find(
        (alternative) => alternative.rank === week.selectedAlternativeRank,
      );
      if (!selected) continue;
      const plan = await this.mealPlanService.get(userId, selected.mealPlanId);
      await this.repository.updateAlternativeSnapshot(selected.id, inputJson(plan));
    }
  }

  private async analyze(
    program: MealProgramRecord,
    invalidatedFromWeekIndex: number | null,
  ): Promise<void> {
    const selected = program.weeks.flatMap((week) => {
      const alternative = week.alternatives.find(
        (candidate) => candidate.rank === week.selectedAlternativeRank,
      );
      return alternative ? [{ week, alternative, snapshot: jsonObject(alternative.snapshot) }] : [];
    });
    if (!selected.length) return;

    let totalCalories = 0;
    let totalVitaminB12Mcg = 0;
    let b12Weeks = 0;
    const occurrences = new Map<string, { count: number; weeks: Set<number>; itemIds: string[] }>();
    const warnings: Array<Record<string, unknown>> = [];
    const weeklyAnalyses: Array<Record<string, unknown>> = [];

    for (const entry of selected) {
      const items = Array.isArray(entry.snapshot.items) ? entry.snapshot.items : [];
      for (const rawItem of items) {
        if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) continue;
        const item = rawItem as Record<string, unknown>;
        if (typeof item.calories === 'number') totalCalories += item.calories;
        const recipe =
          item.recipe && typeof item.recipe === 'object'
            ? (item.recipe as Record<string, unknown>)
            : null;
        const custom =
          item.customMeal && typeof item.customMeal === 'object'
            ? (item.customMeal as Record<string, unknown>)
            : null;
        const identity =
          typeof recipe?.id === 'string'
            ? `RECIPE:${recipe.id}`
            : typeof custom?.id === 'string'
              ? `CUSTOM_MEAL:${custom.id}`
              : null;
        if (identity) {
          const occurrence = occurrences.get(identity) ?? {
            count: 0,
            weeks: new Set<number>(),
            itemIds: [],
          };
          occurrence.count += 1;
          occurrence.weeks.add(entry.week.weekIndex);
          if (typeof item.id === 'string') occurrence.itemIds.push(item.id);
          occurrences.set(identity, occurrence);
        }
      }
      const micronutrients = jsonObject(entry.snapshot.micronutrientSummary as Prisma.JsonValue);
      if (typeof micronutrients.vitaminB12Mcg === 'number') {
        totalVitaminB12Mcg += micronutrients.vitaminB12Mcg;
        b12Weeks += 1;
      }
      const analysis = jsonObject(entry.snapshot.analysis as Prisma.JsonValue);
      const weekWarnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];
      for (const warning of weekWarnings) {
        warnings.push({ code: 'WEEK_ANALYSIS_WARNING', weekIndex: entry.week.weekIndex, warning });
      }
      weeklyAnalyses.push({
        weekIndex: entry.week.weekIndex,
        mealPlanId: entry.alternative.mealPlanId,
        mealAnalysisId: typeof analysis.id === 'string' ? analysis.id : null,
        version: typeof analysis.version === 'number' ? analysis.version : null,
        status: typeof analysis.status === 'string' ? analysis.status : null,
        warningCount: weekWarnings.length,
      });
    }

    for (const [source, occurrence] of occurrences) {
      if (occurrence.weeks.size < 2) continue;
      warnings.push({
        code: 'REPEATED_MEAL_PATTERN',
        severity: 'CAUTION',
        source,
        count: occurrence.count,
        weekIndexes: [...occurrence.weeks].sort((a, b) => a - b),
        itemIds: occurrence.itemIds,
        explanation: 'The same meal appears in multiple program weeks.',
        suggestion: 'Choose an alternative to improve variety.',
      });
    }

    const incompleteWeekIndexes = program.weeks
      .filter(
        (week) =>
          week.status !== MealProgramWeekStatus.READY || week.selectedAlternativeRank === null,
      )
      .map((week) => week.weekIndex);
    if (incompleteWeekIndexes.length) {
      warnings.push({ code: 'PARTIAL_HORIZON', severity: 'INFO', incompleteWeekIndexes });
    }
    const analyzedWeeks = selected.length;
    await this.repository.saveAnalysis({
      programId: program.id,
      inputFingerprint: sha256(
        selected.map(({ week, alternative }) => ({
          weekIndex: week.weekIndex,
          alternativeId: alternative.id,
          snapshot: alternative.snapshot,
        })),
      ),
      invalidatedFromWeekIndex,
      warnings: inputJson(warnings),
      nutritionSummary: inputJson({
        horizonWeeks: program.horizonWeeks,
        analyzedWeeks,
        totalCalories: Number(totalCalories.toFixed(2)),
        averageDailyCalories: Number((totalCalories / (analyzedWeeks * 7)).toFixed(2)),
        totalVitaminB12Mcg: b12Weeks ? Number(totalVitaminB12Mcg.toFixed(2)) : null,
        averageWeeklyVitaminB12Mcg: b12Weeks
          ? Number((totalVitaminB12Mcg / b12Weeks).toFixed(2))
          : null,
        incompleteWeekIndexes,
      }),
      weeklyAnalyses: inputJson(weeklyAnalyses),
    });
  }

  private isComplete(program: MealProgramRecord): boolean {
    return (
      program.weeks.length === program.horizonWeeks &&
      program.weeks.every(
        (week) =>
          week.status === MealProgramWeekStatus.READY && week.selectedAlternativeRank !== null,
      )
    );
  }

  private async requireOwned(userId: string, id: string): Promise<MealProgramRecord> {
    const program = await this.repository.findOwned(userId, id);
    if (!program) throw this.notFound();
    return program;
  }

  private summary(program: MealProgramRecord) {
    return {
      id: program.id,
      title: program.title,
      goal: program.goal,
      startDate: dateOnly(program.startDate),
      endDate: dateOnly(addDays(program.startDate, program.horizonWeeks * 7 - 1)),
      timezone: program.timezone,
      horizonWeeks: program.horizonWeeks,
      status: program.status,
      version: program.version,
      readyWeeks: program.weeks.filter((week) => week.status === MealProgramWeekStatus.READY)
        .length,
      failedWeeks: program.weeks.filter((week) => week.status === MealProgramWeekStatus.FAILED)
        .length,
      confirmedAt: program.confirmedAt?.toISOString() ?? null,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  }

  private detail(program: MealProgramRecord) {
    const analysis = program.analyses[0];
    return {
      ...this.summary(program),
      generationParameters: jsonObject(program.generationParameters),
      failureSummary: program.failureSummary === null ? null : jsonObject(program.failureSummary),
      weeks: program.weeks.map((week) => ({
        id: week.id,
        weekIndex: week.weekIndex,
        weekStart: dateOnly(week.weekStart),
        status: week.status,
        selectedAlternativeRank: week.selectedAlternativeRank,
        projectionStatus: week.projectionStatus,
        failure: week.failure === null ? null : jsonObject(week.failure),
        alternatives: week.alternatives.map((alternative) => ({
          id: alternative.id,
          rank: alternative.rank,
          mealPlanId: alternative.mealPlanId,
          selected: alternative.rank === week.selectedAlternativeRank,
          snapshot: jsonObject(alternative.snapshot),
          createdAt: alternative.createdAt.toISOString(),
        })),
      })),
      analysis: analysis
        ? {
            id: analysis.id,
            version: analysis.version,
            status: analysis.status,
            invalidatedFromWeekIndex: analysis.invalidatedFromWeekIndex,
            warnings: Array.isArray(analysis.warnings) ? analysis.warnings.map(jsonObject) : [],
            nutritionSummary: jsonObject(analysis.nutritionSummary),
            weeklyAnalyses: Array.isArray(analysis.weeklyAnalyses)
              ? analysis.weeklyAnalyses.map(jsonObject)
              : [],
            createdAt: analysis.createdAt.toISOString(),
          }
        : null,
    };
  }

  private notFound(): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Meal program not found' });
  }

  private versionConflict(): AppError {
    return new AppError({
      statusCode: 409,
      code: 'MEAL_PROGRAM_VERSION_CONFLICT',
      message: 'Meal program version conflict',
    });
  }

  private idempotencyConflict(): AppError {
    return new AppError({
      statusCode: 409,
      code: 'MEAL_PROGRAM_IDEMPOTENCY_CONFLICT',
      message: 'Idempotency key was already used with another payload',
    });
  }
}
