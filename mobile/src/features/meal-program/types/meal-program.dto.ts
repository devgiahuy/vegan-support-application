/** DTO lộ trình nhiều tuần — khớp OpenAPI backend (`MealProgramResponse`, body `PATCH /meal-programs/:id`). */
export type MealProgramGoalDto = 'MAINTAIN' | 'LOSE' | 'GAIN';
export type MealProgramStatusDto = 'GENERATING' | 'DRAFT' | 'PARTIAL' | 'FAILED' | 'CONFIRMED';

export interface MealProgramSnapshotItemDto {
  id?: string;
  calories?: number | string | null;
  recipe?: { id?: string; title?: string } | null;
  customMeal?: { id?: string; name?: string } | null;
}

export interface MealProgramAlternativeDto {
  id?: string;
  rank?: number | string;
  mealPlanId?: string;
  selected?: boolean;
  snapshot?: {
    id?: string;
    goal?: string;
    items?: (MealProgramSnapshotItemDto | null)[];
    analysis?: { warnings?: unknown[] } | null;
    weekStart?: string;
    micronutrientSummary?: { vitaminB12Mcg?: number | string | null } | null;
  } | null;
  createdAt?: string;
}

export interface MealProgramWeekDto {
  id?: string;
  weekIndex?: number | string;
  weekStart?: string;
  status?: string;
  selectedAlternativeRank?: number | string | null;
  projectionStatus?: string;
  failure?: { code?: string; message?: string } | null;
  alternatives?: (MealProgramAlternativeDto | null)[];
}

export interface MealProgramWarningDto {
  code?: string;
  severity?: string;
  source?: string;
  count?: number | string;
  weekIndex?: number | string;
  weekIndexes?: (number | string)[];
  incompleteWeekIndexes?: (number | string)[];
  explanation?: string;
  suggestion?: string;
  warning?: unknown;
}

export interface MealProgramAnalysisDto {
  id?: string;
  version?: number | string;
  status?: string;
  invalidatedFromWeekIndex?: number | string | null;
  warnings?: (MealProgramWarningDto | null)[];
  nutritionSummary?: {
    horizonWeeks?: number | string;
    analyzedWeeks?: number | string;
    totalCalories?: number | string;
    averageDailyCalories?: number | string;
    totalVitaminB12Mcg?: number | string | null;
    averageWeeklyVitaminB12Mcg?: number | string | null;
    incompleteWeekIndexes?: (number | string)[];
  } | null;
  weeklyAnalyses?: { weekIndex?: number | string; warningCount?: number | string }[];
  createdAt?: string;
}

export interface MealProgramDto {
  id?: string;
  title?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  horizonWeeks?: number | string;
  status?: string;
  version?: number | string;
  readyWeeks?: number | string;
  failedWeeks?: number | string;
  confirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  generationParameters?: {
    alternativesPerWeek?: number | string;
    limits?: {
      maxWeeks?: number | string;
      minWeeks?: number | string;
      maxAlternativesPerWeek?: number | string;
      maxRegenerationsPerWeek?: number | string;
    };
  } | null;
  weeks?: (MealProgramWeekDto | null)[];
  analysis?: MealProgramAnalysisDto | null;
}

export interface MealProgramResponseDto {
  success?: boolean;
  data?: MealProgramDto | null;
  meta?: null;
}

export interface MealProgramListResponseDto {
  success?: boolean;
  data?: (MealProgramDto | null)[] | null;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null;
}

export interface CreateMealProgramRequestDto {
  title?: string;
  goal: MealProgramGoalDto;
  startDate: string;
  timezone: string;
  horizonWeeks: number;
  alternativesPerWeek: number;
  seed?: string;
  idempotencyKey: string;
}

/** Body `PATCH /meal-programs/:id` — chọn một hành động; luôn kèm `expectedVersion` và `idempotencyKey`. */
export type PatchMealProgramRequestDto =
  | { action: 'UPDATE_METADATA'; expectedVersion: number; idempotencyKey: string; title: string }
  | { action: 'SELECT_ALTERNATIVE'; expectedVersion: number; idempotencyKey: string; weekIndex: number; alternativeRank: number }
  | { action: 'REGENERATE_WEEK'; expectedVersion: number; idempotencyKey: string; weekIndex: number; seed?: string; selectGenerated?: boolean }
  | { action: 'REANALYZE'; expectedVersion: number; idempotencyKey: string }
  | { action: 'CONFIRM'; expectedVersion: number; idempotencyKey: string };
