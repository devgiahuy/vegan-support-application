/**
 * DTO admin catalog: tái export type từ 2 DTO domain để import một nơi.
 * Không định nghĩa entity mới (Model/Mapper của domain được tái dùng).
 */
export type {
  AdminCategoryListResponseDto,
  CatalogArchiveResponseDto,
  CategoryResponseDto,
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from '@/features/category/types/category.dto';

export type {
  AddAliasRequestDto,
  CreateIngredientRequestDto,
  IngredientListResponseDto,
  IngredientResponseDto,
  UpdateIngredientRequestDto,
} from '@/features/ingredient/types/ingredient.dto';

/** Query archive category (`DELETE /admin/categories/:id?replacementId=...`). */
export interface ArchiveCategoryQuery {
  replacementId?: string;
}
