export type ContentType = 'blog' | 'video';
export type Difficulty = 'Dễ làm' | 'Trung bình' | 'Nâng cao';
export type DietSchool = 'PHAT_GIAO' | 'DAO_GIAO' | 'THUAN_CHAY' | 'ALL';
export type AuthorRole = 'NUTRITION_EXPERT' | 'EXPERIENCED_COOK' | 'CONTRIBUTOR';

export interface RecipeAuthor {
  name: string;
  verified?: boolean;
  avatar?: string;
  role?: AuthorRole;
  roleTitle?: string;
}

export interface IngredientItem {
  name: string;
  amount: string;
  category?: 'Nguyên liệu chính' | 'Gia vị chay' | 'Rau nêm & Ăn kèm';
}

export interface InstructionStep {
  stepNumber: number;
  title: string;
  desc: string;
  tip?: string;
  durationMinutes?: number;
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

export interface Recipe {
  id: string;
  title: string;
  image: string;
  minutes: number;
  kcal: number;
  protein: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  difficulty: Difficulty;
  rating: number;
  ratingCount: number;
  category: string;
  contentType: ContentType;
  dietTag?: string;
  dietSchool?: DietSchool;
  author: RecipeAuthor;
  saved?: boolean;
  expertVerified?: boolean;
  description?: string;
  servings?: number;
  ingredients?: IngredientItem[];
  instructions?: InstructionStep[];
  reviews?: RecipeReview[];
}
