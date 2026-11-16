import { getApiErrorCode, getApiErrorFields, getApiErrorMessage } from '@/lib/api-error';

const NUTRITION_METRIC_LABELS: Record<string, string> = {
  calories: 'năng lượng',
  proteinGrams: 'protein',
  carbsGrams: 'carbohydrate',
  fatGrams: 'chất béo',
  fiberGrams: 'chất xơ',
  vitaminB12Mcg: 'vitamin B12',
};

/** `422 RECIPE_NUTRITION_REQUIRED`: liệt kê chỉ số còn thiếu từ `fields.missingMetrics` và chỉ về bước Phân loại. */
function nutritionRequiredMessage(error: unknown): string {
  const raw = getApiErrorFields(error)?.missingMetrics;
  const names = Array.isArray(raw)
    ? raw.map((key) => (typeof key === 'string' ? (NUTRITION_METRIC_LABELS[key] ?? key) : '')).filter(Boolean)
    : [];
  const missing = names.length > 0 ? ` (còn thiếu: ${names.join(', ')})` : '';
  return `Tài khoản Cộng tác viên cần khai đủ 6 chỉ số dinh dưỡng mỗi khẩu phần${missing}. Hãy bổ sung ở bước Phân loại rồi gửi lại.`;
}

/** Thông báo lỗi nghiệp vụ khi đăng/sửa nội dung (công thức, bài viết, video) — dựa vào `error.code`. */
export function getContentErrorMessage(error: unknown, fallback = 'Vui lòng kiểm tra dữ liệu và thử lại.'): string {
  switch (getApiErrorCode(error)) {
    case 'INGREDIENT_ID_NAME_MISMATCH':
      return 'Tên một nguyên liệu không khớp với nguyên liệu chuẩn đã chọn. Hãy xóa dòng đó và chọn lại từ gợi ý, hoặc nhập tên tự do.';
    case 'CONTENT_VERSION_CONFLICT':
      return 'Nội dung đã được cập nhật ở nơi khác. Hãy mở lại bài để lấy bản mới nhất rồi chỉnh sửa lại.';
    case 'RECIPE_DRAFT_UNAVAILABLE':
      return 'Trợ lý AI soạn công thức đang tạm tắt hoặc chưa sẵn sàng. Bạn vẫn có thể nhập công thức thủ công.';
    case 'RECIPE_DRAFT_GENERATION_FAILED':
      return 'AI chưa soạn được bản nháp lúc này. Hãy thử lại sau ít phút hoặc nhập thủ công.';
    case 'RECIPE_NUTRITION_REQUIRED':
      return nutritionRequiredMessage(error);
    case 'INVALID_CONTENT':
      return 'Nội dung chưa đạt yêu cầu. Vui lòng kiểm tra lại các trường bắt buộc.';
    default:
      return getApiErrorMessage(error, fallback);
  }
}
