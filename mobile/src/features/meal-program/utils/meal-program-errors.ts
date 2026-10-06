import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

/** Thông báo lỗi nghiệp vụ cho lộ trình nhiều tuần (luôn dựa vào `error.code`). */
export function getMealProgramErrorMessage(error: unknown): string {
  switch (getApiErrorCode(error)) {
    case 'MEAL_PROGRAM_VERSION_CONFLICT':
      return 'Lộ trình vừa được cập nhật ở nơi khác. Hãy tải lại rồi thao tác lại.';
    case 'MEAL_PROGRAM_IDEMPOTENCY_CONFLICT':
      return 'Thao tác trước đó đang được xử lý. Hãy đợi một chút rồi thử lại.';
    case 'MEAL_PROGRAM_LIMIT_EXCEEDED':
      return 'Số tuần hoặc số phương án vượt quá giới hạn cho phép. Hãy giảm bớt rồi thử lại.';
    case 'MEAL_PROGRAM_ALTERNATIVE_NOT_FOUND':
      return 'Phương án này không còn tồn tại. Hãy tải lại lộ trình.';
    case 'MEAL_PROGRAM_REGENERATION_LIMIT':
      return 'Tuần này đã hết lượt sinh lại. Hãy chọn một trong các phương án hiện có.';
    case 'MEAL_PROGRAM_NOT_CONFIRMABLE':
      return 'Chưa thể xác nhận: hãy xử lý các tuần bị lỗi và chọn phương án cho mọi tuần trước.';
    case 'MEAL_PROGRAM_CONFIRMED_IMMUTABLE':
      return 'Lộ trình đã xác nhận nên không thể chỉnh sửa. Hãy tạo lộ trình mới nếu cần đổi nội dung.';
    case 'HEALTH_PROFILE_INCOMPLETE':
      return 'Hãy cập nhật hồ sơ sức khỏe trước khi tạo lộ trình.';
    case 'DIET_SCHEDULE_REQUIRED':
      return 'Bạn đang theo chế độ chay kỳ — hãy chọn ngày chay trong các tuần của lộ trình ở hồ sơ trước.';
    case 'NO_ELIGIBLE_RECIPE':
      return 'Không đủ món phù hợp với chế độ ăn của bạn để tạo thực đơn cho tuần này.';
    default:
      return getApiErrorMessage(error, 'Không thể hoàn tất thao tác. Vui lòng thử lại.');
  }
}

/** Lỗi do dữ liệu cũ (nên tải lại lộ trình thay vì thử lại y nguyên). */
export function isMealProgramVersionConflict(error: unknown): boolean {
  return getApiErrorCode(error) === 'MEAL_PROGRAM_VERSION_CONFLICT';
}
