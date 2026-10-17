/**
 * Chuẩn hóa thẻ người dùng của món riêng — đồng bộ `frontend/.../custom-meal/utils/tag-normalizer.ts`.
 * Thẻ chỉ là metadata văn bản (ví dụ `shopee` không phải tích hợp dịch vụ ngoài).
 */
export const MAX_TAG_LENGTH = 30;
export const MAX_TAGS_PER_MEAL = 10;

const VALID_TAG_REGEX = /^[\p{L}\p{N}\s\-_]+$/u;

/** Bỏ `#` đầu, cắt khoảng trắng, chữ thường, thu gọn khoảng trắng và giới hạn độ dài. */
export function normalizeUserTag(rawTag: string): string {
  if (!rawTag) return '';
  const stripped = rawTag.trim().replace(/^#+/, '');
  return stripped.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH);
}

export function isValidUserTag(tag: string): boolean {
  const normalized = normalizeUserTag(tag);
  return normalized.length > 0 && VALID_TAG_REGEX.test(normalized);
}

export interface AddTagsResult {
  tags: string[];
  /** Thông báo lỗi của thẻ cuối cùng bị từ chối; `null` nếu tất cả hợp lệ. */
  error: string | null;
}

/** Thêm các thẻ phân tách bằng dấu phẩy, chấm phẩy hoặc xuống dòng vào danh sách hiện có. */
export function addUserTags(current: string[], rawInput: string): AddTagsResult {
  const tokens = rawInput
    .split(/[,;\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const tags = [...current];
  let error: string | null = null;

  for (const token of tokens) {
    const normalized = normalizeUserTag(token);
    if (!normalized) continue;
    if (!isValidUserTag(normalized)) {
      error = 'Thẻ chỉ gồm chữ cái, số, dấu cách, gạch nối (-) hoặc gạch dưới (_).';
      continue;
    }
    if (tags.includes(normalized)) {
      error = `Thẻ "${normalized}" đã tồn tại.`;
      continue;
    }
    if (tags.length >= MAX_TAGS_PER_MEAL) {
      error = `Mỗi món chỉ được gắn tối đa ${MAX_TAGS_PER_MEAL} thẻ.`;
      break;
    }
    tags.push(normalized);
  }
  return { tags, error };
}
