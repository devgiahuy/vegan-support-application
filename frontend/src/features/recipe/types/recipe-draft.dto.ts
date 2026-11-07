/**
 * DTO gửi yêu cầu tạo bản nháp công thức qua AI
 */
export interface GenerateRecipeDraftRequestDto {
  /** Tên món, để trống để AI gợi ý. */
  title: string;
  /** Mô tả ngắn, để trống để AI gợi ý. */
  description: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  /** Danh sách tên các nguyên liệu chính (1 - 50 nguyên liệu) */
  ingredientNames: string[];
}

/**
 * DTO chi tiết từng nguyên liệu trong bản nháp AI
 */
export interface RecipeDraftIngredientDto {
  displayName?: string;
  amount?: number | string;
  unit?: string;
  optional?: boolean;
}

/**
 * DTO chi tiết từng bước nấu trong bản nháp AI
 */
export interface RecipeDraftStepDto {
  instruction?: string;
  durationMinutes?: number | null;
  affectedIngredientPositions?: number[];
}

/**
 * DTO chi tiết nội dung công thức nháp trả về từ AI
 */
export interface RecipeDraftContentDto {
  type?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  categoryIds?: string[];
  tags?: string[];
  media?: unknown[];
  recipe?: {
    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
    nutrition?: Record<string, unknown>;
    ingredients?: RecipeDraftIngredientDto[];
    steps?: RecipeDraftStepDto[];
  };
}

/**
 * DTO phản hồi hoàn chỉnh từ API Backend
 */
export interface GenerateRecipeDraftResponseDto {
  success: boolean;
  data: {
    draft: RecipeDraftContentDto;
    ingredientConfidence: number[];
    confidence: number;
    assumptions: string[];
    provenance: {
      provider: string;
      model: string;
      templateVersion: string;
    };
  };
}
