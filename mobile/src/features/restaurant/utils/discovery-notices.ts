import type { DiscoveryNotice, Restaurant, RestaurantDiscoveryMeta } from '../types/restaurant.model';

/** Quán nội bộ đã duyệt (và dữ liệu demo) không tính là dữ liệu từ nhà cung cấp bên ngoài. */
export function isExternalPlace(restaurant: Pick<Restaurant, 'source'>): boolean {
  return restaurant.source !== 'INTERNAL' && restaurant.source !== 'FAKE';
}

/** Gom các thông báo nguồn dữ liệu cho một lần tìm — đồng bộ `buildNotices` của web. */
export function buildDiscoveryNotices(
  meta: Pick<
    RestaurantDiscoveryMeta,
    'externalDataUnavailable' | 'externalResultsSuppressed' | 'resultsTruncated' | 'providerResultLimit' | 'provider' | 'locationStored'
  >,
  restaurants: Pick<Restaurant, 'source' | 'isStale'>[]
): DiscoveryNotice[] {
  const notices: DiscoveryNotice[] = [];

  if (meta.externalDataUnavailable) {
    notices.push({
      kind: 'UNAVAILABLE',
      tone: 'warning',
      message: 'Một phần dữ liệu bản đồ chưa tải được. Kết quả có thể chưa đầy đủ; bạn có thể thử lại.',
    });
  }
  if (meta.externalResultsSuppressed) {
    notices.push({
      kind: 'SUPPRESSED',
      tone: 'info',
      message:
        'Bạn đã chọn bộ lọc chế độ ăn. Quán từ nhà cung cấp bản đồ chưa có thông tin xác minh phù hợp nên đã được loại khỏi danh sách.',
    });
  }
  if (meta.resultsTruncated) {
    const limit = meta.providerResultLimit !== null && meta.providerResultLimit > 0 ? ` tối đa ${meta.providerResultLimit} kết quả` : '';
    notices.push({
      kind: 'TRUNCATED',
      tone: 'warning',
      message: `Kết quả có thể chưa đầy đủ: nhà cung cấp bản đồ chỉ trả về${limit} cho mỗi lần tìm.`,
    });
  }
  if (restaurants.some(isExternalPlace)) {
    notices.push({
      kind: 'ATTRIBUTION',
      tone: 'info',
      message: meta.provider
        ? `Dữ liệu bản đồ được cung cấp bởi ${meta.provider} và có thể chưa được kiểm duyệt.`
        : 'Dữ liệu bản đồ được cung cấp bởi nhà cung cấp bên ngoài và có thể chưa được kiểm duyệt.',
    });
  }
  const staleCount = restaurants.filter((restaurant) => restaurant.isStale).length;
  if (staleCount > 0) {
    notices.push({
      kind: 'STALE',
      tone: 'info',
      message: `${staleCount} quán trong danh sách chưa được cập nhật hơn 30 ngày. Giờ mở cửa hoặc thực đơn có thể đã thay đổi, vui lòng liên hệ quán trước khi đến.`,
    });
  }
  // Chỉ hiện khi backend xác nhận không lưu vị trí.
  if (meta.locationStored === false) {
    notices.push({
      kind: 'PRIVACY',
      tone: 'info',
      message: 'Vị trí bạn dùng để tìm kiếm chỉ dùng cho lần tìm này và không được lưu giữ.',
    });
  }
  return notices;
}
