'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Compass,
  ExternalLink,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Restaurant, RestaurantBounds } from '../types/restaurant.model';
import { getRestaurantDirectionsUrl } from '../utils/restaurant-links';
import { getMapViewportBounds, layoutMapMarkers } from '../utils/restaurant-map-layout';

const MIN_ZOOM_FACTOR = 0.05;
const MAX_ZOOM_FACTOR = 8;

export interface MapFallbackProps {
  items: Restaurant[];
  userLocation?: { lat: number; lng: number } | null;
  radiusM?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRadiusChange?: (radiusM: number) => void;
  onBoundsChange?: (bounds: RestaurantBounds | null) => void;
  onSearchThisArea?: () => void;
  canSearchThisArea?: boolean;
  isSearchingArea?: boolean;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function MapFallback({
  items,
  userLocation,
  radiusM = 5000,
  selectedId,
  onSelect,
  onRadiusChange,
  onBoundsChange,
  onSearchThisArea,
  canSearchThisArea = false,
  isSearchingArea = false,
  isLoading = false,
  emptyTitle,
  emptyDescription,
}: MapFallbackProps) {
  const [zoomFactor, setZoomFactor] = React.useState(1);
  const plotRef = React.useRef<HTMLDivElement>(null);
  const [plotSize, setPlotSize] = React.useState({ width: 600, height: 320 });
  const [openClusterId, setOpenClusterId] = React.useState<string | null>(null);
  React.useEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setPlotSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(plot);
    return () => observer.disconnect();
  }, []);
  const center = React.useMemo(() => {
    if (userLocation) return userLocation;
    const first = items.find((item) => item.hasCoordinates);
    return { lat: first?.lat ?? 10.7725, lng: first?.lng ?? 106.698 };
  }, [userLocation, items]);
  const validPlaces = items.filter((item) => item.hasCoordinates);
  const activeRestaurant = items.find((item) => item.id === selectedId);
  const viewport = React.useMemo(
    () => ({ center, radiusM, zoomFactor, ...plotSize }),
    [center, radiusM, zoomFactor, plotSize]
  );
  const plotted = layoutMapMarkers(
    validPlaces.flatMap((place) =>
      place.lat !== null && place.lng !== null
        ? [{ id: place.id, lat: place.lat, lng: place.lng }]
        : []
    ),
    viewport
  );
  const visibleCount = plotted.reduce((count, group) => count + group.members.length, 0);
  const openCluster = plotted.find((group) => group.id === openClusterId);
  React.useEffect(() => {
    onBoundsChange?.(getMapViewportBounds(viewport));
  }, [viewport, onBoundsChange]);
  const changeZoom = (zoom: number) => {
    setZoomFactor(zoom);
    setOpenClusterId(null);
  };
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`;

  return (
    <div
      className="relative flex size-full min-h-[440px] flex-col overflow-hidden rounded-2xl border bg-accent"
      role="region"
      aria-label="Sơ đồ vị trí tương đối của quán chay"
    >
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 600 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="600" height="720" fill="var(--accent)" />
        <rect x="55" y="150" width="135" height="180" rx="45" fill="var(--secondary)" />
        <rect x="370" y="440" width="190" height="160" rx="50" fill="var(--secondary)" />
        <path
          d="M-40 510 Q170 380 290 440 T650 240"
          fill="none"
          stroke="var(--primary)"
          strokeOpacity=".08"
          strokeWidth="65"
        />
        <g fill="none" stroke="var(--background)" strokeWidth="18" strokeLinecap="round">
          <path d="M-30 150 L660 420 M-30 350 L650 90 M80 -40 L410 760 M390 -40 L220 760 M-30 620 L650 560" />
          <path d="M0 270 L600 290 M0 490 L600 470" strokeWidth="9" />
        </g>
        <g fill="none" stroke="var(--border)" strokeWidth="1">
          <path d="M-30 150 L660 420 M-30 350 L650 90 M80 -40 L410 760 M390 -40 L220 760 M-30 620 L650 560" />
        </g>
      </svg>
      <div className="relative z-10 flex items-start justify-between gap-3 p-4">
        <div className="rounded-xl border bg-background px-3 py-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Compass className="size-4 text-primary" aria-hidden="true" />
            Quanh vị trí tìm kiếm
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`} ·{' '}
            {isLoading ? 'Đang tìm quán' : `${visibleCount}/${validPlaces.length} quán trong khung`}
          </p>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground" aria-live="polite">
            Mức phóng{' '}
            {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(1 / zoomFactor)}×
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border bg-background p-1">
          <Button asChild variant="ghost" size="icon" className="size-11 rounded-lg">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở khu vực trên Google Maps"
              title="Mở Google Maps"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-lg"
            onClick={() => changeZoom(1)}
            disabled={zoomFactor === 1}
            aria-label="Đặt lại mức phóng"
          >
            <LocateFixed className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-lg"
            onClick={() => changeZoom(Math.max(MIN_ZOOM_FACTOR, zoomFactor / 1.6))}
            disabled={zoomFactor <= MIN_ZOOM_FACTOR}
            aria-label="Phóng to"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-lg"
            onClick={() => changeZoom(Math.min(MAX_ZOOM_FACTOR, zoomFactor * 1.6))}
            disabled={zoomFactor >= MAX_ZOOM_FACTOR}
            aria-label="Thu nhỏ"
          >
            <Minus className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {onSearchThisArea && (
        <div className="relative z-10 flex justify-center px-4">
          <Button
            className="h-11 rounded-xl shadow-sm"
            onClick={onSearchThisArea}
            disabled={!canSearchThisArea}
            title={
              canSearchThisArea
                ? 'Tìm các quán trong vùng đang xem'
                : 'Phóng to hoặc thu nhỏ để chọn vùng'
            }
            aria-label="Tìm trong vùng đang xem trên bản đồ"
          >
            <Search className="size-4" aria-hidden="true" />
            {isSearchingArea ? 'Tìm lại vùng này' : 'Tìm trong vùng đang xem'}
          </Button>
        </div>
      )}
      <div ref={plotRef} className="relative z-10 min-h-[160px] flex-1 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          title="Tâm tìm kiếm"
        >
          <span className="flex size-10 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-sm">
            <Navigation className="size-4" aria-hidden="true" />
          </span>
          <span className="mt-1 rounded-md bg-background px-2 py-1 text-xs font-medium">
            Tâm tìm kiếm
          </span>
        </div>
        {plotted.map((group) => {
          const place = validPlaces.find((item) => item.id === group.members[0].id)!;
          const isCluster = group.members.length > 1;
          const isSelected = group.members.some((member) => member.id === selectedId);
          return (
            <Button
              key={group.id}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="icon"
              onClick={() => (isCluster ? setOpenClusterId(group.id) : onSelect?.(place.id))}
              className={cn(
                'absolute size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm focus-visible:ring-offset-2',
                isSelected
                  ? 'border-background ring-4 ring-primary/20'
                  : 'border-primary/20 bg-background text-primary'
              )}
              style={{
                left: group.x,
                top: group.y,
                zIndex: isSelected ? 20 : 10,
              }}
              aria-label={
                isCluster
                  ? `${group.members.length} quán gần nhau. Mở danh sách quán`
                  : `${place.name}, ${place.distanceLabel || 'lân cận'}`
              }
              aria-pressed={isCluster ? undefined : isSelected}
              aria-haspopup={isCluster ? 'dialog' : undefined}
              title={
                isCluster
                  ? `${group.members.length} quán gần nhau — bấm để chọn`
                  : `${place.name} · ${place.distanceLabel || 'Lân cận'}`
              }
            >
              {isCluster ? (
                <span className="flex flex-col items-center text-xs leading-tight">
                  <strong className="text-sm tabular-nums">{group.members.length}</strong>
                  <span className="text-[10px]">quán</span>
                </span>
              ) : (
                validPlaces.findIndex((item) => item.id === place.id) + 1
              )}
            </Button>
          );
        })}
        {!isLoading && validPlaces.length > 0 && visibleCount === 0 && (
          <div className="absolute inset-x-8 top-6 rounded-xl border bg-background p-4 text-center text-sm">
            Không có quán trong khung này. Thu nhỏ hoặc đặt lại mức phóng để xem các quán.
          </div>
        )}
        {isLoading && (
          <div
            className="absolute inset-x-6 top-1/3 rounded-2xl border bg-background p-5 text-center shadow-sm"
            role="status"
          >
            <p className="text-sm font-semibold">Đang tìm quán chay quanh đây…</p>
            <Skeleton className="mx-auto mt-3 h-2 w-40 motion-reduce:animate-none" />
            <p className="mt-3 text-xs text-muted-foreground">
              Đang tải địa điểm theo vùng và bộ lọc bạn chọn.
            </p>
          </div>
        )}
        {!isLoading && validPlaces.length === 0 && (
          <div className="absolute inset-x-6 top-1/4 rounded-2xl border bg-background p-5 text-center">
            <MapPin className="mx-auto size-7 text-primary" aria-hidden="true" />
            <p className="mt-3 text-balance text-sm font-semibold">
              {emptyTitle ?? 'Chưa tìm thấy quán quanh đây'}
            </p>
            <p className="mt-2 text-pretty text-xs leading-relaxed text-muted-foreground">
              {emptyDescription ?? 'Thử mở rộng bán kính hoặc tìm ở khu vực khác.'}
            </p>
            {onRadiusChange && radiusM < 50000 && (
              <Button
                variant="outline"
                className="mt-4 h-11 rounded-xl"
                onClick={() => onRadiusChange(Math.min(radiusM * 2, 50000))}
              >
                Mở rộng bán kính
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="relative z-20 mx-4 mb-3 h-28 shrink-0">
        {activeRestaurant ? (
          <div className="flex h-full items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-sm">
            <div className="min-w-0">
              <Link
                href={`/restaurants/${activeRestaurant.id}`}
                className="line-clamp-1 text-sm font-semibold hover:text-primary"
              >
                {activeRestaurant.name}
              </Link>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {activeRestaurant.address}
              </p>
              {activeRestaurant.distanceLabel && (
                <p className="mt-1 text-xs font-medium text-primary">
                  {activeRestaurant.distanceLabel}
                </p>
              )}
            </div>
            <Button asChild className="h-11 shrink-0 rounded-xl" size="sm">
              <a
                href={getRestaurantDirectionsUrl(activeRestaurant)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chỉ đường
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        ) : (
          <p className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
            Chọn một ghim hoặc cụm số để xem quán.
          </p>
        )}
      </div>
      <p className="relative px-4 pb-4 text-center text-xs text-muted-foreground">
        Sơ đồ vị trí tương đối, không phải bản đồ đường phố.
      </p>
      <Dialog
        open={Boolean(openCluster)}
        onOpenChange={(open) => {
          if (!open) setOpenClusterId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {openCluster ? `${openCluster.members.length} quán gần nhau` : 'Các quán gần nhau'}
            </DialogTitle>
            <DialogDescription>
              Chọn một quán trong cụm để xem vị trí và chỉ đường. Bạn cũng có thể phóng to để tách
              các ghim.
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
            {openCluster?.members.map((member) => {
              const restaurant = validPlaces.find((item) => item.id === member.id)!;
              return (
                <Button
                  key={member.id}
                  variant="outline"
                  className="h-auto min-h-14 justify-start whitespace-normal py-3 text-left"
                  onClick={() => {
                    onSelect?.(member.id);
                    setOpenClusterId(null);
                  }}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">{restaurant.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {restaurant.distanceLabel}
                      {restaurant.distanceLabel && restaurant.address ? ' · ' : ''}
                      {restaurant.address}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
