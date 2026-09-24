export type MealProgramStatusDto = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'ARCHIVED' | 'FAILED';
export type ProgramWeekStatusDto =
  'PENDING' | 'GENERATING' | 'READY' | 'FAILED' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
export type MealProgramGoalDto = 'MAINTAIN' | 'LOSE' | 'GAIN';

export interface WeeklyPlanMealItemDto {
  id: string;
  meal_type?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  source_type?: 'RECIPE' | 'CUSTOM_MEAL';
  sourceType?: 'RECIPE' | 'CUSTOM_MEAL';
  name?: string;
  servings?: number;
  calories?: number;
  image_url?: string | null;
  imageUrl?: string | null;
}

export interface WeeklyPlanDayDto {
  date?: string;
  day_of_week?: number;
  dayOfWeek?: number;
  meals?: WeeklyPlanMealItemDto[];
}

export interface WeeklyPlanSnapshotDto {
  captured_at?: string;
  capturedAt?: string;
  total_calories?: number;
  totalCalories?: number;
  macronutrients?: {
    protein_g?: number;
    protein?: number;
    carbs_g?: number;
    carbs?: number;
    fat_g?: number;
    fat?: number;
    fiber_g?: number;
    fiber?: number;
  };
  days?: WeeklyPlanDayDto[];
  items?: unknown[];
  slots?: unknown[];
}

export interface WeekAlternativeDto {
  id: string;
  rank: number;
  mealPlanId: string;
  selected: boolean;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

export interface ProgramWeekDto {
  id: string;
  program_id?: string;
  programId?: string;
  week_number?: number;
  weekNumber?: number;
  weekIndex?: number;
  week_index?: number;
  start_date?: string;
  startDate?: string;
  weekStart?: string;
  week_start?: string;
  end_date?: string;
  endDate?: string;
  status: ProgramWeekStatusDto;
  compliance_rate?: number;
  complianceRate?: number;
  is_downstream_invalidated?: boolean;
  isDownstreamInvalidated?: boolean;
  projectionStatus?: 'CURRENT' | 'STALE';
  projection_status?: 'CURRENT' | 'STALE';
  selectedAlternativeRank?: number | null;
  selected_alternative_rank?: number | null;
  alternatives?: WeekAlternativeDto[];
  snapshot?: WeeklyPlanSnapshotDto | null;
}

export interface RepeatedPatternWarningDto {
  meal_id?: string;
  mealId?: string;
  recipe_id?: string;
  recipeId?: string;
  meal_name?: string;
  mealName?: string;
  recipe_title?: string;
  recipeTitle?: string;
  source_type?: 'RECIPE' | 'CUSTOM_MEAL';
  sourceType?: 'RECIPE' | 'CUSTOM_MEAL';
  occurrences?: number;
  count?: number;
  dates?: string[];
  message?: string;
}

export interface CumulativeAnalysisDto {
  average_daily_calories?: number;
  averageDailyCalories?: number;
  average_macronutrients?: {
    protein_g?: number;
    protein?: number;
    carbs_g?: number;
    carbs?: number;
    fat_g?: number;
    fat?: number;
    fiber_g?: number;
    fiber?: number;
  };
  repeated_pattern_warnings?: RepeatedPatternWarningDto[];
  repeatedPatternWarnings?: RepeatedPatternWarningDto[];
  warnings?: RepeatedPatternWarningDto[];
  nutritionSummary?: {
    horizonWeeks?: number;
    analyzedWeeks?: number;
    totalCalories?: number;
    averageDailyCalories?: number;
    totalVitaminB12Mcg?: number | null;
    averageWeeklyVitaminB12Mcg?: number | null;
    incompleteWeekIndexes?: number[];
  };
  is_invalidated?: boolean;
  isInvalidated?: boolean;
  status?: 'CURRENT' | 'STALE';
  analyzed_at?: string;
  analyzedAt?: string;
}

export interface MealProgramListItemDto {
  id: string;
  user_id?: string;
  userId?: string;
  title: string;
  goal: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  timezone: string;
  horizon_weeks?: number;
  horizonWeeks?: number;
  status: MealProgramStatusDto;
  version: number;
  template_id?: string | null;
  templateId?: string | null;
  overall_compliance_rate?: number;
  overallComplianceRate?: number;
  readyWeeks?: number;
  ready_weeks?: number;
  failedWeeks?: number;
  failed_weeks?: number;
  current_week_number?: number;
  currentWeekNumber?: number;
  total_weeks?: number;
  totalWeeks?: number;
  cover_image_url?: string | null;
  coverImageUrl?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface MealProgramDto {
  id: string;
  user_id?: string;
  userId?: string;
  title: string;
  goal: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  timezone: string;
  horizon_weeks?: number;
  horizonWeeks?: number;
  status: MealProgramStatusDto;
  version: number;
  template_id?: string | null;
  templateId?: string | null;
  readyWeeks?: number;
  ready_weeks?: number;
  failedWeeks?: number;
  failed_weeks?: number;
  confirmedAt?: string | null;
  confirmed_at?: string | null;
  weeks: ProgramWeekDto[];
  analysis?: CumulativeAnalysisDto | null;
  cumulative_analysis?: CumulativeAnalysisDto | null;
  cumulativeAnalysis?: CumulativeAnalysisDto | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface MealProgramListResponseDto {
  items?: MealProgramListItemDto[];
  data?: MealProgramListItemDto[];
  pagination?: {
    page: number;
    limit: number;
    totalItems?: number;
    total?: number;
    totalPages?: number;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Payloads
export interface CreateMealProgramRequestDto {
  title: string;
  goal: MealProgramGoalDto;
  startDate: string; // ISO YYYY-MM-DD (must be Monday)
  timezone: string;
  horizonWeeks: number; // 2..12
  alternativesPerWeek?: number; // default 2
  seed?: string;
  idempotencyKey?: string;
}

export type PatchMealProgramActionDto =
  | {
      action: 'CONFIRM';
      expectedVersion: number;
      idempotencyKey?: string;
    }
  | {
      action: 'REANALYZE';
      expectedVersion: number;
      idempotencyKey?: string;
    }
  | {
      action: 'UPDATE_METADATA';
      expectedVersion: number;
      idempotencyKey?: string;
      title: string;
    }
  | {
      action: 'REGENERATE_WEEK';
      expectedVersion: number;
      idempotencyKey?: string;
      weekIndex: number;
      seed?: string;
      selectGenerated?: boolean;
    }
  | {
      action: 'SELECT_ALTERNATIVE';
      expectedVersion: number;
      idempotencyKey?: string;
      weekIndex: number;
      alternativeRank: number;
    };

export interface UpdateMealProgramRequestDto {
  action?: 'CONFIRM' | 'REANALYZE' | 'UPDATE_METADATA' | 'REGENERATE_WEEK' | 'SELECT_ALTERNATIVE';
  expectedVersion?: number;
  title?: string;
  goal?: string;
  status?: MealProgramStatusDto;
  version?: number;
  idempotencyKey?: string;
}

export interface RegenerateWeekRequestDto {
  version: number;
  weekIndex?: number;
  seed?: string;
  excluded_recipe_ids?: string[];
}

export interface UpdateWeekProgressRequestDto {
  version: number;
  completed_meal_ids?: string[];
}
