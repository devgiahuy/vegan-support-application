import { CatalogStatus, FoodGroup, ResolutionMatch } from '@/common/enums';

/**
 * Nguyên liệu chuẩn dùng cho UI.
 */
export interface IngredientAlias {
  id: string;
  alias: string;
}

export interface DietCompatibility {
  dietPattern: string;
  compatible: boolean;
}

export interface TraditionWarning {
  tradition: string;
  warningCode: string;
  label: string;
}

export interface Ingredient {
  id: string;
  canonicalName: string;
  normalizedName: string;
  foodGroup: FoodGroup;
  foodGroupLabel: string;
  status: CatalogStatus;
  aliases: IngredientAlias[];
  allergenCodes: string[];
  dietCompatibilities: DietCompatibility[];
  traditionWarnings: TraditionWarning[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Kết quả phân giải tên nguyên liệu. */
export interface IngredientResolution {
  query: string;
  normalizedQuery: string;
  match: ResolutionMatch;
  candidates: Ingredient[];
}
