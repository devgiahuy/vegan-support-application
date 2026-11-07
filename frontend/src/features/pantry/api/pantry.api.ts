import api from '@/lib/axios';
import { PANTRY_ENDPOINTS } from '@/features/pantry/constants/pantry.endpoints';
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
    const res = await api.get<PantryListEnvelopeDto>(PANTRY_ENDPOINTS.ITEMS, {
      params,
      silent: true,
    });
    return pantryMapper.toPantryPaginationModel(res.data?.data, res.data?.meta);
  },

  /**
   * Chi tiết nguyên liệu trong tủ bếp
   */
  getItemById: async (id: string): Promise<PantryItem> => {
    const res = await api.get<PantryItemEnvelopeDto>(PANTRY_ENDPOINTS.ITEM_DETAIL(id), {
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
    const res = await api.post<PantryAdjustmentEnvelopeDto>(PANTRY_ENDPOINTS.ITEMS, payload, {
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
    const res = await api.patch<PantryItemEnvelopeDto>(PANTRY_ENDPOINTS.ITEM_DETAIL(id), payload, {
      showErrorToast: true,
    });
    return pantryMapper.toModel(res.data.data);
  },

  /**
   * Xóa mềm nguyên liệu khỏi tủ bếp
   */
  deleteItem: async (id: string, expectedVersion: number): Promise<void> => {
    await api.delete(PANTRY_ENDPOINTS.ITEM_DETAIL(id), {
      params: { expectedVersion },
      showErrorToast: true,
    });
  },

  /**
   * Danh sách nguyên liệu sắp hết hạn (mặc định trong 7 ngày tới)
   */
  getExpiringSoon: async (params?: ExpiringSoonQueryDto): Promise<PaginationResult<PantryItem>> => {
    const res = await api.get<PantryListEnvelopeDto>(PANTRY_ENDPOINTS.EXPIRING_SOON, {
      params,
      silent: true,
    });
    return pantryMapper.toPantryPaginationModel(res.data?.data, res.data?.meta);
  },

  /**
   * Xem sổ cái lịch sử điều chỉnh số lượng của nguyên liệu
   */
  getAdjustments: async (
    id: string,
    params?: PantryAdjustmentListQueryDto
  ): Promise<PaginationResult<PantryAdjustment>> => {
    const res = await api.get<PantryAdjustmentListEnvelopeDto>(PANTRY_ENDPOINTS.ADJUSTMENTS(id), {
      params,
      silent: true,
    });
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
      PANTRY_ENDPOINTS.ADJUSTMENTS(id),
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
    const res = await api.post<MergePreviewEnvelopeDto>(PANTRY_ENDPOINTS.MERGE_PREVIEW, payload, {
      showErrorToast: true,
    });
    return pantryMapper.toMergePreviewModel(res.data.data);
  },

  /**
   * Gộp các nguyên liệu trùng lặp nguyên tử
   */
  mergeItems: async (payload: MergePantryItemsReqDto): Promise<PantryItem> => {
    const res = await api.post<PantryItemEnvelopeDto>(PANTRY_ENDPOINTS.MERGE, payload, {
      showErrorToast: true,
    });
    return pantryMapper.toModel(res.data.data);
  },
};

type PantryAdjustmentListListEnvelopeInternal = PantryAdjustmentListEnvelopeDto;
