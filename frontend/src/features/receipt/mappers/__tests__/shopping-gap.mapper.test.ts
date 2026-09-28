import { describe, it, expect } from 'vitest';
import { ShoppingGapMapper } from '../shopping-gap.mapper';
import type { ShoppingGapResponseDto } from '../../types/shopping-gap.dto';

describe('ShoppingGapMapper', () => {
  const mapper = new ShoppingGapMapper();

  it('xử lý an toàn khi DTO null hoặc undefined', () => {
    const model = mapper.toModel(null);
    expect(model.items).toEqual([]);
    expect(model.readyItems).toEqual([]);
    expect(model.missingItems).toEqual([]);
    expect(model.unresolvedItems).toEqual([]);
    expect(model.summary.selectedMealCount).toBe(0);
    expect(model.formattedPantryAsOf).toBe('Thời điểm hiện tại');
  });

  it('phân nhóm chính xác nguyên liệu đã sẵn sàng và còn thiếu', () => {
    const dto: ShoppingGapResponseDto = {
      items: [
        {
          ingredient: { id: 'ing-1', name: 'Đậu phụ' },
          required: { value: 300, unit: 'g' },
          available: { value: 500, unit: 'g' },
          missing: { value: 0, unit: 'g' },
          surplus: { value: 200, unit: 'g' },
          confidence: 0.95,
          conversionAssumptions: ['1 bìa đậu phụ = 250 g'],
          sourceMeals: [
            {
              sourceType: 'RECIPE',
              id: 'rec-1',
              name: 'Đậu sốt cà chua',
              servings: 2,
            },
          ],
        },
        {
          ingredient: { id: 'ing-2', name: 'Nấm hương' },
          required: { value: 100, unit: 'g' },
          available: { value: 0, unit: 'g' },
          missing: { value: 100, unit: 'g' },
          surplus: { value: 0, unit: 'g' },
          confidence: 1,
          conversionAssumptions: [],
          sourceMeals: [
            {
              sourceType: 'CUSTOM_MEAL',
              id: 'custom-1',
              name: 'Canh nấm chay',
              servings: 1,
            },
          ],
        },
        {
          ingredient: { id: 'ing-3', name: 'Hành boaro' },
          required: { value: 50, unit: 'g' },
          available: { value: 20, unit: 'g' },
          missing: { value: 30, unit: 'g' },
          surplus: { value: 0, unit: 'g' },
          confidence: 0.85,
          conversionAssumptions: [],
          sourceMeals: [
            {
              sourceType: 'RECIPE',
              id: 'rec-1',
              name: 'Đậu sốt cà chua',
              servings: 2,
            },
          ],
        },
      ],
      unresolvedItems: [],
      summary: {
        selectedMealCount: 2,
        readyItemCount: 1,
        missingItemCount: 2,
        unresolvedItemCount: 0,
      },
      pantryAsOf: '2026-09-24T12:00:00.000Z',
    };

    const model = mapper.toModel(dto);

    expect(model.items.length).toBe(3);
    expect(model.readyItems.length).toBe(1);
    expect(model.missingItems.length).toBe(2);

    const dauPhu = model.readyItems[0];
    expect(dauPhu.ingredientName).toBe('Đậu phụ');
    expect(dauPhu.isFullyAvailable).toBe(true);
    expect(dauPhu.isPartiallyMissing).toBe(false);
    expect(dauPhu.isCompletelyMissing).toBe(false);
    expect(dauPhu.required.formatted).toBe('300 g');
    expect(dauPhu.available.formatted).toBe('500 g');
    expect(dauPhu.surplus.formatted).toBe('200 g');
    expect(dauPhu.conversionAssumptions).toEqual(['1 bìa đậu phụ = 250 g']);

    const namHuong = model.missingItems[0];
    expect(namHuong.isCompletelyMissing).toBe(true);
    expect(namHuong.sourceMeals[0].typeLabel).toBe('Món ăn tùy chỉnh');

    const boaro = model.missingItems[1];
    expect(boaro.isPartiallyMissing).toBe(true);
    expect(boaro.missing.formatted).toBe('30 g');
  });

  it('chuyển đổi danh sách nguyên liệu chưa giải quyết (unresolvedItems)', () => {
    const dto: ShoppingGapResponseDto = {
      items: [],
      unresolvedItems: [
        {
          name: 'Nước cốt dừa lon',
          required: { value: 1, unit: 'lon' },
          reasonCode: 'REVIEWED_CONVERSION_UNAVAILABLE',
          explanation: 'Không thể quy đổi từ lon sang ml hoặc g',
          sourceMeals: [
            {
              sourceType: 'RECIPE',
              id: 'rec-curry',
              name: 'Cà ri chay',
              servings: 4,
            },
          ],
        },
        {
          name: 'Gia vị thảo mộc bí truyền',
          required: { value: 1, unit: 'gói' },
          reasonCode: 'INGREDIENT_UNRESOLVED',
          explanation: 'Chưa có trong danh mục nguyên liệu chuẩn',
          sourceMeals: [],
        },
      ],
      summary: {
        selectedMealCount: 1,
        readyItemCount: 0,
        missingItemCount: 0,
        unresolvedItemCount: 2,
      },
      pantryAsOf: '2026-09-24T12:00:00.000Z',
    };

    const model = mapper.toModel(dto);

    expect(model.unresolvedItems.length).toBe(2);

    const item1 = model.unresolvedItems[0];
    expect(item1.name).toBe('Nước cốt dừa lon');
    expect(item1.reasonCode).toBe('REVIEWED_CONVERSION_UNAVAILABLE');
    expect(item1.reasonLabel).toBe('Chưa hỗ trợ quy đổi đơn vị');
    expect(item1.explanation).toBe('Không thể quy đổi từ lon sang ml hoặc g');
    expect(item1.sourceMeals[0].name).toBe('Cà ri chay');

    const item2 = model.unresolvedItems[1];
    expect(item2.reasonCode).toBe('INGREDIENT_UNRESOLVED');
    expect(item2.reasonLabel).toBe('Chưa khớp nguyên liệu chuẩn');
  });

  it('chuyển đổi payload request previewShoppingGaps', () => {
    const reqDto = mapper.toPreviewRequestDto([
      {
        sourceType: 'RECIPE',
        recipeId: 'rec-1',
        servings: 2,
      },
      {
        sourceType: 'CUSTOM_MEAL',
        customMealId: 'custom-meal-2',
        servings: 1,
      },
    ]);

    expect(reqDto.meals).toEqual([
      {
        sourceType: 'RECIPE',
        recipeId: 'rec-1',
        servings: 2,
      },
      {
        sourceType: 'CUSTOM_MEAL',
        customMealId: 'custom-meal-2',
        servings: 1,
      },
    ]);
  });
});
