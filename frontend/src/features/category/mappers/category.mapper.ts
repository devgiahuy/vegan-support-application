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
  AdminCategoryListResponseDto,
  CatalogArchiveResponseDto,
  CategoryDto,
  CategoryResponseDto,
  CategoryTreeResponseDto,
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
  toTreeModel(dto: CategoryTreeResponseDto | null | undefined): Category[] {
    const data = pickField(dto, ['data'], null) as (CategoryDto | null)[] | null;
    return this.toModelList(safeArray<CategoryDto | null, CategoryDto | null>(data, (c) => c)).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }

  /** `GET /admin/categories` — chuẩn hóa meta catalog về `PaginationResult`. */
  toAdminPaginationModel(
    dto: AdminCategoryListResponseDto | null | undefined
  ): PaginationResult<Category> {
    const rawItems = pickField(dto, ['data'], null) as (CategoryDto | null)[] | null;
    const items = this.toModelList(
      safeArray<CategoryDto | null, CategoryDto | null>(rawItems, (c) => c)
    );
    const meta = pickField(dto, ['meta'], null) as AdminCategoryListResponseDto['meta'];
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

  /** `POST/PATCH /admin/categories*` → 1 node. */
  toSingleModel(dto: CategoryResponseDto | null | undefined): Category {
    const data = pickField(dto, ['data'], null) as CategoryDto | null;
    return this.toModel(data);
  }

  /** `DELETE /admin/*` → `{id, status}`. */
  toArchiveModel(dto: CatalogArchiveResponseDto | null | undefined): {
    id: string;
    status: string;
  } {
    const data = pickField(dto, ['data'], null) as CatalogArchiveResponseDto['data'];
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
