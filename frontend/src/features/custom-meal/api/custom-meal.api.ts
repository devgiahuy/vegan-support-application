import api from '@/lib/axios';
import { CUSTOM_MEALS_ENDPOINTS } from '@/features/custom-meal/constants/custom-meals.endpoints';
import { uploadWithReservation } from '@/features/storage/api/storage-upload';
import type {
  CreateCustomMealRequestDto,
  CustomMealListResponseDto,
  CustomMealEnvelopeDto,
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

function unwrapCustomMealResponse<T>(body: CustomMealEnvelopeDto<T> | null | undefined): T {
  if (body?.success !== true || body.data == null) {
    throw new Error('Phản hồi món ăn cá nhân không đúng định dạng.');
  }
  return body.data;
}

export const customMealApi = {
  /**
   * Lấy danh sách món ăn cá nhân (Owner-scoped)
   */
  getCustomMeals: async (params?: CustomMealQueryParams): Promise<CustomMealListResult> => {
    const res = await api.get<CustomMealEnvelopeDto<CustomMealListResponseDto>>(
      CUSTOM_MEALS_ENDPOINTS.LIST,
      { params }
    );
    const data = unwrapCustomMealResponse(res.data);
    if (!data.pagination || !Array.isArray(data.records)) {
      throw new Error('Phản hồi danh sách món ăn cá nhân không đúng định dạng.');
    }
    return CustomMealMapper.toListResultModel(data);
  },

  /**
   * Lấy chi tiết món ăn cá nhân
   */
  getCustomMealDetail: async (id: string): Promise<CustomMeal> => {
    const res = await api.get<CustomMealEnvelopeDto<CustomMealResponseDto>>(
      CUSTOM_MEALS_ENDPOINTS.DETAIL(id)
    );
    return CustomMealMapper.toCustomMealModel(unwrapCustomMealResponse(res.data));
  },

  /**
   * Tạo mới món ăn cá nhân
   */
  createCustomMeal: async (data: CreateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.post<CustomMealEnvelopeDto<CustomMealResponseDto>>(
      CUSTOM_MEALS_ENDPOINTS.CREATE,
      data,
      { timeout: 45_000 }
    );
    return CustomMealMapper.toCustomMealModel(unwrapCustomMealResponse(res.data));
  },

  /**
   * Cập nhật món ăn cá nhân
   */
  updateCustomMeal: async (id: string, data: UpdateCustomMealRequestDto): Promise<CustomMeal> => {
    const res = await api.patch<CustomMealEnvelopeDto<CustomMealResponseDto>>(
      CUSTOM_MEALS_ENDPOINTS.UPDATE(id),
      data,
      { timeout: 45_000 }
    );
    return CustomMealMapper.toCustomMealModel(unwrapCustomMealResponse(res.data));
  },

  /**
   * Xóa món ăn cá nhân
   */
  deleteCustomMeal: async (id: string): Promise<void> => {
    await api.delete(CUSTOM_MEALS_ENDPOINTS.DELETE(id));
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
    const res = await api.post<CustomMealEnvelopeDto<CustomMealResponseDto>>(
      CUSTOM_MEALS_ENDPOINTS.ATTACH_PHOTO(id),
      {
        assetId: asset.id,
        position,
      }
    );
    const updatedMeal = CustomMealMapper.toCustomMealModel(unwrapCustomMealResponse(res.data));
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
    await api.delete(CUSTOM_MEALS_ENDPOINTS.REMOVE_PHOTO(id, assetId));
  },

  /**
   * Sắp xếp lại thứ tự ảnh
   */
  reorderCustomMealPhotos: async (id: string, orderedAssetIds: string[]): Promise<CustomMeal> => {
    const res = await api.put<CustomMealEnvelopeDto<CustomMealResponseDto>>(
      CUSTOM_MEALS_ENDPOINTS.REORDER_PHOTOS(id),
      { orderedAssetIds }
    );
    return CustomMealMapper.toCustomMealModel(unwrapCustomMealResponse(res.data));
  },
};
