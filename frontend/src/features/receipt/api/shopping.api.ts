import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { ShoppingGapEnvelopeDto } from '../types/shopping-gap.dto';
import type { SelectedMealInput, ShoppingGapPreview } from '../types/shopping-gap.model';
import { shoppingGapMapper } from '../mappers/shopping-gap.mapper';

export const shoppingApi = {
  /**
   * Tính toán khoảng thiếu đi chợ dựa trên thực đơn đã chọn và tồn kho tủ bếp thực tế
   */
  previewShoppingGaps: async (meals: SelectedMealInput[]): Promise<ShoppingGapPreview> => {
    const payload = shoppingGapMapper.toPreviewRequestDto(meals);
    const res = await api.post<ShoppingGapEnvelopeDto>(
      API_ENDPOINTS.SHOPPING_LISTS.PREVIEW,
      payload,
      { showErrorToast: true }
    );
    return shoppingGapMapper.toModel(res.data.data);
  },
};
