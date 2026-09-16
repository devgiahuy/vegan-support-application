import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  AddAliasRequestDto,
  CreateIngredientRequestDto,
  IngredientListResponseDto,
  IngredientResponseDto,
  UpdateIngredientRequestDto,
} from '../types/admin-catalog.dto';
import type { Ingredient } from '@/features/ingredient/types/ingredient.model';
import { ingredientMapper } from '@/features/ingredient/mappers/ingredient.mapper';

export interface AdminIngredientListParams {
  page?: number;
  limit?: number;
  q?: string;
  foodGroup?: string;
  status?: string;
}

export const adminIngredientApi = {
  listIngredients: async (
    params?: AdminIngredientListParams
  ): Promise<PaginationResult<Ingredient>> => {
    const res = await api.get<IngredientListResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.INGREDIENTS.LIST,
      { params, silent: true }
    );
    return ingredientMapper.toListModel(res.data);
  },

  createIngredient: async (payload: CreateIngredientRequestDto): Promise<Ingredient> => {
    const res = await api.post<IngredientResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.INGREDIENTS.CREATE,
      payload,
      { showErrorToast: true }
    );
    return ingredientMapper.toSingleModel(res.data);
  },

  updateIngredient: async (
    id: string,
    payload: UpdateIngredientRequestDto
  ): Promise<Ingredient> => {
    const res = await api.patch<IngredientResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.INGREDIENTS.UPDATE(id),
      payload,
      { showErrorToast: true }
    );
    return ingredientMapper.toSingleModel(res.data);
  },

  archiveIngredient: async (id: string): Promise<{ id: string; status: string }> => {
    const res = await api.delete<{
      success?: boolean;
      data?: { id?: string; status?: string } | null;
    }>(API_ENDPOINTS.ADMIN_CATALOG.INGREDIENTS.ARCHIVE(id), { showErrorToast: true });
    const data = res.data?.data ?? null;
    return {
      id: typeof data?.id === 'string' ? data.id : '',
      status: typeof data?.status === 'string' ? data.status : 'ARCHIVED',
    };
  },

  addAlias: async (id: string, alias: string): Promise<Ingredient> => {
    const body: AddAliasRequestDto = { alias };
    const res = await api.post<IngredientResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.INGREDIENTS.ALIASES(id),
      body,
      { showErrorToast: true }
    );
    return ingredientMapper.toSingleModel(res.data);
  },

  /** DELETE 204 không body — không parse, chỉ xác nhận thành công. */
  deleteAlias: async (id: string, aliasId: string): Promise<void> => {
    await api.delete<void>(API_ENDPOINTS.ADMIN_CATALOG.INGREDIENTS.ALIAS(id, aliasId), {
      showErrorToast: true,
    });
  },
};
