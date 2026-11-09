import type { RecipeDifficulty } from '@/common/enums';

/** Dữ liệu người dùng gửi cho trợ lý AI. */
export interface RecipeDraftPrompt {
  /** Có thể rỗng — AI sẽ gợi ý tên món. */
  title: string;
  /** Có thể rỗng — AI sẽ gợi ý mô tả. */
  description: string;
  /** Chỉ gửi khi người dùng đã nhập; BE giữ nguyên các giá trị này. */
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
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
  /** Tên món AI gợi ý (hoặc tên người dùng đã nhập, BE giữ nguyên). */
  title: string;
  /** Mô tả ngắn AI gợi ý (hoặc mô tả người dùng đã nhập). */
  description: string;
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
