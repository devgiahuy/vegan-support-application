import { PostStatus, RecipeDifficulty } from '@/common/enums';

export type ContentType = 'blog' | 'video';
export type Difficulty = 'Dễ làm' | 'Trung bình' | 'Nâng cao';
export type DietSchool = 'PHAT_GIAO' | 'DAO_GIAO' | 'THUAN_CHAY' | 'ALL';
export type AuthorRole = 'NUTRITION_EXPERT' | 'EXPERIENCED_COOK' | 'CONTRIBUTOR';

export interface RecipeAuthor {
  id?: string;
  name: string;
  verified?: boolean;
  avatar?: string;
  avatarUrl?: string | null;
  role?: AuthorRole;
  roleTitle?: string;
}

export interface IngredientItem {
  name: string;
  amount: string | number;
  unit?: string;
  notes?: string;
  ingredientId?: string | null;
  category?: 'Nguyên liệu chính' | 'Gia vị chay' | 'Rau nêm & Ăn kèm';
}

export interface InstructionStep {
  stepNumber: number;
  title?: string;
  desc?: string;
  instruction?: string;
  imageUrl?: string | null;
  tip?: string;
  durationMinutes?: number;
}

export interface RecipeIngredient {
  ingredientId: string | null;
  name: string;
  amount: number;
  unit: string;
  notes: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  imageUrl: string | null;
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

export interface RecipeReview {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  roleBadge?: string;
}

export interface RecipeCategoryObject {
  id: string;
  name: string;
  slug?: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug?: string;
  status?: PostStatus;
  statusLabel?: string;
  /** Version optimistic-concurrency của backend (dùng cho update/delete). */
  version?: number;
  author: RecipeAuthor;
  category: string | RecipeCategoryObject;
  coverImageUrl?: string;
  /** Metadata ảnh bìa để ráp `media[]` khi tạo/sửa (backend yêu cầu publicId/bytes/mime). */
  coverMedia?: {
    publicId?: string;
    mimeType?: string;
    bytes?: number;
  } | null;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  difficulty: RecipeDifficulty | Difficulty;
  difficultyLabel?: string;
  mealPlannerEligible?: boolean;
  nutrition?: NutritionFact;
  ingredients?: RecipeIngredient[] | IngredientItem[];
  steps?: RecipeStep[] | InstructionStep[];
  instructions?: InstructionStep[];
  /** Nội dung toàn văn từ backend (`revision.body`, chứa hướng dẫn khi không có steps structured). */
  body?: string;
  publishedAt?: Date | null;
  formattedPublishedAt?: string;
  stats?: {
    views: number;
    likes: number;
    comments: number;
  };

  // --- Thuộc tính tương thích cho các component hiện có ---
  image: string;
  minutes: number;
  kcal: number;
  protein: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  /** Điểm đánh giá trung bình — backend chưa có, chỉ hiện khi có dữ liệu thật. */
  rating?: number;
  ratingCount?: number;
  saved?: boolean;
  contentType?: ContentType;
  expertVerified?: boolean;
  reviews?: RecipeReview[];
  description?: string;
  dietTag?: string;
  dietSchool?: DietSchool;
  /** Mã dị ứng suy từ nguyên liệu chuẩn (backend, có thể rỗng). */
  allergenCodes?: string[];
  traditionWarnings?: TraditionWarning[];
  dietCompatibilities?: DietCompatibility[];
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
