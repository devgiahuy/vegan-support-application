/**
 * Tiện ích xử lý và định dạng các chỉ số dinh dưỡng cho module Meal Program
 */

/**
 * Làm tròn số đến số chữ số thập phân chỉ định (mặc định 2 chữ số thập phân).
 * Tránh lỗi dấu phẩy động trong JavaScript (ví dụ: 1975.8900000000003 -> 1975.89).
 */
export function roundToDecimals(value: number, decimals = 2): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Định dạng số dinh dưỡng để hiển thị ra UI với tối đa 2 chữ số thập phân.
 * Ví dụ: 1975.8900000000003 -> "1975.89"; 616.33 -> "616.33"; 200 -> "200"
 */
export function formatNutrient(value?: number | null, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '0';
  const rounded = roundToDecimals(value, decimals);
  return String(rounded);
}
