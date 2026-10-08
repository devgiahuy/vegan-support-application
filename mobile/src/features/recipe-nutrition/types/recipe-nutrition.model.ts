export type NutritionOrigin = 'CANONICAL_CALCULATED' | 'AI_ESTIMATED' | 'USER_PROVIDED' | 'VERIFIED_OVERRIDE';
export type NutritionEstimateStatus = 'CURRENT' | 'HISTORICAL' | 'STALE' | 'NONE';

export interface NutrientLine {
  code: string;
  name: string;
  unit: string;
  amount: number;
  formattedAmount: string;
  origin: NutritionOrigin;
  isAiEstimated: boolean;
  confidencePercent: number;
  /** Khoảng ước tính `a – b`; null khi không có hoặc khoảng không hợp lệ so với giá trị. */
  rangeLabel: string | null;
}

/** Phân bổ năng lượng theo đạm/tinh bột/béo (ước tính từ gam × hệ số Atwater 4/4/9). */
export interface MacroSplit {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface UncoveredIngredient {
  position: number;
  displayName: string;
  reason: string;
}

export interface NutritionAssumption {
  code: string;
  message: string;
  isAiEstimated: boolean;
}

export interface RecipeNutritionEstimate {
  id: string | null;
  postId: string;
  postVersion: number;
  estimateVersion: number | null;
  status: NutritionEstimateStatus;
  isStale: boolean;
  /** Ước tính chưa lưu (từ `preview`) vì công thức chưa có bản tính chính thức. */
  isPreview: boolean;
  servings: number;
  totalRawGrams: number;
  totalCookedGrams: number;
  confidencePercent: number;
  /** Mỗi khẩu phần. */
  nutrients: NutrientLine[];
  macroSplit: MacroSplit | null;
  uncoveredIngredients: UncoveredIngredient[];
  assumptions: NutritionAssumption[];
  /** Nguồn dữ liệu đã dùng, dạng `MÃ_NGUỒN vPHIÊN_BẢN`. */
  sourceLabels: string[];
  aiUsed: boolean;
  aiProviderDown: boolean;
  disclaimer: string;
  formattedCreatedAt: string;
}

export interface RecipeNutritionStatus {
  isStale: boolean;
  currentStatus: NutritionEstimateStatus;
  aiJobStatus: string | null;
  aiJobStatusLabel: string | null;
}

export interface RecipeNutritionHistoryItem {
  estimateVersion: number | null;
  formattedDate: string;
  servings: number;
  caloriesPerServing: number | null;
  confidencePercent: number;
  isStale: boolean;
  aiUsed: boolean;
  status: NutritionEstimateStatus;
}

export interface RecipeNutritionHistoryResult {
  items: RecipeNutritionHistoryItem[];
  total: number;
  totalPages: number;
}
