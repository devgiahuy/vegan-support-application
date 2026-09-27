import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { uploadWithReservation } from '@/features/storage/api/storage-upload';
import type {
  CreateCustomMealRequestDto,
  CustomMealListResponseDto,
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
    const data = res.data?.data ?? res.data;
    return CustomMealMapper.toListResultModel(data as CustomMealListResponseDto);
  },

  /**
   * Lấy chi tiết món ăn cá nhân
   */
  getCustomMealDetail: async (id: string): Promise<CustomMeal> => {
    const res = await api.get<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.DETAIL(id)
    );
    const data = res.data?.data ?? res.data;
    return CustomMealMapper.toCustomMealModel(data as CustomMealResponseDto);
  },

  /**
   * Tạo mới món ăn cá nhân
   */
  createCustomMeal: async (data: CreateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.post<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.CREATE,
      data
    );
    const dataObj = res.data?.data ?? res.data;
    return CustomMealMapper.toCustomMealModel(dataObj as CustomMealResponseDto);
  },

  /**
   * Cập nhật món ăn cá nhân
   */
  updateCustomMeal: async (id: string, data: UpdateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.patch<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.UPDATE(id),
      data
    );
    const dataObj = res.data?.data ?? res.data;
    return CustomMealMapper.toCustomMealModel(dataObj as CustomMealResponseDto);
  },

  /**
   * Xóa món ăn cá nhân
   */
  deleteCustomMeal: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.CUSTOM_MEALS.DELETE(id));
  },

  /**
   * Đính kèm hình ảnh cho món ăn cá nhân (tuân thủ hạn ngạch Phase 15 Storage Reservation)
   */
  attachCustomMealMedia: async (
    id: string,
    file: File,
    positionOrOptions?: number | { position?: number; isCover?: boolean }
  ): Promise<CustomMealPhoto> => {
    const position =
      typeof positionOrOptions === 'number'
        ? positionOrOptions
        : (positionOrOptions?.position ?? 0);
    // 1. Tải lên Cloudinary thông qua hạn ngạch lưu trữ Phase 15
    const asset = await uploadWithReservation(file, {
      kind: 'COVER_IMAGE',
    });

    // 2. Gắn assetId vào món ăn cá nhân
    const res = await api.post<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.ATTACH_PHOTO(id),
      {
        assetId: asset.id,
        position,
      }
    );
    const updatedMeal = CustomMealMapper.toCustomMealModel(res.data.data);
    const attachedPhoto = updatedMeal.photos.find((p) => p.id === asset.id) ||
      updatedMeal.photos[updatedMeal.photos.length - 1] || {
        id: asset.id,
        url: asset.secureUrl,
        sortOrder: position,
        isCover: position === 0,
        fileSizeBytes: asset.bytes,
        mimeType: asset.mimeType,
        createdAt: new Date().toISOString(),
      };
    return attachedPhoto;
  },

  /**
   * Xóa ảnh khỏi món ăn cá nhân
   */
  deleteCustomMealMedia: async (id: string, assetId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.CUSTOM_MEALS.REMOVE_PHOTO(id, assetId));
  },

  /**
   * Sắp xếp lại thứ tự ảnh
   */
  reorderCustomMealPhotos: async (id: string, orderedAssetIds: string[]): Promise<CustomMeal> => {
    const res = await api.put<{ data: CustomMealResponseDto }>(
      API_ENDPOINTS.CUSTOM_MEALS.REORDER_PHOTOS(id),
      { orderedAssetIds }
    );
    return CustomMealMapper.toCustomMealModel(res.data.data);
  },
};
