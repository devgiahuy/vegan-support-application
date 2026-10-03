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
