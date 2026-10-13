import {
  Apple,
  Carrot,
  CircleDot,
  Egg,
  Leaf,
  Nut,
  Sprout,
  Utensils,
  Wheat,
  type LucideIcon,
} from 'lucide-react-native';

import { FoodGroup } from '@/common/enums';
import type { Ingredient } from '../types/ingredient.model';

export interface FoodGroupTheme {
  group: FoodGroup;
  label: string;
  icon: LucideIcon;
  /** Màu chủ đạo (hex) cho chế độ sáng / tối; nền và viền suy ra từ màu này bằng độ trong suốt hex. */
  light: string;
  dark: string;
}

/** Màu từng nhóm thực phẩm, đồng bộ `food-group-themes.ts` của web (emerald, amber, orange, rose, stone, violet, teal, yellow, slate). */
export const FOOD_GROUP_THEMES: Record<FoodGroup, FoodGroupTheme> = {
  [FoodGroup.VEGETABLES]: { group: FoodGroup.VEGETABLES, label: 'Rau củ', icon: Carrot, light: '#059669', dark: '#34d399' },
  [FoodGroup.GRAINS]: { group: FoodGroup.GRAINS, label: 'Ngũ cốc', icon: Wheat, light: '#d97706', dark: '#fbbf24' },
  [FoodGroup.LEGUMES]: { group: FoodGroup.LEGUMES, label: 'Các loại đậu', icon: CircleDot, light: '#ea580c', dark: '#fb923c' },
  [FoodGroup.FRUITS]: { group: FoodGroup.FRUITS, label: 'Trái cây', icon: Apple, light: '#e11d48', dark: '#fb7185' },
  [FoodGroup.MUSHROOMS]: { group: FoodGroup.MUSHROOMS, label: 'Nấm các loại', icon: Sprout, light: '#78716c', dark: '#a8a29e' },
  [FoodGroup.NUTS_SEEDS]: { group: FoodGroup.NUTS_SEEDS, label: 'Hạt & Quả hạch', icon: Nut, light: '#7c3aed', dark: '#a78bfa' },
  [FoodGroup.HERBS_SPICES]: { group: FoodGroup.HERBS_SPICES, label: 'Thảo mộc & Gia vị', icon: Leaf, light: '#0d9488', dark: '#2dd4bf' },
  [FoodGroup.DAIRY_EGGS]: { group: FoodGroup.DAIRY_EGGS, label: 'Trứng & Sữa', icon: Egg, light: '#ca8a04', dark: '#facc15' },
  [FoodGroup.OTHER]: { group: FoodGroup.OTHER, label: 'Khác', icon: Utensils, light: '#64748b', dark: '#94a3b8' },
};

/** Thứ tự hiển thị các nhóm. */
export const FOOD_GROUP_ORDER: readonly FoodGroup[] = [
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

export function getFoodGroupTheme(group?: FoodGroup | null): FoodGroupTheme {
  return group && group in FOOD_GROUP_THEMES ? FOOD_GROUP_THEMES[group] : FOOD_GROUP_THEMES[FoodGroup.OTHER];
}

/** Các màu dẫn xuất (hex 8 ký tự) cho một nhóm ở chế độ sáng hoặc tối. */
export function foodGroupPalette(theme: FoodGroupTheme, isDark: boolean) {
  const fg = isDark ? theme.dark : theme.light;
  return { fg, soft: `${fg}26`, border: `${fg}66` };
}

export interface GroupedIngredients {
  theme: FoodGroupTheme;
  items: Ingredient[];
}

/** Gom nguyên liệu theo nhóm thực phẩm, theo thứ tự chuẩn và bỏ nhóm rỗng. */
export function groupIngredientsByFoodGroup(items: readonly Ingredient[]): GroupedIngredients[] {
  const buckets = new Map<FoodGroup, Ingredient[]>();
  for (const item of items) {
    const group = item.foodGroup in FOOD_GROUP_THEMES ? item.foodGroup : FoodGroup.OTHER;
    buckets.set(group, [...(buckets.get(group) ?? []), item]);
  }
  return FOOD_GROUP_ORDER.filter((group) => (buckets.get(group)?.length ?? 0) > 0).map((group) => ({
    theme: FOOD_GROUP_THEMES[group],
    items: buckets.get(group) ?? [],
  }));
}
