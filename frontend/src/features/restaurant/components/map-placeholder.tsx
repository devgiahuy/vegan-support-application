import { MapPin } from 'lucide-react';
import type { Restaurant } from '../types/restaurant.model';

/**
 * Khung bản đồ dự phòng (fallback khi thiếu key Google hoặc SDK lỗi):
 * giữ chỗ đúng tỉ lệ + pins CSS theo tọa độ tương đối của cùng tập kết quả.
 * Danh sách bên cạnh luôn đầy đủ (US-3).
 */
export function MapPlaceholder({ items }: { items: Restaurant[] }) {
  const plotted = items.filter((item) => item.lat !== null && item.lng !== null).slice(0, 20);
  const lats = plotted.map((item) => item.lat as number);
  const lngs = plotted.map((item) => item.lng as number);
  const minLat = Math.min(...lats, 0);
  const maxLat = Math.max(...lats, 1);
  const minLng = Math.min(...lngs, 0);
  const maxLng = Math.max(...lngs, 1);

  const toPercent = (lat: number, lng: number): { top: string; left: string } => ({
    top: `${100 - ((lat - minLat) / (maxLat - minLat || 1)) * 100}%`,
    left: `${((lng - minLng) / (maxLng - minLng || 1)) * 100}%`,
  });

  return (
    <div
      className="relative h-72 overflow-hidden rounded-2xl border bg-muted/40"
      role="img"
      aria-label="Bản đồ minh họa vị trí các quán"
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {plotted.map((item) => {
        const position = toPercent(item.lat as number, item.lng as number);
        return (
          <span
            key={item.id}
            title={item.name}
            className="absolute -translate-x-1/2 -translate-y-full text-primary"
            style={{ top: position.top, left: position.left }}
          >
            <MapPin className="size-5 fill-primary/20" />
          </span>
        );
      })}
      <p className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-[11px] text-muted-foreground">
        Bản đồ tương tác chưa sẵn sàng — danh sách bên dưới vẫn đầy đủ.
      </p>
    </div>
  );
}
