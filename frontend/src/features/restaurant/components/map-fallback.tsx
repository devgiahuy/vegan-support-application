'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Compass,
  ExternalLink,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Restaurant } from '../types/restaurant.model';

export interface MapFallbackProps {
  items: Restaurant[];
  userLocation?: { lat: number; lng: number } | null;
  radiusM?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRadiusChange?: (radiusM: number) => void;
}

/**
 * Bản đồ tương tác trực quan (Interactive Radar Map):
 * - Hoạt động độc lập 100%, không phụ thuộc vào Google Maps API Key bên ngoài.
 * - Mô phỏng hệ tọa độ GPS quanh tâm vị trí người dùng kèm vòng tròn bán kính tìm kiếm.
 * - Đồng bộ 2 chiều với thẻ danh sách (Click Marker <-> Highlight Card).
 * - Cung cấp tùy chọn mở rộng bán kính và liên kết mở Google Maps ngoài.
 */
export function MapFallback({
  items,
  userLocation,
  radiusM = 5000,
  selectedId,
  onSelect,
  onRadiusChange,
}: MapFallbackProps) {
  const [zoomFactor, setZoomFactor] = React.useState(1);

  // Tâm bản đồ: Ưu tiên vị trí người dùng, sau đó là quán đầu tiên có tọa độ, hoặc mặc định Bến Thành (TP.HCM)
  const center = React.useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) return userLocation;
    const firstWithCoords = items.find((i) => i.lat !== null && i.lng !== null);
    if (firstWithCoords?.lat && firstWithCoords?.lng) {
      return { lat: firstWithCoords.lat, lng: firstWithCoords.lng };
    }
    return { lat: 10.7725, lng: 106.698 }; // Mặc định trung tâm TP.HCM
  }, [userLocation, items]);

  // Quán đang được chọn
  const activeRestaurant = React.useMemo(() => {
    return items.find((item) => item.id === selectedId) ?? null;
  }, [items, selectedId]);

  // Lấy các quán có tọa độ hợp lệ
  const validPlaces = React.useMemo(() => {
    return items.filter((item) => item.lat !== null && item.lng !== null);
  }, [items]);

  // Chiếu tọa độ địa lý (Lat, Lng) lên hệ quy chiếu phần trăm (%) trên khung bản đồ
  const plotted = React.useMemo(() => {
    const scaleRadius = Math.max(radiusM, 2000) * zoomFactor;
    // 1 độ vĩ độ ≈ 110.574 km, 1 độ kinh độ ≈ 111.320 * cos(lat) km
    const latMPerDegree = 110574;
    const lngMPerDegree = 111320 * Math.cos((center.lat * Math.PI) / 180);

    return validPlaces.map((item) => {
      const dLatM = ((item.lat ?? center.lat) - center.lat) * latMPerDegree;
      const dLngM = ((item.lng ?? center.lng) - center.lng) * lngMPerDegree;

      // Chiếu tỷ lệ: Tâm (50%, 50%), khoảng quét bán kính chiếm 40% bề rộng
      const rawX = 50 + (dLngM / scaleRadius) * 40;
      const rawY = 50 - (dLatM / scaleRadius) * 40;

      // Giới hạn trong vùng hiển thị 10% - 90%
      const x = Math.max(10, Math.min(90, rawX));
      const y = Math.max(12, Math.min(88, rawY));

      return {
        ...item,
        mapX: x,
        mapY: y,
      };
    });
  }, [validPlaces, center, radiusM, zoomFactor]);

  // Link mở Google Maps ngoài
  const googleMapsUrl = `https://www.google.com/maps/search/qu%C3%A1n+chay/@${center.lat},${center.lng},14z`;

  return (
    <div
      className="relative flex size-full min-h-[400px] flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-card to-muted/40 p-4 shadow-xs"
      role="region"
      aria-label="Bản đồ quán chay trực quan"
    >
      {/* Lưới tọa độ bản đồ & Hiệu ứng Radar */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(var(--border) 1px, transparent 1px), linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '28px 28px, 112px 112px, 112px 112px',
        }}
      />

      {/* Vòng tròn đồng tâm hiển thị bán kính tìm kiếm */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* Vòng bán kính 100% */}
        <div className="size-[80%] rounded-full border border-dashed border-primary/20 bg-primary/5 transition-all" />
        {/* Vòng bán kính 50% */}
        <div className="size-[42%] rounded-full border border-primary/15 bg-primary/5" />
        {/* Vòng sóng xung kích lan tỏa từ tâm */}
        <div className="size-24 animate-ping rounded-full bg-emerald-500/10 motion-reduce:animate-none" />
      </div>

      {/* Header điều khiển bản đồ */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Compass className="size-4 animate-spin-slow motion-reduce:animate-none" />
          </span>
          <div>
            <h3 className="text-xs font-bold leading-none">Bản đồ vị trí trực quan</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Bán kính: {radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`} •{' '}
              {validPlaces.length} quán
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            Sẵn sàng
          </Badge>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-md border bg-background/80 px-2 text-[11px] font-medium shadow-2xs hover:bg-muted"
            title="Mở Google Maps trên tab mới"
          >
            Google Maps <ExternalLink className="size-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Mặt phẳng hiển thị các Markers */}
      <div className="relative z-10 flex-1">
        {/* Tâm vị trí của người dùng */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ zIndex: 15 }}
          title="Vị trí của bạn"
        >
          <div className="relative flex flex-col items-center">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-4 ring-emerald-500/20">
              <Navigation className="size-3 fill-current" />
            </span>
            <span className="mt-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-xs">
              Bạn
            </span>
          </div>
        </div>

        {/* Các quán ăn xung quanh */}
        {plotted.map((place) => {
          const isSelected = place.id === selectedId;
          return (
            <button
              key={place.id}
              type="button"
              onClick={() => onSelect?.(place.id)}
              className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all focus:outline-hidden"
              style={{
                left: `${place.mapX}%`,
                top: `${place.mapY}%`,
                zIndex: isSelected ? 30 : 20,
              }}
              title={`${place.name} (${place.distanceLabel || 'Lân cận'})`}
            >
              <div className="relative flex flex-col items-center">
                {/* Badge tên quán: CHỈ hiển thị khi được chọn hoặc khi rê chuột (chống đè chữ) */}
                <div
                  className={`pointer-events-none mb-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] shadow-md transition-all ${
                    isSelected
                      ? 'opacity-100 scale-105 bg-primary text-primary-foreground font-bold ring-2 ring-primary/30 z-30'
                      : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bg-background/95 text-foreground font-medium border border-border/80'
                  }`}
                >
                  {place.name}
                  {place.distanceLabel && (
                    <span className="ml-1 opacity-80 font-normal">({place.distanceLabel})</span>
                  )}
                </div>

                {/* Marker icon */}
                <div
                  className={`flex size-7 items-center justify-center rounded-full border shadow-sm transition-all ${
                    isSelected
                      ? 'scale-125 border-primary bg-primary text-primary-foreground ring-4 ring-primary/25 shadow-md'
                      : 'border-white bg-emerald-600 text-white group-hover:scale-115 group-hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  <Utensils className="size-3.5" />
                </div>
              </div>
            </button>
          );
        })}

        {/* Trạng thái không có quán nào trong bán kính hiện tại */}
        {validPlaces.length === 0 && (
          <div className="absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center justify-center rounded-xl border border-dashed bg-background/90 p-4 text-center shadow-xs backdrop-blur-xs">
            <MapPin className="size-6 text-muted-foreground" />
            <p className="mt-1.5 text-xs font-semibold">
              Chưa có kết quả phù hợp trong bán kính{' '}
              {radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Hãy thử mở rộng bán kính tìm kiếm hoặc chọn địa điểm khác.
            </p>
            {onRadiusChange && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onRadiusChange(10000)}
                >
                  Mở rộng 10 km
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onRadiusChange(20000)}
                >
                  Mở rộng 20 km
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onRadiusChange(50000)}
                >
                  50 km
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cụm nút phóng to / thu nhỏ / đặt lại tầm nhìn mô phỏng Google Maps */}
      <div className="absolute right-3 top-16 z-30 flex flex-col gap-1 rounded-xl border bg-background/90 p-1 shadow-md backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setZoomFactor((z) => Math.max(0.35, Number((z * 0.75).toFixed(2))))}
          className="flex size-7 items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Phóng to"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoomFactor((z) => Math.min(2.5, Number((z * 1.35).toFixed(2))))}
          className="flex size-7 items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Thu nhỏ"
        >
          <Minus className="size-3.5" />
        </button>
        {zoomFactor !== 1 && (
          <button
            type="button"
            onClick={() => setZoomFactor(1)}
            className="flex size-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground border-t transition-colors"
            title="Đặt lại tỉ lệ phóng"
          >
            <LocateFixed className="size-3.5" />
          </button>
        )}
      </div>

      {/* Thẻ xem nhanh thông tin quán đang được chọn ở góc dưới bản đồ (Quick Preview Popup) */}
      {activeRestaurant && (
        <div className="relative z-20 mt-auto flex items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 text-xs shadow-lg backdrop-blur-xs transition-all animate-in fade-in slide-in-from-bottom-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-bold text-foreground text-sm">{activeRestaurant.name}</p>
              {activeRestaurant.distanceLabel && (
                <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <Navigation className="size-2.5 fill-current" /> {activeRestaurant.distanceLabel}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {activeRestaurant.address}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {activeRestaurant.lat && activeRestaurant.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeRestaurant.lat},${activeRestaurant.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted shadow-2xs"
                title="Chỉ đường trên Google Maps"
              >
                <Navigation className="size-3 text-emerald-600 fill-emerald-600" />
                <span className="hidden sm:inline">Chỉ đường</span>
              </a>
            )}
            <Button
              asChild
              size="sm"
              className="h-8 px-3 text-xs font-semibold rounded-lg shadow-2xs"
            >
              <Link href={`/restaurants/${activeRestaurant.id}`}>Chi tiết</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
