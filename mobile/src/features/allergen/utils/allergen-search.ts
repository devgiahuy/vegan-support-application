import type { AllergenOption } from '../types/allergen.model';

/** Bỏ dấu, hạ chữ thường để tìm không phân biệt dấu (kể cả đ/Đ). */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Tìm trong danh mục theo nhãn, mã và tên đồng nghĩa. Kết quả chỉ là gợi ý: người dùng
 * phải chọn tường minh, không bao giờ tự chọn hộ (kể cả khi chỉ còn một kết quả).
 */
export function searchAllergens(
  catalog: AllergenOption[],
  query: string,
  excludedCodes: ReadonlySet<string> = new Set()
): AllergenOption[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [];
  const startsWith: AllergenOption[] = [];
  const contains: AllergenOption[] = [];
  for (const option of catalog) {
    if (excludedCodes.has(option.code)) continue;
    const haystacks = [option.label, option.code, ...option.searchTerms].map(normalizeSearchText);
    if (haystacks.some((text) => text.startsWith(needle))) startsWith.push(option);
    else if (haystacks.some((text) => text.includes(needle))) contains.push(option);
  }
  return [...startsWith, ...contains];
}
