export type MealProgramStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'ARCHIVED' | 'FAILED';
export type ProgramWeekStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
export type MealProgramGoal = 'MAINTAIN' | 'LOSE' | 'GAIN';

export interface MealItemSummary {
  id: string;
  name: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  mealTypeLabel: string;
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  sourceTypeLabel: string;
  servings: number;
  calories: number;
  imageUrl?: string;
  isCompleted?: boolean;
}

export interface ProgramDaySummary {
  date: string;
  formattedDate: string; // '28/09'
  dayOfWeek: number; // 1..7
  dayOfWeekLabel?: string; // 'Thứ Hai'
  meals: MealItemSummary[];
  totalCalories: number;
}

export interface WeeklyPlanSnapshot {
  capturedAt: string;
  totalCalories: number;
  macronutrients: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  days: ProgramDaySummary[];
}

export interface ProgramWeek {
  id: string;
  programId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  formattedDateRange: string;
  status: ProgramWeekStatus;
  statusLabel: string; // 'Sắp tới' | 'Đang thực hiện' | 'Đã hoàn thành'
  complianceRate: number; // 0 - 100
  isDownstreamInvalidated: boolean;
  snapshot?: WeeklyPlanSnapshot | null;
}

export interface RepeatedPatternWarning {
  mealId: string;
  mealName: string;
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  occurrences: number;
  dates: string[];
  formattedDates?: string[];
  message: string;
}

export interface CumulativeAnalysis {
  averageDailyCalories: number;
  averageMacronutrients: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  repeatedPatternWarnings: RepeatedPatternWarning[];
  isInvalidated: boolean;
  analyzedAt: string;
  analyzedAtFormatted: string;
}

export interface MealProgramListItem {
  id: string;
  userId: string;
  title: string;
  goal: string;
  goalLabel: string;
  startDate: string;
  endDate: string;
  formattedDateRange: string;
  timezone: string;
  horizonWeeks: number;
  status: MealProgramStatus;
  statusLabel: string;
  statusBadgeVariant: 'warning' | 'default' | 'success' | 'secondary' | 'destructive';
  version: number;
  templateId?: string | null;
  overallComplianceRate: number;
  currentWeekNumber: number;
  totalWeeks: number;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealProgram {
  id: string;
  userId: string;
  title: string;
  goal: string;
  goalLabel: string;
  startDate: string;
  endDate: string;
  formattedDateRange: string;
  timezone: string;
  horizonWeeks: number;
  status: MealProgramStatus;
  statusLabel: string;
  statusBadgeVariant: 'warning' | 'default' | 'success' | 'secondary' | 'destructive';
  version: number;
  templateId?: string | null;
  weeks: ProgramWeek[];
  cumulativeAnalysis?: CumulativeAnalysis | null;
  overallComplianceRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealProgramListResult {
  items: MealProgramListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
