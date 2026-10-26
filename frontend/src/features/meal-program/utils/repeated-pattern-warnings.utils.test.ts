import { describe, it, expect } from 'vitest';
import { paginateWarnings, formatPaginationSummary } from './repeated-pattern-warnings.utils';
import type { RepeatedPatternWarning } from '../types/meal-program.model';

const mockWarning = (id: string, name: string, count: number): RepeatedPatternWarning => ({
  mealId: id,
  mealName: name,
  sourceType: 'RECIPE',
  occurrences: count,
  dates: ['2026-11-02', '2026-11-05'],
  formattedDates: ['02/11/2026', '05/11/2026'],
  message: `${name} lặp lại ${count} lần trong tuần`,
});

describe('repeated-pattern-warnings.utils', () => {
  describe('paginateWarnings', () => {
    it('xử lý an toàn khi danh sách rỗng hoặc null/undefined', () => {
      const resultNull = paginateWarnings(null, 1, 5);
      expect(resultNull.totalItems).toBe(0);
      expect(resultNull.totalPages).toBe(0);
      expect(resultNull.currentPage).toBe(1);
      expect(resultNull.items).toEqual([]);

      const resultEmpty = paginateWarnings([], 1, 5);
      expect(resultEmpty.totalItems).toBe(0);
      expect(resultEmpty.totalPages).toBe(0);
      expect(resultEmpty.items).toEqual([]);
    });

    it('phân trang chính xác khi số lượng ít hơn 1 trang', () => {
      const warnings = [mockWarning('1', 'Đậu hũ sốt cà', 3), mockWarning('2', 'Canh rau ngót', 2)];

      const result = paginateWarnings(warnings, 1, 5);
      expect(result.totalItems).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(2);
      expect(result.items.length).toBe(2);
      expect(result.items[0].mealName).toBe('Đậu hũ sốt cà');
    });

    it('chia trang chuẩn xác với danh sách nhiều mục', () => {
      const warnings = Array.from({ length: 12 }, (_, i) =>
        mockWarning(String(i + 1), `Món chay số ${i + 1}`, 3)
      );

      // Trang 1: items 1 - 5
      const page1 = paginateWarnings(warnings, 1, 5);
      expect(page1.totalItems).toBe(12);
      expect(page1.totalPages).toBe(3);
      expect(page1.currentPage).toBe(1);
      expect(page1.startIndex).toBe(0);
      expect(page1.endIndex).toBe(5);
      expect(page1.items.length).toBe(5);
      expect(page1.items[0].mealName).toBe('Món chay số 1');
      expect(page1.items[4].mealName).toBe('Món chay số 5');

      // Trang 2: items 6 - 10
      const page2 = paginateWarnings(warnings, 2, 5);
      expect(page2.currentPage).toBe(2);
      expect(page2.startIndex).toBe(5);
      expect(page2.endIndex).toBe(10);
      expect(page2.items.length).toBe(5);
      expect(page2.items[0].mealName).toBe('Món chay số 6');
      expect(page2.items[4].mealName).toBe('Món chay số 10');

      // Trang 3: items 11 - 12
      const page3 = paginateWarnings(warnings, 3, 5);
      expect(page3.currentPage).toBe(3);
      expect(page3.startIndex).toBe(10);
      expect(page3.endIndex).toBe(12);
      expect(page3.items.length).toBe(2);
      expect(page3.items[0].mealName).toBe('Món chay số 11');
      expect(page3.items[1].mealName).toBe('Món chay số 12');
    });

    it('giới hạn an toàn (clamp) khi trang yêu cầu vượt quá tổng số trang hoặc < 1', () => {
      const warnings = Array.from({ length: 7 }, (_, i) =>
        mockWarning(String(i + 1), `Món chay ${i + 1}`, 2)
      );

      // Trang 99 -> clamp về trang cuối (trang 2)
      const pageOverflow = paginateWarnings(warnings, 99, 5);
      expect(pageOverflow.totalPages).toBe(2);
      expect(pageOverflow.currentPage).toBe(2);
      expect(pageOverflow.startIndex).toBe(5);
      expect(pageOverflow.endIndex).toBe(7);
      expect(pageOverflow.items.length).toBe(2);

      // Trang 0 hoặc âm -> clamp về trang 1
      const pageUnderflow = paginateWarnings(warnings, -1, 5);
      expect(pageUnderflow.currentPage).toBe(1);
      expect(pageUnderflow.startIndex).toBe(0);
      expect(pageUnderflow.endIndex).toBe(5);
    });

    it('hỗ trợ thay đổi kích thước trang (pageSize)', () => {
      const warnings = Array.from({ length: 15 }, (_, i) =>
        mockWarning(String(i + 1), `Món chay ${i + 1}`, 2)
      );

      const result10 = paginateWarnings(warnings, 2, 10);
      expect(result10.totalPages).toBe(2);
      expect(result10.currentPage).toBe(2);
      expect(result10.startIndex).toBe(10);
      expect(result10.endIndex).toBe(15);
      expect(result10.items.length).toBe(5);
    });
  });

  describe('formatPaginationSummary', () => {
    it('định dạng đúng tóm tắt hiển thị', () => {
      expect(formatPaginationSummary(0, 5, 12)).toBe('Hiển thị 1 - 5 trên tổng số 12 món');
      expect(formatPaginationSummary(5, 10, 12)).toBe('Hiển thị 6 - 10 trên tổng số 12 món');
      expect(formatPaginationSummary(10, 12, 12)).toBe('Hiển thị 11 - 12 trên tổng số 12 món');
      expect(formatPaginationSummary(0, 0, 0)).toBe('0 món');
    });
  });
});
