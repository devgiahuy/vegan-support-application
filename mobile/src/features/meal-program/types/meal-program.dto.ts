export type MealProgramGoalDto = 'MAINTAIN' | 'LOSE' | 'GAIN';
export type MealProgramStatusDto = 'GENERATING' | 'DRAFT' | 'PARTIAL' | 'FAILED' | 'CONFIRMED';

export interface MealProgramListItemDto {
  id?: string;
  title?: string;
  goal?: MealProgramGoalDto;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  horizonWeeks?: number | string;
  status?: MealProgramStatusDto;
  version?: number | string;
  readyWeeks?: number | string;
  failedWeeks?: number | string;
  confirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MealProgramDto extends MealProgramListItemDto {
  generationParameters?: unknown;
  failureSummary?: unknown;
  weeks?: {
    id?: string;
    weekIndex?: number | string;
    status?: string;
    selectedAlternativeRank?: number | string | null;
  }[];
  analysis?: {
    status?: string;
    warnings?: unknown[];
  } | null;
}

export interface MealProgramListResponseDto {
  success?: true;
  data?: MealProgramListItemDto[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface MealProgramResponseDto {
  success?: true;
  data?: MealProgramDto;
  meta?: null;
}

export interface CreateMealProgramRequestDto {
  title: string;
  goal: MealProgramGoalDto;
  startDate: string;
  timezone: string;
  horizonWeeks: number;
  alternativesPerWeek?: number;
  seed?: string;
  idempotencyKey: string;
}

export type PatchMealProgramRequestDto =
  | { action: 'CONFIRM'; expectedVersion: number; idempotencyKey: string }
  | { action: 'REANALYZE'; expectedVersion: number; idempotencyKey: string }
  | { action: 'UPDATE_METADATA'; expectedVersion: number; idempotencyKey: string; title: string };
