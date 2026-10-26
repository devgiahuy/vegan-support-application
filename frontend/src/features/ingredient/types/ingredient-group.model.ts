import { FoodGroup } from '@/common/enums';
import type { Ingredient } from './ingredient.model';

export interface FoodGroupTheme {
  group: FoodGroup;
  label: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
  textColor: string;
  iconBgColor: string;
  iconTextColor: string;
}

export interface GroupedIngredients {
  group: FoodGroup;
  theme: FoodGroupTheme;
  items: Ingredient[];
}
