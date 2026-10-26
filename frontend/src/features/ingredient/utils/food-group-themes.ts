import { FoodGroup } from '@/common/enums';
import type { FoodGroupTheme, GroupedIngredients } from '../types/ingredient-group.model';
import type { Ingredient } from '../types/ingredient.model';

export const FOOD_GROUP_THEMES: Record<FoodGroup, FoodGroupTheme> = {
  [FoodGroup.VEGETABLES]: {
    group: FoodGroup.VEGETABLES,
    label: 'Rau củ',
    borderColor: 'border-emerald-500/40 dark:border-emerald-500/30',
    bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconTextColor: 'text-emerald-600 dark:text-emerald-400',
  },
  [FoodGroup.GRAINS]: {
    group: FoodGroup.GRAINS,
    label: 'Ngũ cốc',
    borderColor: 'border-amber-500/40 dark:border-amber-500/30',
    bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    textColor: 'text-amber-700 dark:text-amber-300',
    iconBgColor: 'bg-amber-100 dark:bg-amber-900/50',
    iconTextColor: 'text-amber-600 dark:text-amber-400',
  },
  [FoodGroup.LEGUMES]: {
    group: FoodGroup.LEGUMES,
    label: 'Các loại đậu',
    borderColor: 'border-orange-500/40 dark:border-orange-500/30',
    bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
    textColor: 'text-orange-700 dark:text-orange-300',
    iconBgColor: 'bg-orange-100 dark:bg-orange-900/50',
    iconTextColor: 'text-orange-600 dark:text-orange-400',
  },
  [FoodGroup.FRUITS]: {
    group: FoodGroup.FRUITS,
    label: 'Trái cây',
    borderColor: 'border-rose-500/40 dark:border-rose-500/30',
    bgColor: 'bg-rose-50/50 dark:bg-rose-950/20',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    textColor: 'text-rose-700 dark:text-rose-300',
    iconBgColor: 'bg-rose-100 dark:bg-rose-900/50',
    iconTextColor: 'text-rose-600 dark:text-rose-400',
  },
  [FoodGroup.MUSHROOMS]: {
    group: FoodGroup.MUSHROOMS,
    label: 'Nấm các loại',
    borderColor: 'border-stone-500/40 dark:border-stone-500/30',
    bgColor: 'bg-stone-50/50 dark:bg-stone-950/20',
    badgeColor: 'bg-stone-100 text-stone-800 dark:bg-stone-900/60 dark:text-stone-300',
    textColor: 'text-stone-700 dark:text-stone-300',
    iconBgColor: 'bg-stone-100 dark:bg-stone-900/50',
    iconTextColor: 'text-stone-600 dark:text-stone-400',
  },
  [FoodGroup.NUTS_SEEDS]: {
    group: FoodGroup.NUTS_SEEDS,
    label: 'Hạt & Quả hạch',
    borderColor: 'border-violet-500/40 dark:border-violet-500/30',
    bgColor: 'bg-violet-50/50 dark:bg-violet-950/20',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-300',
    textColor: 'text-violet-700 dark:text-violet-300',
    iconBgColor: 'bg-violet-100 dark:bg-violet-900/50',
    iconTextColor: 'text-violet-600 dark:text-violet-400',
  },
  [FoodGroup.HERBS_SPICES]: {
    group: FoodGroup.HERBS_SPICES,
    label: 'Thảo mộc & Gia vị',
    borderColor: 'border-teal-500/40 dark:border-teal-500/30',
    bgColor: 'bg-teal-50/50 dark:bg-teal-950/20',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300',
    textColor: 'text-teal-700 dark:text-teal-300',
    iconBgColor: 'bg-teal-100 dark:bg-teal-900/50',
    iconTextColor: 'text-teal-600 dark:text-teal-400',
  },
  [FoodGroup.DAIRY_EGGS]: {
    group: FoodGroup.DAIRY_EGGS,
    label: 'Trứng & Sữa',
    borderColor: 'border-yellow-500/40 dark:border-yellow-500/30',
    bgColor: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    iconTextColor: 'text-yellow-600 dark:text-yellow-400',
  },
  [FoodGroup.OTHER]: {
    group: FoodGroup.OTHER,
    label: 'Khác',
    borderColor: 'border-slate-500/40 dark:border-slate-500/30',
    bgColor: 'bg-slate-50/50 dark:bg-slate-950/20',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-300',
    textColor: 'text-slate-700 dark:text-slate-300',
    iconBgColor: 'bg-slate-100 dark:bg-slate-900/50',
    iconTextColor: 'text-slate-600 dark:text-slate-400',
  },
};

/**
 * Thứ tự hiển thị ưu tiên chuẩn cho các nhóm thực phẩm.
 */
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

/**
 * Lấy theme định dạng cho một nhóm thực phẩm, fallback về OTHER nếu không xác định.
 */
export function getFoodGroupTheme(group?: FoodGroup | null): FoodGroupTheme {
  if (!group || !(group in FOOD_GROUP_THEMES)) {
    return FOOD_GROUP_THEMES[FoodGroup.OTHER];
  }
  return FOOD_GROUP_THEMES[group];
}

/**
 * Gom nhóm danh sách nguyên liệu theo nhóm thực phẩm theo thứ tự hiển thị chuẩn.
 */
export function groupIngredientsByFoodGroup(
  items: readonly Ingredient[],
  options?: { omitEmpty?: boolean }
): GroupedIngredients[] {
  const omitEmpty = options?.omitEmpty ?? true;
  if (!items || items.length === 0) return [];

  // Tạo map chứa các items theo group
  const map = new Map<FoodGroup, Ingredient[]>();
  for (const group of FOOD_GROUP_ORDER) {
    map.set(group, []);
  }

  // Phân loại từng item vào đúng nhóm
  for (const item of items) {
    const group = item.foodGroup in FOOD_GROUP_THEMES ? item.foodGroup : FoodGroup.OTHER;
    const list = map.get(group);
    if (list) {
      list.push(item);
    } else {
      map.set(group, [item]);
    }
  }

  // Chuyển đổi sang danh sách kết quả theo đúng thứ tự ưu tiên
  const result: GroupedIngredients[] = [];
  for (const group of FOOD_GROUP_ORDER) {
    const groupItems = map.get(group) || [];
    if (omitEmpty && groupItems.length === 0) {
      continue;
    }
    result.push({
      group,
      theme: getFoodGroupTheme(group),
      items: groupItems,
    });
  }

  return result;
}
