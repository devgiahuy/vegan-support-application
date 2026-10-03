import type { FoodGroup, ResolutionMatch } from '@/common/enums';

export interface IngredientAlias {
  id: string;
  alias: string;
}

/** Model rút gọn cho tra cứu nguyên liệu công khai (đủ cho UI tìm kiếm + badge). */
export interface Ingredient {
  id: string;
  canonicalName: string;
  foodGroup: FoodGroup;
  foodGroupLabel: string;
  aliases: IngredientAlias[];
  allergenCodes: string[];
}

/** Ứng viên phân giải: nguyên liệu kèm tương thích chế độ ăn và cảnh báo truyền thống. */
export interface ResolvedIngredient extends Ingredient {
  dietCompatibilities: { label: string; compatible: boolean }[];
  traditionWarnings: string[];
}

export interface IngredientResolution {
  query: string;
  match: ResolutionMatch;
  candidates: ResolvedIngredient[];
}
