import { RecipeDifficulty } from '@/common/enums';

/**
 * Dữ liệu đầu vào của tác giả gửi cho Trợ lý AI
 */
export interface RecipeDraftPrompt {
  title: string;
  description: string;
  ingredientNames: string[];
  /** Số tác giả đã nhập ở bước 1; để trống thì AI tự đề xuất */
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
}

/**
 * Thông tin một nguyên liệu định lượng từ bản nháp AI
 */
export interface RecipeDraftIngredient {
  name: string;
  amount: number;
  unit: string;
  optional: boolean;
  confidence: number;
}

/**
 * Thông tin một bước thực hiện tuần tự từ bản nháp AI
 */
export interface RecipeDraftStep {
  stepNumber: number;
  instruction: string;
  durationMinutes: number | null;
  affectedIngredientIndices: number[];
}

/**
 * Bản nháp gợi ý hoàn chỉnh hiển thị cho người dùng
 */
export interface RecipeDraftSuggestion {
  title: string;
  description: string;
  body: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeDraftIngredient[];
  steps: RecipeDraftStep[];
  confidence: number;
  assumptions: string[];
  /** Khẩu phần/thời gian AI tự đề xuất, null khi backend không trả */
  suggestedTiming: {
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
  } | null;
  provenance: {
    provider: string;
    model: string;
    templateVersion: string;
  };
}
