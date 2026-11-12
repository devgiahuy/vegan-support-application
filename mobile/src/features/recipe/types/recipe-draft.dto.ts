/** `POST /recipe-drafts/generate` request (đồng bộ backend `generateRecipeDraftRequestSchema`). */
export interface GenerateRecipeDraftRequestDto {
  /** Rỗng để AI gợi ý; nếu có thì 3–200 ký tự. */
  title: string;
  /** Rỗng để AI gợi ý; tối đa 500 ký tự. */
  description: string;
  /** Giá trị người dùng đã nhập được BE giữ nguyên (1–100 người). */
  servings?: number;
  /** 0–10080 phút. */
  prepTimeMinutes?: number;
  /** 0–10080 phút. */
  cookTimeMinutes?: number;
  /** 1–50 tên nguyên liệu, mỗi tên tối đa 160 ký tự. */
  ingredientNames: string[];
}

export interface RecipeDraftIngredientDto {
  displayName?: string;
  amount?: number | string;
  unit?: string;
  optional?: boolean;
}

export interface RecipeDraftStepDto {
  instruction?: string;
  durationMinutes?: number | null;
  affectedIngredientPositions?: number[];
}

export interface RecipeDraftContentDto {
  title?: string;
  excerpt?: string;
  body?: string;
  recipe?: {
    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    difficulty?: string;
    ingredients?: (RecipeDraftIngredientDto | null)[];
    steps?: (RecipeDraftStepDto | null)[];
  } | null;
}

export interface GenerateRecipeDraftResponseDto {
  success?: boolean;
  data?: {
    draft?: RecipeDraftContentDto | null;
    ingredientConfidence?: number[] | null;
    confidence?: number;
    assumptions?: (string | null)[] | null;
    provenance?: { provider?: string; model?: string; templateVersion?: string } | null;
  } | null;
}
