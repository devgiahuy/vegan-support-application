import { FoodGroup } from '@/common/enums';

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
