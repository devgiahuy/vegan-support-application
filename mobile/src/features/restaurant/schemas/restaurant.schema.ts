/** Hằng số và lựa chọn cho khám phá/đề xuất quán, khớp giới hạn của backend (OpenAPI). */
export const MIN_RADIUS_M = 100;
export const MAX_RADIUS_M = 50000;
export const DEFAULT_RADIUS_M = 5000;
export const RADIUS_OPTIONS_M = [500, 1000, 3000, 5000, 10000, 20000, 50000] as const;

export const MIN_KEYWORD_LENGTH = 2;
export const MIN_ADDRESS_LENGTH = 5;
export const MAX_CATEGORIES = 30;

/** Bộ lọc chế độ ăn gửi `dietPattern` (backend chỉ hỗ trợ hai giá trị này). */
export const DIET_PATTERN_OPTIONS = [
  { value: 'VEGAN', label: 'Thuần chay' },
  { value: 'LACTO_OVO', label: 'Chay có trứng sữa' },
] as const;

/** Nhãn chế độ ăn quán có thể gắn khi đề xuất (`dietTags` enum của backend). */
export const SUBMIT_DIET_TAG_OPTIONS = [
  { value: 'VEGAN', label: 'Thuần chay' },
  { value: 'LACTO_OVO', label: 'Chay có trứng sữa' },
  { value: 'BUDDHIST', label: 'Chay Phật giáo' },
  { value: 'CHRISTIAN', label: 'Chay Kitô giáo' },
] as const;

/** Thang giá 4 mức của nhà cung cấp (`minPrice`/`maxPrice`: 0..4). KHÔNG phải số tiền VND. */
export const PRICE_LEVEL_OPTIONS = [
  { value: 0, label: '0$ · Rất rẻ' },
  { value: 1, label: '1$ · Rẻ' },
  { value: 2, label: '2$ · Vừa' },
  { value: 3, label: '3$ · Đắt' },
  { value: 4, label: '4$ · Rất đắt' },
] as const;

/** Đánh giá tối thiểu backend chấp nhận: 2..4.5. */
export const MIN_RATING_OPTIONS = [2, 2.5, 3, 3.5, 4, 4.5] as const;

export const OPEN_STATE_OPTIONS = [
  { value: 'now', label: 'Đang mở' },
  { value: '24h', label: 'Mở 24 giờ' },
] as const;

export const WEEKDAY_OPTIONS = [
  { value: 'mon', label: 'Thứ 2' },
  { value: 'tue', label: 'Thứ 3' },
  { value: 'wed', label: 'Thứ 4' },
  { value: 'thu', label: 'Thứ 5' },
  { value: 'fri', label: 'Thứ 6' },
  { value: 'sat', label: 'Thứ 7' },
  { value: 'sun', label: 'Chủ nhật' },
] as const;

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: `${hour}:00` }));
