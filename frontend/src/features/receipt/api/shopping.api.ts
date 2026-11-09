import api from '@/lib/axios';
import { SHOPPING_LISTS_ENDPOINTS } from '@/features/receipt/constants/shopping-lists.endpoints';
import type { ShoppingGapEnvelopeDto } from '../types/shopping-gap.dto';
import type { SelectedMealInput, ShoppingGapPreview } from '../types/shopping-gap.model';
import { shoppingGapMapper } from '../mappers/shopping-gap.mapper';

export const shoppingApi = {
  /**
   * Tính toán khoảng thiếu đi chợ dựa trên thực đơn đã chọn và tồn kho tủ bếp thực tế
   */
  previewShoppingGaps: async (meals: SelectedMealInput[]): Promise<ShoppingGapPreview> => {
    const payload = shoppingGapMapper.toPreviewRequestDto(meals);
    const res = await api.post<ShoppingGapEnvelopeDto>(SHOPPING_LISTS_ENDPOINTS.PREVIEW, payload, {
      showErrorToast: true,
    });
    return shoppingGapMapper.toModel(res.data.data);
  },
};
