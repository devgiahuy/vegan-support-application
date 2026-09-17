import type {
  AdminRestaurantListResponseDto,
  GeocodeResponseDto,
  RestaurantListResponseDto,
  RestaurantResponseDto,
} from '../types/restaurant.dto';

/** Fixture quán chay Hà Nội/TP.HCM (phase scaffold — BE còn `PLANNED`). */
export const restaurantListFixture: RestaurantListResponseDto = {
  success: true,
  data: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Chay An Nhiên',
      address: '12 Hàng Tre, Hoàn Kiếm, Hà Nội',
      lat: 21.033,
      lng: 105.854,
      dishes: ['Bún bò Huế chay', 'Cơm chay thập cẩm'],
      openingHours: '7:00 - 21:00',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Bếp Chay Từ Tâm',
      address: '45 Nguyễn Huệ, Quận 1, TP.HCM',
      lat: 10.774,
      lng: 106.704,
      dishes: ['Lẩu nấm chay', 'Gỏi cuốn chay'],
      openingHours: '8:00 - 22:00',
      source: 'GOOGLE',
      fetchedAt: '2026-09-10T08:00:00.000Z',
      status: 'PUBLISHED',
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Cơm Chay Cũ Kỹ',
      address: '8 Hàng Bạc, Hà Nội',
      lat: 21.03,
      lng: 105.852,
      dishes: [],
      openingHours: null,
      source: 'INTERNAL',
      fetchedAt: '2020-01-01T00:00:00.000Z',
      status: 'PUBLISHED',
    },
  ],
  meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
};

export function restaurantDetailFixture(id: string): RestaurantResponseDto {
  const found = (restaurantListFixture.data ?? []).find((item) => item?.id === id) ?? null;
  return { success: true, data: found, meta: null };
}

/** Fixture hàng chờ duyệt quán. */
export const restaurantQueueFixture: AdminRestaurantListResponseDto = {
  success: true,
  data: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Chay Mới Mở',
      address: '99 Láng Hạ, Hà Nội',
      lat: 21.015,
      lng: 105.812,
      dishes: ['Phở chay'],
      status: 'PENDING',
    },
  ],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

/** Fixture geocode vài địa chỉ mẫu (lạ → null để caller dùng trung tâm mặc định). */
export function geocodeFixture(address: string): GeocodeResponseDto {
  const normalized = address.trim().toLowerCase();
  if (normalized.includes('hồ gươm') || normalized.includes('ho guom')) {
    return {
      success: true,
      data: { lat: 21.0285, lng: 105.8542, label: 'Hồ Gươm, Hà Nội' },
      meta: null,
    };
  }
  if (normalized.includes('bến thành') || normalized.includes('ben thanh')) {
    return {
      success: true,
      data: { lat: 10.7725, lng: 106.698, label: 'Chợ Bến Thành, TP.HCM' },
      meta: null,
    };
  }
  return { success: true, data: { lat: null, lng: null, label: '' }, meta: null };
}
