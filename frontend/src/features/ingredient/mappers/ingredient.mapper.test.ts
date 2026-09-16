import { describe, expect, it } from 'vitest';
import { ingredientMapper } from '@/features/ingredient/mappers/ingredient.mapper';
import { CatalogStatus, FoodGroup, ResolutionMatch } from '@/common/enums';

const ITEM = {
  id: 'i-1',
  canonicalName: 'Đậu phộng',
  normalizedName: 'dau phong',
  foodGroup: 'LEGUMES',
  status: 'ACTIVE',
  aliases: [{ id: 'a-1', alias: 'lạc' }, 'dau lac', null],
  allergenCodes: ['PEANUT', ''],
  dietCompatibilities: [{ dietPattern: 'VEGAN', compatible: true }],
  traditionWarnings: [{ tradition: 'BUDDHIST', warningCode: 'W1', label: 'Cảnh báo' }],
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-02T08:00:00.000Z',
};

describe('IngredientMapper.toModel', () => {
  it('map đủ field, alias shape hỗn hợp, lọc rỗng', () => {
    const m = ingredientMapper.toModel({ ...ITEM });

    expect(m.canonicalName).toBe('Đậu phộng');
    expect(m.foodGroup).toBe(FoodGroup.LEGUMES);
    expect(m.foodGroupLabel).toBe('Đậu');
    expect(m.aliases).toHaveLength(2);
    expect(m.aliases[0]).toEqual({ id: 'a-1', alias: 'lạc' });
    expect(m.allergenCodes).toEqual(['PEANUT']);
    expect(m.dietCompatibilities).toEqual([{ dietPattern: 'VEGAN', compatible: true }]);
    expect(m.traditionWarnings).toHaveLength(1);
  });

  it('enum lạ fallback an toàn', () => {
    const m = ingredientMapper.toModel({ ...ITEM, foodGroup: 'WEIRD', status: 'HIDDEN' });
    expect(m.foodGroup).toBe(FoodGroup.OTHER);
    expect(m.status).toBe(CatalogStatus.ACTIVE);
  });

  it('trả defaults khi dto null', () => {
    const m = ingredientMapper.toModel(null);
    expect(m.id).toBe('');
    expect(m.aliases).toEqual([]);
  });
});

describe('IngredientMapper.toListModel', () => {
  it('chuẩn hóa meta catalog', () => {
    const page = ingredientMapper.toListModel({
      success: true,
      data: [{ ...ITEM }],
      meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
    expect(page.metadata).toMatchObject({
      page: 2,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });
});

describe('IngredientMapper.toSingleModel', () => {
  it('bóc envelope data 1 item (dùng cho admin create/update/addAlias)', () => {
    const m = ingredientMapper.toSingleModel({
      success: true,
      data: { ...ITEM },
      meta: null,
    });
    expect(m.id).toBe('i-1');
    expect(m.canonicalName).toBe('Đậu phộng');
    expect(m.aliases).toHaveLength(2);
  });

  it('trả defaults khi envelope null hoặc data null', () => {
    expect(ingredientMapper.toSingleModel(null).id).toBe('');
    expect(
      ingredientMapper.toSingleModel({ success: true, data: null, meta: null }).aliases
    ).toEqual([]);
  });
});

describe('IngredientMapper.toListModel edge', () => {
  it('envelope null trả list rỗng với meta mặc định', () => {
    const page = ingredientMapper.toListModel(null);
    expect(page.items).toEqual([]);
    expect(page.metadata).toMatchObject({ page: 1, totalItems: 0, totalPages: 1 });
  });

  it('meta thiếu dùng số item làm total fallback', () => {
    const page = ingredientMapper.toListModel({
      success: true,
      data: [{ ...ITEM }],
      meta: null,
    } as never);
    expect(page.items).toHaveLength(1);
    expect(page.metadata.totalItems).toBe(1);
  });
});

describe('IngredientMapper.toModel biến thể BE', () => {
  it('đọc snake_case khi BE trả tên field gạch dưới', () => {
    const m = ingredientMapper.toModel({
      id: 'i-2',
      canonical_name: 'Đậu nành',
      normalized_name: 'dau nanh',
      food_group: 'LEGUMES',
      status: 'ACTIVE',
      allergen_codes: ['SOY'],
      diet_compatibilities: [{ diet_pattern: 'VEGAN', compatible: true }],
      tradition_warnings: [{ tradition: 'BUDDHIST', warning_code: 'W2', label: 'Nhắc' }],
      created_at: '2026-09-01T08:00:00.000Z',
      updated_at: '2026-09-02T08:00:00.000Z',
    } as never);
    expect(m.canonicalName).toBe('Đậu nành');
    expect(m.normalizedName).toBe('dau nanh');
    expect(m.allergenCodes).toEqual(['SOY']);
    expect(m.dietCompatibilities).toEqual([{ dietPattern: 'VEGAN', compatible: true }]);
    expect(m.traditionWarnings).toEqual([
      { tradition: 'BUDDHIST', warningCode: 'W2', label: 'Nhắc' },
    ]);
    expect(m.createdAt).toBeInstanceOf(Date);
  });

  it('alias dạng chuỗi trần và key aliasId/alias_id đều đọc được', () => {
    const m = ingredientMapper.toModel({
      ...ITEM,
      aliases: [
        'lac',
        { aliasId: 'a-9', name: 'đậu lạc' },
        { alias_id: 'a-10', value: 'phong' },
        '',
      ],
    } as never);
    expect(m.aliases).toEqual([
      { id: '', alias: 'lac' },
      { id: 'a-9', alias: 'đậu lạc' },
      { id: 'a-10', alias: 'phong' },
    ]);
  });

  it('compat/warnings giữ chỗ null dưới dạng object rỗng đã sanitize, allergen bỏ giá trị không chuỗi', () => {
    const m = ingredientMapper.toModel({
      ...ITEM,
      dietCompatibilities: [null, { dietPattern: 'VEGAN', compatible: true }],
      traditionWarnings: [null],
      allergenCodes: ['PEANUT', null, 42, ''],
    } as never);
    expect(m.dietCompatibilities).toEqual([
      { dietPattern: '', compatible: false },
      { dietPattern: 'VEGAN', compatible: true },
    ]);
    expect(m.traditionWarnings).toEqual([{ tradition: '', warningCode: '', label: '' }]);
    expect(m.allergenCodes).toEqual(['PEANUT']);
  });
});

describe('IngredientMapper.toResolutionModel edge', () => {
  it('đọc normalized_query snake_case', () => {
    const r = ingredientMapper.toResolutionModel({
      success: true,
      data: { query: 'dau', normalized_query: 'dau', match: 'NONE', candidates: [] },
      meta: null,
    } as never);
    expect(r.normalizedQuery).toBe('dau');
    expect(r.match).toBe(ResolutionMatch.NONE);
  });
});

describe('IngredientMapper.toResolutionModel', () => {
  it.each([
    ['NONE', ResolutionMatch.NONE],
    ['EXACT', ResolutionMatch.EXACT],
    ['AMBIGUOUS', ResolutionMatch.AMBIGUOUS],
  ])('match %s map đúng', (raw, expected) => {
    const r = ingredientMapper.toResolutionModel({
      success: true,
      data: { query: 'đậu', normalizedQuery: 'dau', match: raw, candidates: [{ ...ITEM }] },
      meta: null,
    });
    expect(r.match).toBe(expected);
    expect(r.candidates).toHaveLength(1);
  });

  it('candidates null thành mảng rỗng, match lạ thành NONE', () => {
    const r = ingredientMapper.toResolutionModel({
      success: true,
      data: { query: 'x', match: 'WEIRD', candidates: null },
      meta: null,
    });
    expect(r.match).toBe(ResolutionMatch.NONE);
    expect(r.candidates).toEqual([]);
  });
});
