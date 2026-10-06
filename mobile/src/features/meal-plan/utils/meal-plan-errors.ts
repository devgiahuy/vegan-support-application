import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

/** Thông báo lỗi nghiệp vụ cho các thao tác thực đơn (luôn dựa vào `error.code`, không dựa vào text). */
export function getMealPlanErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  switch (code) {
    case 'MEAL_PLAN_VERSION_CONFLICT':
    case 'PLAN_VERSION_MISMATCH':
      return 'Thực đơn đã có phiên bản mới. Hãy tải lại rồi thao tác lại.';
    case 'MEAL_PLAN_IDEMPOTENCY_CONFLICT':
      return 'Thao tác trước đó đang được xử lý. Hãy đợi một chút rồi thử lại.';
    case 'MEAL_PLAN_SUPERSEDES_INVALID':
      return 'Chỉ có thể tạo lại từ thực đơn của bạn trong cùng tuần.';
    case 'NO_ELIGIBLE_RECIPE':
      return 'Không có món thay thế phù hợp với luật ăn và mục tiêu năng lượng.';
    case 'MEAL_PLAN_HARD_CONSTRAINT_VIOLATION':
      return 'Món này vi phạm chế độ ăn, dị ứng hoặc nguyên liệu bạn đã loại trừ nên không thể thêm vào thực đơn.';
    case 'HEALTH_PROFILE_INCOMPLETE':
      return 'Hãy cập nhật hồ sơ sức khỏe trước khi tạo thực đơn.';
    case 'DIET_SCHEDULE_REQUIRED':
      return 'Bạn cần chọn ngày thực hành ăn chay trong tuần này ở hồ sơ.';
    case 'AUTH_REQUIRED':
    case 'INVALID_ACCESS_TOKEN':
    case 'TOKEN_EXPIRED':
      return 'Bạn cần đăng nhập để xem và tạo thực đơn.';
    default:
      return getApiErrorMessage(error, 'Không thể hoàn tất thao tác. Vui lòng thử lại.');
  }
}

/** Thông báo lỗi nghiệp vụ cho phân tích thực đơn. */
export function getMealAnalysisErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  switch (code) {
    case 'MEAL_ANALYSIS_NOT_FOUND':
    case 'MEAL_PLAN_ANALYSIS_NOT_FOUND':
      return 'Chưa có kết quả phân tích cho thực đơn này.';
    case 'MEAL_ANALYSIS_STALE':
      return 'Phân tích đã cũ vì thực đơn vừa thay đổi. Hãy phân tích lại.';
    case 'MEAL_ANALYSIS_ITEM_UNFILLED':
      return 'Có bữa còn trống. Hãy thêm món vào bữa đó hoặc bỏ qua bữa trống.';
    case 'MEAL_ANALYSIS_SOURCE_MISSING':
      return 'Một món trong thực đơn không còn dữ liệu nguồn. Hãy tải lại thực đơn.';
    case 'PLAN_VERSION_MISMATCH':
    case 'MEAL_PLAN_VERSION_CONFLICT':
      return 'Thực đơn đã có phiên bản mới. Hãy tải lại rồi phân tích lại.';
    default:
      return getApiErrorMessage(error, 'Không phân tích được thực đơn. Vui lòng thử lại.');
  }
}
