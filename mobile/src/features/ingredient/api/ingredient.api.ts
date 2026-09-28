import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type { IngredientListResponseDto } from '../types/ingredient.dto';
import type { Ingredient } from '../types/ingredient.model';
import type { FoodGroup } from '@/common/enums';
import { ingredientMapper } from '../mappers/ingredient.mapper';

export interface IngredientSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  foodGroup?: FoodGroup;
}

export const ingredientApi = {
  searchIngredients: async (
    params?: IngredientSearchParams
  ): Promise<PaginationResult<Ingredient>> => {
    const res = await api.get<IngredientListResponseDto>(API_ENDPOINTS.INGREDIENTS.LIST, {
      params: params || {},
      silent: true,
    });
    return ingredientMapper.toListModel(res.data);
  },
};
