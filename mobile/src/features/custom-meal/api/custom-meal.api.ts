import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import type { CustomMealListResponseDto, CustomMealResponseDto, CreateCustomMealRequestDto, UpdateCustomMealRequestDto } from '../types/custom-meal.dto';
import type { CustomMeal, CustomMealListResult } from '../types/custom-meal.model';
import { customMealMapper } from '../mappers/custom-meal.mapper';

export interface CustomMealQueryParams {
  page?: number;
  limit?: number;
  tag?: string;
}

export const customMealApi = {
  list: async (params?: CustomMealQueryParams): Promise<CustomMealListResult> => {
    const res = await api.get<CustomMealListResponseDto>(API_ENDPOINTS.CUSTOM_MEALS.LIST, {
      params,
      silent: true,
    });
    return customMealMapper.toListModel(res.data);
  },

  detail: async (id: string): Promise<CustomMeal> => {
    const res = await api.get<CustomMealResponseDto>(API_ENDPOINTS.CUSTOM_MEALS.DETAIL(id), { silent: true });
    return customMealMapper.toModel(res.data.data);
  },

  create: async (payload: CreateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.post<CustomMealResponseDto>(API_ENDPOINTS.CUSTOM_MEALS.LIST, payload);
    return customMealMapper.toModel(res.data.data);
  },

  update: async (id: string, payload: UpdateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.patch<CustomMealResponseDto>(API_ENDPOINTS.CUSTOM_MEALS.DETAIL(id), payload);
    return customMealMapper.toModel(res.data.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.CUSTOM_MEALS.DETAIL(id));
  },

  /** `POST /custom-meals/:id/photos` — gắn asset ảnh đã commit; `position` 0..9 (tối đa 10 ảnh/món). */
  attachPhoto: async (id: string, assetId: string, position: number): Promise<CustomMeal> => {
    const res = await api.post<CustomMealResponseDto>(API_ENDPOINTS.CUSTOM_MEALS.PHOTOS(id), { assetId, position });
    return customMealMapper.toModel(res.data.data);
  },

  /** `DELETE /custom-meals/:id/photos/:assetId` — chỉ gỡ khỏi món, asset vẫn nằm trong dung lượng tài khoản. */
  removePhoto: async (id: string, assetId: string): Promise<CustomMeal> => {
    const res = await api.delete<CustomMealResponseDto>(API_ENDPOINTS.CUSTOM_MEALS.PHOTO(id, assetId));
    return customMealMapper.toModel(res.data.data);
  },

  /** `PUT /custom-meals/:id/photos/order` — thứ tự mới của toàn bộ ảnh; ảnh đầu tiên là ảnh bìa. */
  reorderPhotos: async (id: string, orderedAssetIds: string[]): Promise<CustomMeal> => {
    const res = await api.put<CustomMealResponseDto>(API_ENDPOINTS.CUSTOM_MEALS.PHOTO_ORDER(id), { orderedAssetIds });
    return customMealMapper.toModel(res.data.data);
  },
};

