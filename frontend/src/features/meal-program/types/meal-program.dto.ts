export type MealProgramStatusDto = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'ARCHIVED';
export type ProgramWeekStatusDto = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface WeeklyPlanMealItemDto {
  id: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  source_type: 'RECIPE' | 'CUSTOM_MEAL';
  name: string;
  servings: number;
  calories: number;
  image_url?: string | null;
}

export interface WeeklyPlanDayDto {
  date: string;
  day_of_week: number;
  meals: WeeklyPlanMealItemDto[];
}

export interface WeeklyPlanSnapshotDto {
  captured_at: string;
  total_calories: number;
  macronutrients: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  days: WeeklyPlanDayDto[];
}

export interface ProgramWeekDto {
  id: string;
  program_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  status: ProgramWeekStatusDto;
  compliance_rate: number;
  is_downstream_invalidated: boolean;
  snapshot?: WeeklyPlanSnapshotDto | null;
}

export interface RepeatedPatternWarningDto {
  meal_id: string;
  meal_name: string;
  source_type: 'RECIPE' | 'CUSTOM_MEAL';
  occurrences: number;
  dates: string[];
  message: string;
}

export interface CumulativeAnalysisDto {
  average_daily_calories: number;
  average_macronutrients: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  repeated_pattern_warnings: RepeatedPatternWarningDto[];
  is_invalidated: boolean;
  analyzed_at: string;
}

export interface MealProgramListItemDto {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  start_date: string;
  end_date: string;
  timezone: string;
  horizon_weeks: number;
  status: MealProgramStatusDto;
  version: number;
  template_id?: string | null;
  overall_compliance_rate?: number;
  current_week_number?: number;
  total_weeks?: number;
  cover_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealProgramDto {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  start_date: string;
  end_date: string;
  timezone: string;
  horizon_weeks: number;
  status: MealProgramStatusDto;
  version: number;
  template_id?: string | null;
  weeks: ProgramWeekDto[];
  cumulative_analysis?: CumulativeAnalysisDto | null;
  created_at: string;
  updated_at: string;
}

export interface MealProgramListResponseDto {
  items: MealProgramListItemDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// Request Payloads
export interface CreateMealProgramRequestDto {
  title: string;
  goal: string;
  start_date: string; // ISO YYYY-MM-DD
  timezone: string;
  horizon_weeks: number; // 2 | 4 | 8
  template_id?: string | null;
}

export interface UpdateMealProgramRequestDto {
  title?: string;
  goal?: string;
  status?: MealProgramStatusDto;
  version: number;
}

export interface RegenerateWeekRequestDto {
  version: number;
  excluded_recipe_ids?: string[];
}

export interface UpdateWeekProgressRequestDto {
  version: number;
  completed_meal_ids: string[];
}
