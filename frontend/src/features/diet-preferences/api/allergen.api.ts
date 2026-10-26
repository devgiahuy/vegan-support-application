import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { allergenMapper } from '../mappers/allergen.mapper';
import type { AllergenCatalogResponseDto } from '../types/allergen.dto';

export const allergenApi = {
  async list() {
    const response = await api.get<AllergenCatalogResponseDto>(API_ENDPOINTS.ALLERGENS.LIST, {
      silent: true,
    });
    if (!response.data.success || !Array.isArray(response.data.data))
      throw new Error('Không đọc được danh mục dị ứng.');
    return allergenMapper.catalog(response.data);
  },
};
