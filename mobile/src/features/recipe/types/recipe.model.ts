import { PostStatus, RecipeDifficulty } from '@/common/enums';

export interface RecipeAuthor {
  id?: string;
  name: string;
  verified?: boolean;
  avatarUrl?: string | null;
}

export interface RecipeIngredient {
  ingredientId: string | null;
  name: string;
  amount: number;
  unit: string;
  notes: string;
}

export interface NutritionFact {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitaminB12: number;
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
  /** Hướng dẫn nấu dạng văn bản — backend chưa trả steps có cấu trúc, chỉ có `revision.body`. */
  body: string;
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
