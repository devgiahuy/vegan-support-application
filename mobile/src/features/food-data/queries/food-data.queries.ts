import { useQuery } from '@tanstack/react-query';
import { foodDataApi, type FoodDataQueryParams } from '../api/food-data.api';

export const FOOD_DATA_KEYS = {
  all: ['food-data'] as const,
  nutrients: (ingredientId: string, params?: { preparation?: string }) =>
    [...FOOD_DATA_KEYS.all, 'nutrients', ingredientId, params] as const,
  referenceIntakes: (params?: FoodDataQueryParams) =>
    [...FOOD_DATA_KEYS.all, 'reference-intakes', params] as const,
  cookingMethods: (params?: { page?: number; limit?: number }) =>
    [...FOOD_DATA_KEYS.all, 'cooking-methods', params] as const,
  interactions: (params?: FoodDataQueryParams) => [...FOOD_DATA_KEYS.all, 'interactions', params] as const,
};

/** Giá trị dinh dưỡng chuẩn trên 100g của nguyên liệu — cache 5 phút vì ít biến động. */
export const useIngredientNutrientsQuery = (
  ingredientId: string,
  params?: { preparation?: string },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.nutrients(ingredientId, params),
    queryFn: () => foodDataApi.getIngredientNutrients(ingredientId, params),
    enabled: Boolean(ingredientId) && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
};

/** Nhu cầu khuyến nghị (RDA/AI) và ngưỡng an toàn (UL). */
export const useReferenceIntakesQuery = (params?: FoodDataQueryParams) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.referenceIntakes(params),
    queryFn: () => foodDataApi.listReferenceIntakes(params),
    staleTime: 5 * 60 * 1000,
  });
};

/** Phương pháp nấu nướng và hệ số bảo tồn / hao hụt. */
export const useCookingMethodsQuery = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.cookingMethods(params),
    queryFn: () => foodDataApi.listCookingMethods(params),
    staleTime: 5 * 60 * 1000,
  });
};

/** Quy tắc tương tác / kiêng kỵ giữa các nguyên liệu. */
export const useInteractionRulesQuery = (params?: FoodDataQueryParams) => {
  return useQuery({
    queryKey: FOOD_DATA_KEYS.interactions(params),
    queryFn: () => foodDataApi.listInteractionRules(params),
    staleTime: 5 * 60 * 1000,
  });
};
