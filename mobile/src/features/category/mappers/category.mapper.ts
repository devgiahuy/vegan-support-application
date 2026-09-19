import { BaseMapper, pickField, safeArray, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type { CategoryDto, CategoryTreeResponseDto } from '../types/category.dto';
import type { Category } from '../types/category.model';
import { CatalogStatus, CategoryType } from '@/common/enums';

const TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.FOOD_TYPE]: 'Loại thực phẩm',
  [CategoryType.RECIPE_GROUP]: 'Nhóm công thức',
  [CategoryType.CONTENT_TOPIC]: 'Chủ đề nội dung',
};

/** CategoryMapper — bản đọc (cây public), đồng bộ `frontend/.../category.mapper.ts`. */
export class CategoryMapper extends BaseMapper<CategoryDto, Category> {
  toModel(dto: CategoryDto | null | undefined): Category {
    const type = safeEnum(
      pickField(dto, ['type', 'categoryType', 'category_type'], 'FOOD_TYPE'),
      CategoryType,
      CategoryType.FOOD_TYPE
    );
    const parentId = safeString(pickField(dto, ['parentId', 'parent_id'], ''));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      parentId: parentId.length > 0 ? parentId : null,
      name: safeString(pickField(dto, ['name', 'category_name'], 'Danh mục')),
      slug: safeString(pickField(dto, ['slug'], '')),
      type,
      typeLabel: TYPE_LABELS[type],
      status: safeEnum(pickField(dto, ['status'], 'ACTIVE'), CatalogStatus, CatalogStatus.ACTIVE),
      sortOrder: safeNumber(pickField(dto, ['sortOrder', 'sort_order'], 0)),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
      children: this.toModelList(
        safeArray<CategoryDto | null, CategoryDto | null>(
          pickField(dto, ['children'], null),
          (c) => c
        ).filter((c): c is CategoryDto => c !== null && typeof c === 'object')
      ),
    };
  }

  /** `GET /categories` — data là mảng cây. */
  toTreeModel(dto: CategoryTreeResponseDto | null | undefined): Category[] {
    const data = pickField(dto, ['data'], null) as (CategoryDto | null)[] | null;
    return this.toModelList(
      safeArray<CategoryDto | null, CategoryDto | null>(data, (c) => c)
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

export const categoryMapper = new CategoryMapper();
