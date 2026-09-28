import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { CategoryTreeResponseDto } from '../types/category.dto';
import type { Category } from '../types/category.model';
import type { CategoryType } from '@/common/enums';
import { categoryMapper } from '../mappers/category.mapper';

export const categoryApi = {
  getTree: async (type?: CategoryType): Promise<Category[]> => {
    const res = await api.get<CategoryTreeResponseDto>(API_ENDPOINTS.CATEGORIES.TREE, {
      params: type ? { type } : {},
      silent: true,
    });
    return categoryMapper.toTreeModel(res.data);
  },
};
