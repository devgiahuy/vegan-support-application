import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  AdminCategoryListResponseDto,
  CatalogArchiveResponseDto,
  CategoryResponseDto,
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from '../types/admin-catalog.dto';
import type { Category } from '@/features/category/types/category.model';
import { categoryMapper } from '@/features/category/mappers/category.mapper';

export interface AdminCategoryListParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export const adminCategoryApi = {
  listCategories: async (params?: AdminCategoryListParams): Promise<PaginationResult<Category>> => {
    const res = await api.get<AdminCategoryListResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.CATEGORIES.LIST,
      { params, silent: true }
    );
    return categoryMapper.toAdminPaginationModel(res.data);
  },

  createCategory: async (payload: CreateCategoryRequestDto): Promise<Category> => {
    const res = await api.post<CategoryResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.CATEGORIES.CREATE,
      payload,
      { showErrorToast: true }
    );
    return categoryMapper.toSingleModel(res.data);
  },

  updateCategory: async (id: string, payload: UpdateCategoryRequestDto): Promise<Category> => {
    const res = await api.patch<CategoryResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.CATEGORIES.UPDATE(id),
      payload,
      { showErrorToast: true }
    );
    return categoryMapper.toSingleModel(res.data);
  },

  archiveCategory: async (
    id: string,
    replacementId?: string
  ): Promise<{ id: string; status: string }> => {
    const res = await api.delete<CatalogArchiveResponseDto>(
      API_ENDPOINTS.ADMIN_CATALOG.CATEGORIES.ARCHIVE(id),
      { params: replacementId ? { replacementId } : {}, showErrorToast: true }
    );
    return categoryMapper.toArchiveModel(res.data);
  },
};
