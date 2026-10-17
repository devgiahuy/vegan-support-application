import type { RestaurantBounds } from '../types/restaurant.model';

/**
 * Logic thuần về khung vùng bản đồ.
 *
 * Ràng buộc từ backend (`restaurant.schemas.ts`):
 * - `north`, `south`, `east`, `west` phải được gửi **đủ cả bốn**, thiếu một sẽ bị 400.
 * - `north > south` và `east > west` bắt buộc.
 *
 * File này KHÔNG import React để có thể test trong môi trường node
 * (`vitest.config.ts` chỉ chạy các file test có phần mở rộng `.test.ts`).
 */

/** Bounds có dùng được để gửi truy vấn không. */
export function isBoundsUsable(
  bounds: RestaurantBounds | null | undefined
): bounds is RestaurantBounds {
  if (!bounds) return false;
  const { north, south, east, west } = bounds;
  const values = [north, south, east, west];
  if (values.some((value) => typeof value !== 'number' || Number.isNaN(value))) return false;
  if (north <= south) return false;
  if (east <= west) return false;
  return true;
}

/** So sánh 2 bounds có giống nhau không (dùng để bỏ qua cập nhật thừa). */
export function areBoundsEqual(
  a: RestaurantBounds | null | undefined,
  b: RestaurantBounds | null | undefined
): boolean {
  if (!a || !b) return a === b;
  return a.north === b.north && a.south === b.south && a.east === b.east && a.west === b.west;
}

/** Định dạng tọa độ bằng dấu phẩy thập phân kiểu Việt Nam, tối đa 4 chữ số thập phân. */
function formatCoord(value: number): string {
  return value
    .toFixed(4)
    .replace(/\.?0+$/, '')
    .replace('.', ',');
}

/** Nhãn tiếng Việt mô tả vùng đang xem; rỗng khi bounds không dùng được. */
export function formatBoundsLabel(bounds: RestaurantBounds | null | undefined): string {
  if (!isBoundsUsable(bounds)) return '';
  return `Vùng đang xem: ${formatCoord(bounds.south)} → ${formatCoord(bounds.north)} (vĩ độ), ${formatCoord(
    bounds.west
  )} → ${formatCoord(bounds.east)} (kinh độ)`;
}
