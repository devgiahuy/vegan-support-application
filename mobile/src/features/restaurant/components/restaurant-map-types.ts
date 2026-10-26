import type { Restaurant } from '../types/restaurant.model';

export interface RestaurantMapProps {
  items: Restaurant[];
  center: { lat: number; lng: number };
  radiusM: number;
  /** Đã có vị trí người dùng (đã chọn hoặc lấy từ thiết bị); chưa có thì bản đồ chỉ ở tâm mặc định. */
  hasLocation: boolean;
  /** Đã tìm xong nhưng không có quán nào trong bán kính. */
  isEmpty: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Chọn nhanh bán kính lớn hơn khi không có quán nào. */
  onRadiusChange: (radiusM: number) => void;
  /** Người dùng kéo bản đồ sang khu vực khác rồi bấm "Tìm trong vùng đang xem". */
  onSearchHere: (center: { lat: number; lng: number }) => void;
  /** Nút định vị trên bản đồ: lấy vị trí thiết bị. */
  onUseMyLocation: () => void;
  /** Đang lấy vị trí thiết bị. */
  locating: boolean;
}
