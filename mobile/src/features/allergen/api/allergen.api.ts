import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { allergenMapper } from '../mappers/allergen.mapper';
import type { AllergenCatalogResponseDto } from '../types/allergen.dto';
import type { AllergenOption } from '../types/allergen.model';

export const allergenApi = {
  /** `GET /allergens` — danh mục dị ứng đang hoạt động (public). */
  getCatalog: async (): Promise<AllergenOption[]> => {
    const res = await api.get<AllergenCatalogResponseDto>(API_ENDPOINTS.ALLERGENS.LIST, { silent: true });
    return allergenMapper.toCatalogModel(res.data);
  },
};
