import type { RepeatedPatternWarning } from '../types/meal-program.model';

export interface PaginatedWarningsResult {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  startIndex: number;
  endIndex: number;
  items: RepeatedPatternWarning[];
}

/**
 * Phân trang danh sách cảnh báo lặp món ăn an toàn
 */
export function paginateWarnings(
  warnings: RepeatedPatternWarning[] | null | undefined,
  page: number,
  pageSize: number = 5
): PaginatedWarningsResult {
  const safeItems = warnings ?? [];
  const totalItems = safeItems.length;
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(totalItems / safePageSize);
  const currentPage = totalPages > 0 ? Math.min(Math.max(1, page), totalPages) : 1;
  const startIndex = totalPages > 0 ? (currentPage - 1) * safePageSize : 0;
  const endIndex = Math.min(startIndex + safePageSize, totalItems);
  const items = safeItems.slice(startIndex, endIndex);

  return {
    totalItems,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    items,
  };
}

/**
 * Tạo chuỗi tóm tắt phân trang tiếng Việt
 */
export function formatPaginationSummary(
  startIndex: number,
  endIndex: number,
  totalItems: number
): string {
  if (totalItems === 0) return '0 món';
  return `Hiển thị ${startIndex + 1} - ${endIndex} trên tổng số ${totalItems} món`;
}
