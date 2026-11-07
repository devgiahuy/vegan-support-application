import api from '@/lib/axios';
import { ADMIN_CATALOG_ENDPOINTS } from '@/features/admin-catalog/constants/admin-catalog.endpoints';
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
      ADMIN_CATALOG_ENDPOINTS.CATEGORIES.LIST,
      { params, silent: true }
    );
    return categoryMapper.toAdminPaginationModel(res.data?.data, res.data?.meta);
  },

  createCategory: async (payload: CreateCategoryRequestDto): Promise<Category> => {
    const res = await api.post<CategoryResponseDto>(
      ADMIN_CATALOG_ENDPOINTS.CATEGORIES.CREATE,
      payload,
      { showErrorToast: true }
    );
    return categoryMapper.toModel(res.data?.data);
  },

  updateCategory: async (id: string, payload: UpdateCategoryRequestDto): Promise<Category> => {
    const res = await api.patch<CategoryResponseDto>(
      ADMIN_CATALOG_ENDPOINTS.CATEGORIES.UPDATE(id),
      payload,
      { showErrorToast: true }
    );
    return categoryMapper.toModel(res.data?.data);
  },

  archiveCategory: async (
    id: string,
    replacementId?: string
  ): Promise<{ id: string; status: string }> => {
    const res = await api.delete<CatalogArchiveResponseDto>(
      ADMIN_CATALOG_ENDPOINTS.CATEGORIES.ARCHIVE(id),
      { params: replacementId ? { replacementId } : {}, showErrorToast: true }
    );
    return categoryMapper.toArchiveModel(res.data?.data);
  },
};
