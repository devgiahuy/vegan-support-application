import type { MealProgramGoalDto, MealProgramStatusDto } from './meal-program.dto';

export type ProgramWeekStatus = 'PENDING' | 'READY' | 'FAILED';

/** Một phương án thực đơn của một tuần (tóm tắt từ snapshot backend). */
export interface ProgramAlternative {
  id: string;
  rank: number;
  mealPlanId: string;
  selected: boolean;
  mealCount: number;
  totalCalories: number;
  /** Vài món tiêu biểu để người dùng so sánh các phương án. */
  sampleDishes: string[];
  warningCount: number;
}

export interface ProgramWeek {
  id: string;
  weekIndex: number;
  weekNumber: number;
  weekStart: string;
  weekRangeLabel: string;
  status: ProgramWeekStatus;
  statusLabel: string;
  selectedRank: number | null;
  /** Dữ liệu tuần này đã cũ do thay đổi ở tuần trước (cần phân tích lại). */
  isProjectionStale: boolean;
  failureMessage: string | null;
  alternatives: ProgramAlternative[];
  /** Còn được sinh thêm phương án cho tuần này (theo giới hạn cấu hình của backend). */
  canRegenerate: boolean;
}

export interface ProgramWarning {
  key: string;
  code: string;
  title: string;
  description: string;
  suggestion: string | null;
  isCaution: boolean;
  /** Số thứ tự tuần (bắt đầu từ 1) liên quan đến cảnh báo. */
  weekNumbers: number[];
}

export interface ProgramNutritionSummary {
  analyzedWeeks: number;
  horizonWeeks: number;
  totalCalories: number;
  averageDailyCalories: number;
  totalVitaminB12Mcg: number | null;
  averageWeeklyVitaminB12Mcg: number | null;
  incompleteWeekNumbers: number[];
}

export interface ProgramAnalysis {
  version: number;
  isStale: boolean;
  /** Số thứ tự tuần đầu tiên bị vô hiệu (bắt đầu từ 1); null nếu không có. */
  invalidatedFromWeekNumber: number | null;
  warnings: ProgramWarning[];
  nutrition: ProgramNutritionSummary | null;
}

export interface MealProgram {
  id: string;
  title: string;
  goal: MealProgramGoalDto;
  goalLabel: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  timezone: string;
  horizonWeeks: number;
  status: MealProgramStatusDto;
  statusLabel: string;
  isConfirmed: boolean;
  version: number;
  readyWeeks: number;
  failedWeeks: number;
  confirmedAt: string | null;
  weeks: ProgramWeek[];
  analysis: ProgramAnalysis | null;
  warningCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealProgramListResult {
  items: MealProgram[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateMealProgramInput {
  title: string;
  goal: MealProgramGoalDto;
  startDate: string;
  horizonWeeks: number;
  alternativesPerWeek?: number;
  seed?: string;
}

/** Hành động cập nhật lộ trình (map 1-1 với `PATCH /meal-programs/:id`). */
export type MealProgramAction =
  | { type: 'UPDATE_METADATA'; title: string }
  | { type: 'SELECT_ALTERNATIVE'; weekIndex: number; alternativeRank: number }
  | { type: 'REGENERATE_WEEK'; weekIndex: number }
  | { type: 'REANALYZE' }
  | { type: 'CONFIRM' };
