import type { RecipeDifficulty } from '@/common/enums';

/** Dữ liệu người dùng gửi cho trợ lý AI. */
export interface RecipeDraftPrompt {
  title: string;
  description: string;
  ingredientNames: string[];
}

export interface RecipeDraftIngredient {
  name: string;
  amount: number;
  unit: string;
  optional: boolean;
  /** Độ tự tin chủ quan của AI (0–1), không phải số liệu đã xác minh. */
  confidence: number | null;
}

export interface RecipeDraftStep {
  instruction: string;
  durationMinutes: number | null;
  /** Vị trí (0-based) trong `ingredients` của các nguyên liệu bước này tác động. */
  affectedIngredientPositions: number[];
}

/** Bản nháp AI gợi ý — chỉ là đề xuất để người dùng sửa, chưa lưu và chưa được xác minh. */
export interface RecipeDraftSuggestion {
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeDraftIngredient[];
  steps: RecipeDraftStep[];
  confidence: number | null;
  assumptions: string[];
  provenance: { provider: string; model: string; templateVersion: string } | null;
}
