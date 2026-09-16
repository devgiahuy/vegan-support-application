import { describe, expect, it } from 'vitest';
import { categoryMapper } from '@/features/category/mappers/category.mapper';
import { CatalogStatus, CategoryType } from '@/common/enums';

const TREE = {
  success: true,
  data: [
    {
      id: 'c-1',
      parentId: null,
      name: 'Rau củ',
      slug: 'rau-cu',
      type: 'FOOD_TYPE',
      status: 'ACTIVE',
      sortOrder: 2,
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-02T08:00:00.000Z',
      children: [
        {
          id: 'c-1-1',
          parentId: 'c-1',
          name: 'Rau lá',
          slug: 'rau-la',
          type: 'FOOD_TYPE',
          status: 'ACTIVE',
          sortOrder: 1,
          children: null,
        },
        null,
      ],
    },
    {
      id: 'c-2',
      parentId: null,
      name: 'Món chay',
      slug: 'mon-chay',
      type: 'RECIPE_GROUP',
      status: 'ACTIVE',
      sortOrder: 1,
      children: [],
    },
  ],
  meta: null,
};

describe('CategoryMapper.toTreeModel', () => {
  it('map cây 2 tầng, sắp xếp theo sortOrder, bỏ phần tử null', () => {
    const tree = categoryMapper.toTreeModel(TREE);

    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe('c-2');
    expect(tree[1].id).toBe('c-1');
    expect(tree[1].parentId).toBeNull();
    expect(tree[1].children).toHaveLength(1);
    expect(tree[1].children[0].name).toBe('Rau lá');
    expect(tree[1].children[0].parentId).toBe('c-1');
    expect(tree[0].type).toBe(CategoryType.RECIPE_GROUP);
    expect(tree[0].typeLabel).toBe('Nhóm công thức');
  });

  it('children thiếu/null thành mảng rỗng, enum lạ fallback an toàn', () => {
    const tree = categoryMapper.toTreeModel({
      success: true,
      data: [{ id: 'x', name: 'X', type: 'WEIRD', status: 'HIDDEN' }],
      meta: null,
    });

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toEqual([]);
    expect(tree[0].type).toBe(CategoryType.FOOD_TYPE);
    expect(tree[0].status).toBe(CatalogStatus.ACTIVE);
  });

  it('trả mảng rỗng khi dto null', () => {
    expect(categoryMapper.toTreeModel(null)).toEqual([]);
  });
});

describe('CategoryMapper.toAdminPaginationModel', () => {
  it('chuẩn hóa meta catalog về PaginationResult', () => {
    const page = categoryMapper.toAdminPaginationModel({
      success: true,
      data: [{ id: 'c-1', name: 'A', type: 'FOOD_TYPE', status: 'ARCHIVED' }],
      meta: { page: 1, limit: 10, total: 25, totalPages: 3 },
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].status).toBe(CatalogStatus.ARCHIVED);
    expect(page.metadata).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false,
    });
  });
});

describe('CategoryMapper.toCreateDto / toUpdateDto', () => {
  it('create đủ field, update chỉ gửi field đổi', () => {
    expect(categoryMapper.toCreateDto({ name: 'Mới', type: CategoryType.FOOD_TYPE })).toEqual({
      name: 'Mới',
      type: 'FOOD_TYPE',
    });
    expect(categoryMapper.toUpdateDto({ name: 'Đổi' })).toEqual({ name: 'Đổi' });
    expect(categoryMapper.toUpdateDto({})).toEqual({});
  });
});

describe('CategoryMapper.toArchiveModel', () => {
  it('map archive response', () => {
    expect(
      categoryMapper.toArchiveModel({
        success: true,
        data: { id: 'c-1', status: 'ARCHIVED' },
        meta: null,
      })
    ).toEqual({ id: 'c-1', status: 'ARCHIVED' });
  });
});
