import type { Restaurant, RestaurantBounds } from '../types/restaurant.model';

export interface RestaurantMapProps {
  items: Restaurant[];
  /** Tâm tìm kiếm (vị trí đã chọn, hoặc tâm mặc định khi chưa có vị trí). */
  center: { lat: number; lng: number };
  radiusM: number;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Chỉ truyền khi được phép nới bán kính (không ở chế độ tìm theo vùng đang xem). */
  onRadiusChange?: (radiusM: number) => void;
  /** Gọi mỗi khi khung nhìn đổi (tâm, bán kính, mức phóng, kích thước) — callback cần ổn định. */
  onBoundsChange: (bounds: RestaurantBounds | null) => void;
  onSearchThisArea: () => void;
  canSearchThisArea: boolean;
  isSearchingArea: boolean;
  /** Nội dung khi không có quán nào (đổi theo chế độ tìm hoặc khi tải lỗi). */
  emptyTitle?: string;
  emptyDescription?: string;
}
