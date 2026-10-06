'use client';

import * as React from 'react';
import type { RestaurantAdvancedFilters, RestaurantSearchState } from '../types/restaurant.model';
import { sanitizePersistedFilters } from './restaurant-search';
import type { DietPattern } from '@/common/enums';

/**
 * Khoá của phiên tìm kiếm trong `sessionStorage`.
 *
 * Ràng buộc riêng tư (FR-029/FR-030): chỉ lưu BỘ LỌC. Tọa độ, bounds, chuỗi địa chỉ và
 * cờ đồng ý chia sẻ vị trí KHÔNG BAO GIỜ được ghi — mọi thứ đi qua `sanitizePersistedFilters`.
 *
 * Chọn `sessionStorage` chứ không phải `localStorage`: dữ liệu tự biến mất khi đóng tab,
 * rút ngắn tối đa thời gian lưu giữ thông tin vị trí, và server/middleware không đọc được.
 */

export const STORAGE_KEY = 'veg:restaurant-filters';

/** Chỉ giữ lại các trường được phép lưu. */
export type PersistedFilters = Pick<
  RestaurantSearchState,
  'radiusM' | 'query' | 'dietPattern' | 'advanced'
>;

const isBrowser = (): boolean => typeof window !== 'undefined';

/** Đọc bộ lọc đã lưu; trả mặc định khi không có hoặc dữ liệu hỏng. */
export function readPersistedFilters(): PersistedFilters | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizePersistedFilters(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Ghi bộ lọc — luôn đi qua sanitizer nên không thể rò tọa độ. */
export function writePersistedFilters(filters: {
  radiusM: number;
  query: string;
  dietPattern?: DietPattern;
  advanced: RestaurantAdvancedFilters;
}): void {
  if (!isBrowser()) return;
  try {
    const sanitized = sanitizePersistedFilters(filters);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Trình duyệt chặn storage (chế độ riêng tư) — bỏ qua, không chặn trải nghiệm người dùng.
  }
}

export interface UseRestaurantSearchSessionFilters {
  radiusM: number;
  query: string;
  dietPattern?: DietPattern;
  advanced: RestaurantAdvancedFilters;
}

/**
 * Đọc bộ lọc phiên MỘT LẦN ở lần render đầu (initializer của `useState`), rồi ghi lại mỗi khi
 * bộ lọc thay đổi.
 *
 * Vị trí người dùng (lat/lng/bounds) nằm ngoài phạm vi hook này và luôn bắt đầu là `null`,
 * nên mỗi lần mở trang người dùng phải xác nhận lại vị trí (FR-031).
 */
export function useRestaurantSearchSession(): PersistedFilters | null {
  const [initial] = React.useState<PersistedFilters | null>(readPersistedFilters);

  return initial;
}

/** Ghi bộ lọc hiện tại vào phiên. Gọi từ effect của trang. */
export function persistSearchFilters(filters: UseRestaurantSearchSessionFilters): void {
  writePersistedFilters(filters);
}
