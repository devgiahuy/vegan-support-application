import api from '@/lib/axios';
import { INGREDIENTS_ENDPOINTS } from '@/features/ingredient/constants/ingredients.endpoints';
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
    const res = await api.get<IngredientListResponseDto>(INGREDIENTS_ENDPOINTS.LIST, {
      params,
      silent: true,
    });
    return ingredientMapper.toListModel(res.data?.data, res.data?.meta);
  },

  /** Chú ý: tên query param là `query`, không phải `q`. */
  resolveIngredient: async (query: string): Promise<IngredientResolution> => {
    const res = await api.get<ResolveResponseDto>(INGREDIENTS_ENDPOINTS.RESOLVE, {
      params: { query },
      silent: true,
    });
    return ingredientMapper.toResolutionModel(res.data?.data);
  },
};
