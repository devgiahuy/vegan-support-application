/**
 * Haversine — mét giữa 2 tọa độ (dùng sắp xếp ở tầng api/provider, giữ nguyên
 * khi nối live Backend; chuyển từ `restaurant.api.ts` sang đây để providers
 * dùng chung mà không circular-import).
 */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const earthM = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthM * Math.asin(Math.sqrt(a));
}
