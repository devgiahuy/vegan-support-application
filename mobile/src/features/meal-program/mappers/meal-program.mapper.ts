import { BaseMapper, pickField, safeArray, safeNumber, safeString } from '@/lib/mapper';
import type {
  CreateMealProgramRequestDto,
  MealProgramAlternativeDto,
  MealProgramDto,
  MealProgramGoalDto,
  MealProgramListResponseDto,
  MealProgramResponseDto,
  MealProgramStatusDto,
  MealProgramWarningDto,
  MealProgramWeekDto,
  PatchMealProgramRequestDto,
} from '../types/meal-program.dto';
import type {
  CreateMealProgramInput,
  MealProgram,
  MealProgramAction,
  MealProgramListResult,
  ProgramAlternative,
  ProgramAnalysis,
  ProgramNutritionSummary,
  ProgramWarning,
  ProgramWeek,
  ProgramWeekStatus,
} from '../types/meal-program.model';

const GOAL_LABELS: Record<MealProgramGoalDto, string> = {
  MAINTAIN: 'Duy trì',
  LOSE: 'Giảm cân',
  GAIN: 'Tăng cân',
};

const STATUS_LABELS: Record<MealProgramStatusDto, string> = {
  GENERATING: 'Đang tạo',
  DRAFT: 'Bản nháp',
  PARTIAL: 'Một phần',
  FAILED: 'Lỗi',
  CONFIRMED: 'Đã xác nhận',
};

const WEEK_STATUS_LABELS: Record<ProgramWeekStatus, string> = {
  PENDING: 'Đang tạo',
  READY: 'Sẵn sàng',
  FAILED: 'Lỗi',
};

const DEFAULT_MAX_REGENERATIONS = 2;
const SAMPLE_DISH_COUNT = 3;

function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function numberList(value: unknown): number[] {
  return safeArray<number | string, number>(value as (number | string)[] | null | undefined, (item) =>
    safeNumber(item, 0)
  );
}

function formatShortDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}` : date;
}

function toWeekRange(weekStart: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekStart);
  if (!match) return weekStart;
  const start = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(start.getTime())) return weekStart;
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (value: Date) =>
    `${String(value.getUTCDate()).padStart(2, '0')}/${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function toGoal(value: unknown): MealProgramGoalDto {
  const raw = safeString(value, 'MAINTAIN').toUpperCase();
  return raw === 'LOSE' || raw === 'GAIN' ? raw : 'MAINTAIN';
}

function toProgramStatus(value: unknown): MealProgramStatusDto {
  const raw = safeString(value, 'DRAFT').toUpperCase();
  return raw === 'GENERATING' || raw === 'PARTIAL' || raw === 'FAILED' || raw === 'CONFIRMED' ? raw : 'DRAFT';
}

function toWeekStatus(value: unknown): ProgramWeekStatus {
  const raw = safeString(value, 'PENDING').toUpperCase();
  return raw === 'READY' || raw === 'FAILED' ? raw : 'PENDING';
}

export class MealProgramMapper extends BaseMapper<MealProgramDto, MealProgram> {
  toModel(dto: MealProgramDto | null | undefined): MealProgram {
    const goal = toGoal(pickField(dto, ['goal'], 'MAINTAIN'));
    const status = toProgramStatus(pickField(dto, ['status'], 'DRAFT'));
    const parameters = pickField(dto, ['generationParameters'], null);
    const limits = pickField(parameters, ['limits'], null);
    const initialAlternatives = safeNumber(pickField(parameters, ['alternativesPerWeek'], 1), 1);
    const maxRegenerations = safeNumber(
      pickField(limits, ['maxRegenerationsPerWeek'], DEFAULT_MAX_REGENERATIONS),
      DEFAULT_MAX_REGENERATIONS
    );
    const weeks = safeArray<MealProgramWeekDto | null, ProgramWeek>(pickField(dto, ['weeks'], []), (week, index) =>
      this.toWeek(week, index, initialAlternatives + maxRegenerations)
    ).sort((a, b) => a.weekIndex - b.weekIndex);

    const analysis = this.toAnalysis(pickField(dto, ['analysis'], null), weeks);
    const startDate = safeString(pickField(dto, ['startDate'], ''));
    const endDate = safeString(pickField(dto, ['endDate'], ''));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(pickField(dto, ['title'], '')) || 'Lộ trình ăn chay',
      goal,
      goalLabel: GOAL_LABELS[goal],
      startDate,
      endDate,
      rangeLabel: `${formatShortDate(startDate)} - ${endDate ? formatShortDate(endDate) : 'đang tạo'}`,
      timezone: safeString(pickField(dto, ['timezone'], 'Asia/Ho_Chi_Minh')),
      horizonWeeks: safeNumber(pickField(dto, ['horizonWeeks'], 2), 2),
      status,
      statusLabel: STATUS_LABELS[status],
      isConfirmed: status === 'CONFIRMED',
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      readyWeeks: safeNumber(pickField(dto, ['readyWeeks'], 0), 0),
      failedWeeks: safeNumber(pickField(dto, ['failedWeeks'], 0), 0),
      confirmedAt: safeString(pickField(dto, ['confirmedAt'], '')) || null,
      weeks,
      analysis,
      warningCount: analysis?.warnings.length ?? 0,
      createdAt: safeString(pickField(dto, ['createdAt'], '')),
      updatedAt: safeString(pickField(dto, ['updatedAt'], '')),
    };
  }

  private toWeek(dto: MealProgramWeekDto | null | undefined, index: number, maxAlternatives: number): ProgramWeek {
    const weekIndex = safeNumber(pickField(dto, ['weekIndex'], index), index);
    const status = toWeekStatus(pickField(dto, ['status'], 'PENDING'));
    const weekStart = safeString(pickField(dto, ['weekStart'], ''));
    const alternatives = safeArray<MealProgramAlternativeDto | null, ProgramAlternative>(
      pickField(dto, ['alternatives'], []),
      (alternative) => this.toAlternative(alternative)
    ).sort((a, b) => a.rank - b.rank);
    const failure = pickField(dto, ['failure'], null);

    return {
      id: safeString(pickField(dto, ['id'], `week-${index}`)),
      weekIndex,
      weekNumber: weekIndex + 1,
      weekStart,
      weekRangeLabel: toWeekRange(weekStart),
      status,
      statusLabel: WEEK_STATUS_LABELS[status],
      selectedRank: nullableNumber(pickField(dto, ['selectedAlternativeRank'], null)),
      isProjectionStale: safeString(pickField(dto, ['projectionStatus'], '')).toUpperCase() === 'STALE',
      failureMessage: failure ? safeString(pickField(failure, ['message'], '')) || 'Không tạo được tuần này.' : null,
      alternatives,
      canRegenerate: alternatives.length < maxAlternatives,
    };
  }

  private toAlternative(dto: MealProgramAlternativeDto | null | undefined): ProgramAlternative {
    const snapshot = pickField(dto, ['snapshot'], null);
    const items = safeArray<{ calories?: number | string | null; recipe?: { title?: string } | null; customMeal?: { name?: string } | null } | null, {
      calories: number;
      title: string;
    }>(pickField(snapshot, ['items'], []), (item) => ({
      calories: safeNumber(pickField(item, ['calories'], 0), 0),
      title:
        safeString(pickField(pickField(item, ['recipe'], null), ['title'], '')) ||
        safeString(pickField(pickField(item, ['customMeal'], null), ['name'], '')),
    }));
    const analysis = pickField(snapshot, ['analysis'], null);
    return {
      id: safeString(pickField(dto, ['id'], '')),
      rank: safeNumber(pickField(dto, ['rank'], 0), 0),
      mealPlanId: safeString(pickField(dto, ['mealPlanId'], '')),
      selected: Boolean(pickField(dto, ['selected'], false)),
      mealCount: items.length,
      totalCalories: Math.round(items.reduce((total, item) => total + item.calories, 0)),
      sampleDishes: Array.from(new Set(items.map((item) => item.title).filter((title) => title.length > 0))).slice(
        0,
        SAMPLE_DISH_COUNT
      ),
      warningCount: safeArray(pickField(analysis, ['warnings'], [])).length,
    };
  }

  private toAnalysis(
    dto: MealProgramDto['analysis'] | null | undefined,
    weeks: ProgramWeek[]
  ): ProgramAnalysis | null {
    if (!dto || typeof dto !== 'object') return null;
    const summary = pickField(dto, ['nutritionSummary'], null);
    const invalidatedRaw = nullableNumber(pickField(dto, ['invalidatedFromWeekIndex'], null));
    const nutrition: ProgramNutritionSummary | null = summary
      ? {
          analyzedWeeks: safeNumber(pickField(summary, ['analyzedWeeks'], 0), 0),
          horizonWeeks: safeNumber(pickField(summary, ['horizonWeeks'], weeks.length), weeks.length),
          totalCalories: Math.round(safeNumber(pickField(summary, ['totalCalories'], 0), 0)),
          averageDailyCalories: Math.round(safeNumber(pickField(summary, ['averageDailyCalories'], 0), 0)),
          totalVitaminB12Mcg: nullableNumber(pickField(summary, ['totalVitaminB12Mcg'], null)),
          averageWeeklyVitaminB12Mcg: nullableNumber(pickField(summary, ['averageWeeklyVitaminB12Mcg'], null)),
          incompleteWeekNumbers: numberList(pickField(summary, ['incompleteWeekIndexes'], null)).map((i) => i + 1),
        }
      : null;

    return {
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      isStale: safeString(pickField(dto, ['status'], '')).toUpperCase() === 'STALE',
      invalidatedFromWeekNumber: invalidatedRaw === null ? null : invalidatedRaw + 1,
      warnings: safeArray<MealProgramWarningDto | null, ProgramWarning>(pickField(dto, ['warnings'], []), (warning, index) =>
        this.toWarning(warning, index)
      ),
      nutrition,
    };
  }

  private toWarning(dto: MealProgramWarningDto | null | undefined, index: number): ProgramWarning {
    const code = safeString(pickField(dto, ['code'], 'PROGRAM_WARNING'));
    const severity = safeString(pickField(dto, ['severity'], 'INFO')).toUpperCase();
    const weekNumbers = numberList(pickField(dto, ['weekIndexes'], null)).map((i) => i + 1);
    const incomplete = numberList(pickField(dto, ['incompleteWeekIndexes'], null)).map((i) => i + 1);
    const count = safeNumber(pickField(dto, ['count'], 0), 0);

    if (code === 'REPEATED_MEAL_PATTERN') {
      return {
        key: `${code}-${index}`,
        code,
        title: 'Món lặp lại giữa các tuần',
        description: `Một món xuất hiện ${count} lần${weekNumbers.length > 0 ? ` ở tuần ${weekNumbers.join(', ')}` : ''}.`,
        suggestion: 'Chọn phương án khác ở một trong các tuần đó để thực đơn đa dạng hơn.',
        isCaution: severity !== 'INFO',
        weekNumbers,
      };
    }
    if (code === 'PARTIAL_HORIZON') {
      return {
        key: `${code}-${index}`,
        code,
        title: 'Lộ trình chưa đủ các tuần',
        description: `Tuần ${incomplete.join(', ') || '—'} chưa sinh xong hoặc chưa chọn phương án nên chưa được tính vào phân tích.`,
        suggestion: 'Sinh lại tuần bị lỗi và chọn phương án cho từng tuần rồi phân tích lại.',
        isCaution: false,
        weekNumbers: incomplete,
      };
    }
    const nested = pickField(dto, ['warning'], null);
    const weekIndex = nullableNumber(pickField(dto, ['weekIndex'], null));
    return {
      key: `${code}-${index}`,
      code,
      title: safeString(pickField(nested, ['title'], '')) || 'Lưu ý dinh dưỡng trong tuần',
      description:
        safeString(pickField(nested, ['explanation'], '')) ||
        safeString(pickField(nested, ['detail'], '')) ||
        'Xem thực đơn của tuần này để biết chi tiết.',
      suggestion: safeString(pickField(nested, ['suggestedAdjustment'], pickField(nested, ['suggestion'], ''))) || null,
      isCaution: severity !== 'INFO',
      weekNumbers: weekIndex === null ? [] : [weekIndex + 1],
    };
  }

  toResponseModel(dto: MealProgramResponseDto | null | undefined): MealProgram {
    return this.toModel(pickField(dto, ['data'], null));
  }

  toListModel(dto: MealProgramListResponseDto | null | undefined): MealProgramListResult {
    const items = this.toModelList(pickField(dto, ['data'], []));
    const meta = dto?.meta ?? {};
    return {
      items,
      pagination: {
        page: safeNumber(meta.page, 1),
        limit: safeNumber(meta.limit, 20),
        totalItems: safeNumber(meta.total, items.length),
        totalPages: safeNumber(meta.totalPages, 1),
      },
    };
  }

  toCreateDto(input: CreateMealProgramInput, timezone: string): CreateMealProgramRequestDto {
    return {
      ...(input.title.trim() ? { title: input.title.trim() } : {}),
      goal: input.goal,
      startDate: input.startDate,
      timezone,
      horizonWeeks: input.horizonWeeks,
      alternativesPerWeek: input.alternativesPerWeek ?? 2,
      ...(input.seed?.trim() ? { seed: input.seed.trim() } : {}),
      idempotencyKey: idempotencyKey('meal-program'),
    };
  }

  toPatchDto(action: MealProgramAction, expectedVersion: number): PatchMealProgramRequestDto {
    const common = { expectedVersion, idempotencyKey: idempotencyKey(`program-${action.type.toLowerCase()}`) };
    switch (action.type) {
      case 'UPDATE_METADATA':
        return { action: 'UPDATE_METADATA', title: action.title.trim(), ...common };
      case 'SELECT_ALTERNATIVE':
        return {
          action: 'SELECT_ALTERNATIVE',
          weekIndex: action.weekIndex,
          alternativeRank: action.alternativeRank,
          ...common,
        };
      case 'REGENERATE_WEEK':
        return { action: 'REGENERATE_WEEK', weekIndex: action.weekIndex, selectGenerated: false, ...common };
      case 'REANALYZE':
        return { action: 'REANALYZE', ...common };
      case 'CONFIRM':
        return { action: 'CONFIRM', ...common };
    }
  }
}

export const mealProgramMapper = new MealProgramMapper();
