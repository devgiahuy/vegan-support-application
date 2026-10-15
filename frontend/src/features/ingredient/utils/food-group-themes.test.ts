import { describe, it, expect } from 'vitest';
import { FoodGroup, CatalogStatus } from '@/common/enums';
import {
  FOOD_GROUP_THEMES,
  getFoodGroupTheme,
  groupIngredientsByFoodGroup,
} from './food-group-themes';
import type { Ingredient } from '../types/ingredient.model';

function createMockIngredient(id: string, canonicalName: string, foodGroup: FoodGroup): Ingredient {
  return {
    id,
    canonicalName,
    normalizedName: canonicalName.toLowerCase(),
    foodGroup,
    foodGroupLabel: FOOD_GROUP_THEMES[foodGroup]?.label ?? 'Khác',
    status: CatalogStatus.ACTIVE,
    aliases: [],
    allergenCodes: [],
    dietCompatibilities: [],
    traditionWarnings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('food-group-themes', () => {
  it('provides complete theme definition for all core food groups', () => {
    const expectedGroups = [
      FoodGroup.VEGETABLES,
      FoodGroup.GRAINS,
      FoodGroup.LEGUMES,
      FoodGroup.FRUITS,
      FoodGroup.MUSHROOMS,
      FoodGroup.NUTS_SEEDS,
      FoodGroup.HERBS_SPICES,
      FoodGroup.DAIRY_EGGS,
      FoodGroup.OTHER,
    ];

    for (const group of expectedGroups) {
      const theme = getFoodGroupTheme(group);
      expect(theme).toBeDefined();
      expect(theme.group).toBe(group);
      expect(typeof theme.label).toBe('string');
      expect(theme.label.length).toBeGreaterThan(0);
      expect(theme.borderColor).toBeDefined();
      expect(theme.bgColor).toBeDefined();
      expect(theme.badgeColor).toBeDefined();
      expect(theme.iconBgColor).toBeDefined();
      expect(theme.iconTextColor).toBeDefined();
    }
  });

  it('falls back to OTHER theme when given an unknown or undefined food group', () => {
    const fallbackTheme = getFoodGroupTheme(undefined as any);
    expect(fallbackTheme.group).toBe(FoodGroup.OTHER);
    expect(fallbackTheme.label).toBe('Khác');
  });

  it('groups ingredients into correct groups and preserves priority order', () => {
    const mockItems: Ingredient[] = [
      createMockIngredient('ing-3', 'Đậu nành', FoodGroup.LEGUMES),
      createMockIngredient('ing-1', 'Cà rốt hữu cơ', FoodGroup.VEGETABLES),
      createMockIngredient('ing-4', 'Táo đỏ', FoodGroup.FRUITS),
      createMockIngredient('ing-2', 'Gạo lứt đỏ', FoodGroup.GRAINS),
      createMockIngredient('ing-5', 'Nấm đông cô', FoodGroup.MUSHROOMS),
    ];

    const grouped = groupIngredientsByFoodGroup(mockItems);

    // Thứ tự ưu tiên: Rau củ -> Ngũ cốc -> Đậu -> Trái cây -> Nấm
    expect(grouped).toHaveLength(5);
    expect(grouped[0].group).toBe(FoodGroup.VEGETABLES);
    expect(grouped[0].items[0].canonicalName).toBe('Cà rốt hữu cơ');

    expect(grouped[1].group).toBe(FoodGroup.GRAINS);
    expect(grouped[1].items[0].canonicalName).toBe('Gạo lứt đỏ');

    expect(grouped[2].group).toBe(FoodGroup.LEGUMES);
    expect(grouped[2].items[0].canonicalName).toBe('Đậu nành');

    expect(grouped[3].group).toBe(FoodGroup.FRUITS);
    expect(grouped[3].items[0].canonicalName).toBe('Táo đỏ');

    expect(grouped[4].group).toBe(FoodGroup.MUSHROOMS);
    expect(grouped[4].items[0].canonicalName).toBe('Nấm đông cô');
  });

  it('omits empty groups by default', () => {
    const mockItems: Ingredient[] = [
      createMockIngredient('ing-1', 'Bông cải xanh', FoodGroup.VEGETABLES),
    ];

    const grouped = groupIngredientsByFoodGroup(mockItems);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].group).toBe(FoodGroup.VEGETABLES);
  });

  it('handles empty input gracefully', () => {
    const grouped = groupIngredientsByFoodGroup([]);
    expect(grouped).toEqual([]);
  });
});
