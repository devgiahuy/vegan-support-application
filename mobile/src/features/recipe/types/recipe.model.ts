import { PostStatus, RecipeDifficulty } from '@/common/enums';

export interface RecipeAuthor {
  id?: string;
  name: string;
  verified?: boolean;
  avatarUrl?: string | null;
}

/** Một bước nấu có cấu trúc (khi tác giả nhập từng bước); rỗng với công thức chỉ có phần mô tả văn bản. */
export interface RecipeInstructionStep {
  position: number;
  instruction: string;
  durationMinutes: number | null;
  temperatureCelsius: number | null;
  cookingMethodName: string | null;
}

export interface RecipeIngredient {
  ingredientId: string | null;
  name: string;
  amount: number;
  unit: string;
  notes: string;
}

/** Mỗi chỉ số `null` = backend chưa có dữ liệu (không phải 0). UI phải hiển thị "chưa có". */
export interface NutritionFact {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  vitaminB12: number | null;
}

export interface TraditionWarning {
  tradition: string;
  warningCode: string;
  label: string;
}

export interface DietCompatibility {
  dietPattern: string;
  compatible: boolean;
  reasonCodes: string[];
}

export interface RecipeCategoryObject {
  id: string;
  name: string;
  slug?: string;
}

/** Domain Model cho danh sách/hiển thị công thức (đọc — chưa gồm create/update). */
export interface Recipe {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  statusLabel: string;
  version: number;
  author: RecipeAuthor;
  category: RecipeCategoryObject;
  coverImageUrl: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: RecipeDifficulty;
  difficultyLabel: string;
  mealPlannerEligible: boolean;
  nutrition: NutritionFact;
  ingredients: RecipeIngredient[];
  /** Các bước nấu có cấu trúc (nếu có). */
  steps: RecipeInstructionStep[];
  /** Hướng dẫn nấu dạng văn bản (`revision.body`), dùng khi chưa có bước có cấu trúc. */
  body: string;
  tags: string[];
  publishedAt: Date | null;
  formattedPublishedAt: string;
  description: string;
  allergenCodes: string[];
  traditionWarnings: TraditionWarning[];
  dietCompatibilities: DietCompatibility[];
  /** Backend chưa có rating: chỉ hiện khi có dữ liệu thật (giữ `undefined`, không bịa số). */
  rating?: number;
  ratingCount?: number;
}

export interface AppliedSearchConstraints {
  authenticated: boolean;
  dietPattern: string | null;
  allergyCount: number;
  ingredientExclusionCount: number;
  traditions: string[];
  forDate: string;
}

export interface RecipePaginationMetadata {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  appliedConstraints?: AppliedSearchConstraints;
}

export interface RecipePaginationResult {
  items: Recipe[];
  metadata: RecipePaginationMetadata;
}
