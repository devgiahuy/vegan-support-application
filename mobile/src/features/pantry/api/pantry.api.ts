import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import type { PaginationResult } from '@/types/api';
import { pantryMapper } from '../mappers/pantry.mapper';
import type {
  PantryItemEnvelopeDto,
  PantryListEnvelopeDto,
  PantryListQueryDto,
  PantryAdjustmentEnvelopeDto,
  PantryAdjustmentListEnvelopeDto,
  MergePreviewEnvelopeDto,
} from '../types/pantry.dto';
import type {
  PantryItem,
  PantryItemFormValues,
  PantryListFilters,
  PantryObservationValues,
  PantryAdjustmentValues,
  PantryMergeValues,
} from '../types/pantry.model';

export const pantryApi = {
  getItems: async (
    params?: PantryListFilters,
    expiring = false
  ): Promise<PaginationResult<PantryItem>> => {
    const query: PantryListQueryDto = params ?? {};
    const res = await api.get<PantryListEnvelopeDto>(
      expiring ? API_ENDPOINTS.PANTRY.EXPIRING_SOON : API_ENDPOINTS.PANTRY.ITEMS,
      {
        params: expiring ? { page: query.page, limit: query.limit, days: 7 } : query,
        silent: true,
      }
    );
    return pantryMapper.toPantryPaginationModel(res.data);
  },

  getItemById: async (id: string): Promise<PantryItem> => {
    const res = await api.get<PantryItemEnvelopeDto>(API_ENDPOINTS.PANTRY.ITEM_DETAIL(id), {
      silent: true,
    });
    return pantryMapper.toModel(res.data.data);
  },

  createItem: async (values: PantryItemFormValues): Promise<PantryItem> => {
    const res = await api.post<PantryAdjustmentEnvelopeDto>(
      API_ENDPOINTS.PANTRY.ITEMS,
      pantryMapper.toCreateDto(values)
    );
    return pantryMapper.toCreatedItem(res.data);
  },

  deleteItem: async (id: string, expectedVersion: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.PANTRY.ITEM_DETAIL(id), {
      params: { expectedVersion },
    });
  },
  updateItem: async (id: string, values: PantryObservationValues): Promise<PantryItem> => {
    const res = await api.patch<PantryItemEnvelopeDto>(
      API_ENDPOINTS.PANTRY.ITEM_DETAIL(id),
      pantryMapper.toUpdateDto(values)
    );
    return pantryMapper.toModel(res.data.data);
  },
  adjustItem: async (id: string, values: PantryAdjustmentValues): Promise<PantryItem> => {
    const res = await api.post<PantryAdjustmentEnvelopeDto>(
      API_ENDPOINTS.PANTRY.ADJUSTMENTS(id),
      pantryMapper.toAdjustmentDto(values)
    );
    return pantryMapper.toCreatedItem(res.data);
  },
  getAdjustments: async (id: string, page: number) => {
    const res = await api.get<PantryAdjustmentListEnvelopeDto>(
      API_ENDPOINTS.PANTRY.ADJUSTMENTS(id),
      { params: { page, limit: 20 }, silent: true }
    );
    return {
      items: res.data.data.map((dto) => pantryMapper.toAdjustmentModel(dto)),
      page: res.data.meta.page,
      totalPages: res.data.meta.totalPages,
    };
  },
  previewMerge: async (itemIds: string[]) => {
    const res = await api.post<MergePreviewEnvelopeDto>(API_ENDPOINTS.PANTRY.MERGE_PREVIEW, {
      itemIds,
    });
    return pantryMapper.toMergePreviewModel(res.data.data);
  },
  mergeItems: async (values: PantryMergeValues): Promise<PantryItem> => {
    const res = await api.post<PantryItemEnvelopeDto>(
      API_ENDPOINTS.PANTRY.MERGE,
      pantryMapper.toMergeDto(values)
    );
    return pantryMapper.toModel(res.data.data);
  },
};
