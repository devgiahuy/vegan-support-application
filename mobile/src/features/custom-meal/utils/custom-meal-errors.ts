import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

/** Thông báo lỗi nghiệp vụ cho bữa ăn tự tạo (dựa vào `error.code`, không dựa vào text). */
export function getCustomMealErrorMessage(error: unknown, fallback = 'Không thể hoàn tất thao tác. Vui lòng thử lại.'): string {
  switch (getApiErrorCode(error)) {
    case 'INGREDIENT_ID_NAME_MISMATCH':
      return 'Tên nguyên liệu không khớp với nguyên liệu chuẩn đã chọn. Hãy chọn lại nguyên liệu từ gợi ý hoặc dùng tên tự nhập.';
    case 'CUSTOM_MEAL_IN_USE':
      return 'Bữa ăn này đang được dùng trong thực đơn nên chưa thể xóa.';
    case 'CUSTOM_MEAL_PHOTO_LIMIT':
      return 'Mỗi bữa ăn chỉ có tối đa 10 ảnh. Hãy xóa bớt ảnh cũ trước khi thêm.';
    case 'ASSET_NOT_FOUND_OR_INELIGIBLE':
      return 'Ảnh không còn hợp lệ hoặc không thuộc tài khoản của bạn. Hãy chọn lại ảnh.';
    case 'VALIDATION_ERROR':
      return 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại các trường đã nhập.';
    default:
      return getApiErrorMessage(error, fallback);
  }
}
