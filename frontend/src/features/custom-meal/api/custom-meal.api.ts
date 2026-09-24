import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  CreateCustomMealRequestDto,
  CustomMealListResponseDto,
  CustomMealPhotoDto,
  CustomMealResponseDto,
  UpdateCustomMealRequestDto,
} from '../types/custom-meal.dto';
import type { CustomMeal, CustomMealListResult, CustomMealPhoto } from '../types/custom-meal.model';
import { CustomMealMapper } from '../mappers/custom-meal.mapper';

export interface CustomMealQueryParams {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
}

export const customMealApi = {
  /**
   * Lấy danh sách món ăn cá nhân (Owner-scoped)
   */
  getCustomMeals: async (params?: CustomMealQueryParams): Promise<CustomMealListResult> => {
    const res = await api.get<{ data: CustomMealListResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.LIST,
      { params }
    );
    return CustomMealMapper.toListResultModel(res.data.data);
  },

  /**
   * Lấy chi tiết món ăn cá nhân
   */
  getCustomMealDetail: async (id: string): Promise<CustomMeal> => {
    const res = await api.get<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.DETAIL(id)
    );
    return CustomMealMapper.toCustomMealModel(res.data.data);
  },

  /**
   * Tạo mới món ăn cá nhân
   */
  createCustomMeal: async (data: CreateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.post<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.CREATE,
      data
    );
    return CustomMealMapper.toCustomMealModel(res.data.data);
  },

  /**
   * Cập nhật món ăn cá nhân
   */
  updateCustomMeal: async (id: string, data: UpdateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.patch<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.UPDATE(id),
      data
    );
    return CustomMealMapper.toCustomMealModel(res.data.data);
  },

  /**
   * Xóa món ăn cá nhân
   */
  deleteCustomMeal: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.CUSTOM_MEALS.DELETE(id));
  },

  /**
   * Đính kèm hình ảnh cho món ăn cá nhân (tuân thủ hạn ngạch Phase 15 Storage)
   */
  attachCustomMealMedia: async (
    id: string,
    file: File,
    isCover: boolean = false
  ): Promise<CustomMealPhoto> => {
    const formData = new FormData();
    formData.append('file', file);
    if (isCover) {
      formData.append('isCover', 'true');
    }

    const res = await api.post<{ data: CustomMealPhotoDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.ATTACH_MEDIA(id),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return CustomMealMapper.toPhotoModel(res.data.data);
  },

  /**
   * Xóa ảnh khỏi món ăn cá nhân và hoàn trả dung lượng lưu trữ
   */
  deleteCustomMealMedia: async (id: string, photoId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.CUSTOM_MEALS.DELETE_MEDIA(id, photoId));
  },
};
