/**
 * Tiện ích chuẩn hóa và kiểm tra tính hợp lệ của Thẻ người dùng (User Tags)
 * Tuân thủ quy định nghiệp vụ: Metadata text thuần túy, loại bỏ ký tự lạ.
 */

export const MAX_TAG_LENGTH = 30;
export const MAX_TAGS_PER_MEAL = 10;

/**
 * Regex kiểm tra ký tự hợp lệ cho thẻ:
 * Chữ cái tiếng Việt, tiếng Anh, số, khoảng trắng và dấu gạch nối.
 */
export const VALID_TAG_REGEX =
  /^[a-z0-9\s\-àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+$/i;

/**
 * Chuẩn hóa một thẻ:
 * - Cắt khoảng trắng đầu cuối
 * - Chuyển sang chữ thường
 * - Thu gọn nhiều khoảng trắng liên tiếp thành 1 khoảng trắng
 * - Cắt bớt nếu vượt quá MAX_TAG_LENGTH ký tự
 */
export function normalizeUserTag(rawTag: string): string {
  if (!rawTag) return '';
  return rawTag.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH);
}

/**
 * Kiểm tra xem thẻ có hợp lệ hay không
 */
export function isValidUserTag(tag: string): boolean {
  const normalized = normalizeUserTag(tag);
  if (!normalized) return false;
  if (normalized.length > MAX_TAG_LENGTH) return false;
  return VALID_TAG_REGEX.test(normalized);
}

/**
 * Chuẩn hóa danh sách thẻ:
 * - Lọc thẻ hợp lệ
 * - Loại bỏ thẻ trùng lặp
 * - Giới hạn tối đa MAX_TAGS_PER_MEAL thẻ
 */
export function normalizeTagList(tags: string[]): string[] {
  const set = new Set<string>();
  for (const t of tags) {
    const norm = normalizeUserTag(t);
    if (norm && isValidUserTag(norm)) {
      set.add(norm);
      if (set.size >= MAX_TAGS_PER_MEAL) break;
    }
  }
  return Array.from(set);
}
