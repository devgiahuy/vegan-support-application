import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { APIResponse } from '@/types/api';
import type { ShoppingPreviewDto } from '../types/shopping.dto';
import type { SelectedShoppingMeal } from '../types/shopping.model';
import { shoppingMapper } from '../mappers/shopping.mapper';
export const shoppingApi = {
  async preview(meals: SelectedShoppingMeal[]) {
    const res = await api.post<APIResponse<ShoppingPreviewDto>>(
      API_ENDPOINTS.SHOPPING.PREVIEW,
      shoppingMapper.toRequest(meals)
    );
    return shoppingMapper.toModel(res.data.data);
  },
};
