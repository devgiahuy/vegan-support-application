import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type { IngredientListResponseDto, ResolveResponseDto } from '../types/ingredient.dto';
import type { Ingredient, IngredientResolution } from '../types/ingredient.model';
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
      params,
      silent: true,
    });
    return ingredientMapper.toListModel(res.data);
  },

  /** Chú ý: tên query param là `query`, không phải `q`. */
  resolveIngredient: async (query: string): Promise<IngredientResolution> => {
    const res = await api.get<ResolveResponseDto>(API_ENDPOINTS.INGREDIENTS.RESOLVE, {
      params: { query },
      silent: true,
    });
    return ingredientMapper.toResolutionModel(res.data);
  },
};
