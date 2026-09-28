import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  PantryItemDto,
  PantryAdjustmentDto,
  PantryListQueryDto,
  ExpiringSoonQueryDto,
  PantryAdjustmentListQueryDto,
  CreatePantryItemReqDto,
  UpdatePantryItemReqDto,
  CreatePantryAdjustmentReqDto,
  MergePreviewReqDto,
  MergePantryItemsReqDto,
  PantryItemEnvelopeDto,
  PantryListEnvelopeDto,
  PantryAdjustmentEnvelopeDto,
  PantryAdjustmentListEnvelopeDto,
  MergePreviewEnvelopeDto,
} from '../types/pantry.dto';
import type { PantryItem, PantryAdjustment, PantryMergePreview } from '../types/pantry.model';
import { pantryMapper } from '../mappers/pantry.mapper';

export const pantryApi = {
  /**
   * Danh sách nguyên liệu trong tủ bếp của tôi (có phân trang & lọc)
   */
  getItems: async (params?: PantryListQueryDto): Promise<PaginationResult<PantryItem>> => {
    const res = await api.get<PantryListEnvelopeDto>(API_ENDPOINTS.PANTRY.ITEMS, {
      params,
      silent: true,
    });
    return pantryMapper.toPantryPaginationModel(res.data);
  },

  /**
   * Chi tiết nguyên liệu trong tủ bếp
   */
  getItemById: async (id: string): Promise<PantryItem> => {
    const res = await api.get<PantryItemEnvelopeDto>(API_ENDPOINTS.PANTRY.ITEM_DETAIL(id), {
      silent: true,
    });
    return pantryMapper.toModel(res.data.data);
  },

  /**
   * Thêm mới nguyên liệu vào tủ bếp
   */
  createItem: async (
    payload: CreatePantryItemReqDto
  ): Promise<{ item: PantryItem; adjustment: PantryAdjustment }> => {
    const res = await api.post<PantryAdjustmentEnvelopeDto>(API_ENDPOINTS.PANTRY.ITEMS, payload, {
      showErrorToast: true,
    });
    return {
      item: pantryMapper.toModel(res.data.data.item),
      adjustment: pantryMapper.toAdjustmentModel(res.data.data.adjustment),
    };
  },

  /**
   * Cập nhật thông tin độ tươi / hạn dùng nguyên liệu (Optimistic Concurrency)
   */
  updateItem: async (id: string, payload: UpdatePantryItemReqDto): Promise<PantryItem> => {
    const res = await api.patch<PantryItemEnvelopeDto>(
      API_ENDPOINTS.PANTRY.ITEM_DETAIL(id),
      payload,
      { showErrorToast: true }
    );
    return pantryMapper.toModel(res.data.data);
  },

  /**
   * Xóa mềm nguyên liệu khỏi tủ bếp
   */
  deleteItem: async (id: string, expectedVersion: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.PANTRY.ITEM_DETAIL(id), {
      params: { expectedVersion },
      showErrorToast: true,
    });
  },

  /**
   * Danh sách nguyên liệu sắp hết hạn (mặc định trong 7 ngày tới)
   */
  getExpiringSoon: async (params?: ExpiringSoonQueryDto): Promise<PaginationResult<PantryItem>> => {
    const res = await api.get<PantryListEnvelopeDto>(API_ENDPOINTS.PANTRY.EXPIRING_SOON, {
      params,
      silent: true,
    });
    return pantryMapper.toPantryPaginationModel(res.data);
  },

  /**
   * Xem sổ cái lịch sử điều chỉnh số lượng của nguyên liệu
   */
  getAdjustments: async (
    id: string,
    params?: PantryAdjustmentListQueryDto
  ): Promise<PaginationResult<PantryAdjustment>> => {
    const res = await api.get<PantryAdjustmentListEnvelopeDto>(
      API_ENDPOINTS.PANTRY.ADJUSTMENTS(id),
      {
        params,
        silent: true,
      }
    );
    const meta = res.data.meta || {
      page: 1,
      limit: 20,
      total: res.data.data.length,
      totalPages: 1,
    };
    return {
      items: res.data.data.map((item) => pantryMapper.toAdjustmentModel(item)),
      metadata: {
        page: meta.page,
        limit: meta.limit,
        totalItems: meta.total,
        totalPages: meta.totalPages,
        hasNextPage: meta.page < meta.totalPages,
        hasPrevPage: meta.page > 1,
      },
    };
  },

  /**
   * Thực hiện tiêu hao / hoàn trả / điều chỉnh lệch số lượng
   */
  createAdjustment: async (
    id: string,
    payload: CreatePantryAdjustmentReqDto
  ): Promise<{ item: PantryItem; adjustment: PantryAdjustment }> => {
    const res = await api.post<PantryAdjustmentEnvelopeDto>(
      API_ENDPOINTS.PANTRY.ADJUSTMENTS(id),
      payload,
      { showErrorToast: true }
    );
    return {
      item: pantryMapper.toModel(res.data.data.item),
      adjustment: pantryMapper.toAdjustmentModel(res.data.data.adjustment),
    };
  },

  /**
   * Xem trước kết quả gộp nguyên liệu trùng lặp
   */
  previewMerge: async (payload: MergePreviewReqDto): Promise<PantryMergePreview> => {
    const res = await api.post<MergePreviewEnvelopeDto>(
      API_ENDPOINTS.PANTRY.MERGE_PREVIEW,
      payload,
      { showErrorToast: true }
    );
    return pantryMapper.toMergePreviewModel(res.data.data);
  },

  /**
   * Gộp các nguyên liệu trùng lặp nguyên tử
   */
  mergeItems: async (payload: MergePantryItemsReqDto): Promise<PantryItem> => {
    const res = await api.post<PantryItemEnvelopeDto>(API_ENDPOINTS.PANTRY.MERGE, payload, {
      showErrorToast: true,
    });
    return pantryMapper.toModel(res.data.data);
  },
};

type PantryAdjustmentListListEnvelopeInternal = PantryAdjustmentListEnvelopeDto;
