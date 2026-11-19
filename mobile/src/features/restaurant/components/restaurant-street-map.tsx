import type { RestaurantMapProps } from './restaurant-map.types';

/**
 * Bản dành cho web: thư viện bản đồ MapLibre chỉ có module native, nên web (và công cụ kiểm tra kiểu) dùng bản này.
 * Triển khai thật nằm ở `restaurant-street-map.native.tsx`; trên web `RestaurantMap` luôn chọn sơ đồ dự phòng.
 */
export function RestaurantStreetMap({ onUnavailable }: RestaurantMapProps & { onUnavailable: () => void }) {
  void onUnavailable;
  return null;
}
