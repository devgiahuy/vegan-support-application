import {
  BaseBidirectionalMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  CatalogArchiveResponseDto,
  CatalogPageMetaDto,
  CategoryDto,
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from '../types/category.dto';
import type { Category } from '../types/category.model';
import { CatalogStatus, CategoryType } from '@/common/enums';

const TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.FOOD_TYPE]: 'Loại thực phẩm',
  [CategoryType.RECIPE_GROUP]: 'Nhóm công thức',
  [CategoryType.CONTENT_TOPIC]: 'Chủ đề nội dung',
};

/**
 * CategoryMapper: cây public, list admin (meta catalog chuẩn hóa),
 * response đơn, archive, create/update payload.
 */
export class CategoryMapper extends BaseBidirectionalMapper<
  CategoryDto,
  Category,
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto
> {
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
  toTreeModel(data: (CategoryDto | null)[] | null | undefined): Category[] {
    return this.toModelList(safeArray<CategoryDto | null, CategoryDto | null>(data, (c) => c)).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }

  /** `GET /admin/categories` — chuẩn hóa meta catalog về `PaginationResult`. */
  toAdminPaginationModel(
    rawItems: (CategoryDto | null)[] | null | undefined,
    meta: CatalogPageMetaDto | null | undefined
  ): PaginationResult<Category> {
    const items = this.toModelList(
      safeArray<CategoryDto | null, CategoryDto | null>(rawItems, (c) => c)
    );
    const page = safeNumber(pickField(meta, ['page'], 1));
    const limit = safeNumber(pickField(meta, ['limit'], 10));
    const totalItems = safeNumber(pickField(meta, ['total'], items.length));
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
    return {
      items,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /** `DELETE /admin/*` → `{id, status}`. */
  toArchiveModel(data: CatalogArchiveResponseDto['data']): {
    id: string;
    status: string;
  } {
    return {
      id: safeString(pickField(data, ['id'], '')),
      status: safeString(pickField(data, ['status'], 'ARCHIVED')),
    };
  }

  toCreateDto(domain: Partial<Category>): CreateCategoryRequestDto {
    return {
      name: safeString(domain.name),
      type: safeString(domain.type, CategoryType.FOOD_TYPE),
      ...(domain.slug ? { slug: domain.slug } : {}),
      ...(domain.parentId !== undefined ? { parentId: domain.parentId } : {}),
      ...(domain.sortOrder !== undefined ? { sortOrder: domain.sortOrder } : {}),
    };
  }

  toUpdateDto(domain: Partial<Category>): UpdateCategoryRequestDto {
    const dto: UpdateCategoryRequestDto = {};
    if (domain.name !== undefined) dto.name = domain.name;
    if (domain.type !== undefined) dto.type = domain.type;
    if (domain.slug !== undefined) dto.slug = domain.slug;
    if (domain.parentId !== undefined) dto.parentId = domain.parentId;
    if (domain.sortOrder !== undefined) dto.sortOrder = domain.sortOrder;
    return dto;
  }
}

export const categoryMapper = new CategoryMapper();
