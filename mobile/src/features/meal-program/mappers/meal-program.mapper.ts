import { BaseMapper, pickField, safeArray, safeNumber, safeString } from '@/lib/mapper';
import type { CreateMealProgramRequestDto, MealProgramDto, MealProgramListResponseDto, PatchMealProgramRequestDto } from '../types/meal-program.dto';
import type { CreateMealProgramInput, MealProgram, MealProgramListResult, MealProgramWeek } from '../types/meal-program.model';

const GOAL_LABELS = {
  MAINTAIN: 'Duy tri',
  LOSE: 'Giam can',
  GAIN: 'Tang can',
} as const;

const STATUS_LABELS = {
  GENERATING: 'Dang tao',
  DRAFT: 'Ban nhap',
  PARTIAL: 'Mot phan',
  FAILED: 'Loi',
  CONFIRMED: 'Da xac nhan',
} as const;

function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class MealProgramMapper extends BaseMapper<MealProgramDto, MealProgram> {
  toModel(dto: MealProgramDto | null | undefined): MealProgram {
    const goal = safeString(pickField(dto, ['goal'], 'MAINTAIN')) as MealProgram['goal'];
    const status = safeString(pickField(dto, ['status'], 'DRAFT')) as MealProgram['status'];
    const weeks = safeArray<unknown, MealProgramWeek>(pickField(dto, ['weeks'], []), (item, index) => {
      const week = item as Record<string, unknown>;
      const rankValue = pickField<unknown>(week, ['selectedAlternativeRank'], null);
      return {
        id: safeString(pickField(week, ['id'], `week-${index}`)),
        weekIndex: safeNumber(pickField(week, ['weekIndex'], index), index),
        status: safeString(pickField(week, ['status'], 'DRAFT')),
        selectedAlternativeRank: rankValue === null ? null : safeNumber(rankValue, 0),
      };
    });
    const analysis = pickField(dto, ['analysis'], null) as MealProgramDto['analysis'];
    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(pickField(dto, ['title'], 'Lo trinh an chay')),
      goal,
      goalLabel: GOAL_LABELS[goal] ?? goal,
      startDate: safeString(pickField(dto, ['startDate'], '')),
      endDate: safeString(pickField(dto, ['endDate'], '')),
      timezone: safeString(pickField(dto, ['timezone'], 'Asia/Ho_Chi_Minh')),
      horizonWeeks: safeNumber(pickField(dto, ['horizonWeeks'], 2), 2),
      status,
      statusLabel: STATUS_LABELS[status] ?? status,
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      readyWeeks: safeNumber(pickField(dto, ['readyWeeks'], 0), 0),
      failedWeeks: safeNumber(pickField(dto, ['failedWeeks'], 0), 0),
      confirmedAt: safeString(pickField(dto, ['confirmedAt'], '')) || null,
      weeks,
      warningCount: safeArray(pickField(analysis, ['warnings'], [])).length,
      createdAt: safeString(pickField(dto, ['createdAt'], '')),
      updatedAt: safeString(pickField(dto, ['updatedAt'], '')),
    };
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

  toCreateDto(input: CreateMealProgramInput): CreateMealProgramRequestDto {
    return {
      title: input.title.trim(),
      goal: input.goal,
      startDate: input.startDate,
      timezone: 'Asia/Ho_Chi_Minh',
      horizonWeeks: input.horizonWeeks,
      alternativesPerWeek: input.alternativesPerWeek ?? 2,
      ...(input.seed?.trim() ? { seed: input.seed.trim() } : {}),
      idempotencyKey: idempotencyKey('meal-program'),
    };
  }

  toConfirmDto(expectedVersion: number): PatchMealProgramRequestDto {
    return { action: 'CONFIRM', expectedVersion, idempotencyKey: idempotencyKey('confirm-program') };
  }
}

export const mealProgramMapper = new MealProgramMapper();

