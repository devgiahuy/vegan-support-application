import api from '@/lib/axios';
import { INGREDIENT_COMPOSITION_ENDPOINTS } from '@/features/admin-catalog/constants/ingredient-composition.endpoints';
import { compositionMapper } from '../mappers/composition.mapper';
import type {
  CompositionResponseDto,
  CompositionSourcesResponseDto,
} from '../types/composition.dto';
import type { CompositionDraft } from '../types/composition.model';

export const compositionApi = {
  async get(id: string) {
    const { data } = await api.get<CompositionResponseDto>(
      INGREDIENT_COMPOSITION_ENDPOINTS.DETAIL(id),
      { silent: true }
    );
    if (!data.success || !data.data) throw new Error('Không đọc được cấu tạo nguyên liệu.');
    return compositionMapper.toModel(data.data);
  },
  async sources() {
    const { data } = await api.get<CompositionSourcesResponseDto>(
      INGREDIENT_COMPOSITION_ENDPOINTS.SOURCES,
      { silent: true }
    );
    if (!data.success || !Array.isArray(data.data))
      throw new Error('Không đọc được nguồn dữ liệu.');
    return data.data.map((item) => compositionMapper.source(item));
  },
  async save(id: string, version: number, draft: CompositionDraft) {
    const { data } = await api.put<CompositionResponseDto>(
      INGREDIENT_COMPOSITION_ENDPOINTS.DETAIL(id),
      compositionMapper.toRequest(draft, version)
    );
    if (!data.success || !data.data) throw new Error('Không đọc được kết quả lưu cấu tạo.');
    return compositionMapper.toModel(data.data);
  },
};
