'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Layers,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DiscoveryNotice, Restaurant, RestaurantBounds } from '../types/restaurant.model';
import { getRestaurantDirectionsUrl } from '../utils/restaurant-links';
import { toRestaurantMapData } from '../utils/restaurant-map-data';
import { useRestaurantStreetMap } from './use-restaurant-street-map';

export interface RestaurantMapProps {
  items: Restaurant[];
  userLocation?: { lat: number; lng: number } | null;
  radiusM?: number;
  selectedId?: string | null;
  onSelectRestaurant?: (id: string) => void;
  onClearSelection?: () => void;
  onBoundsChange?: (bounds: RestaurantBounds | null) => void;
  onSearchThisArea?: () => void;
  canSearchThisArea?: boolean;
  isSearchingArea?: boolean;
  isLoading?: boolean;
  notices?: DiscoveryNotice[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function RestaurantMap({
  items,
  userLocation,
  radiusM = 5000,
  selectedId,
  onSelectRestaurant,
  onClearSelection,
  onBoundsChange,
  onSearchThisArea,
  canSearchThisArea = false,
  isSearchingArea = false,
  isLoading = false,
  notices = [],
  emptyTitle,
  emptyDescription,
}: RestaurantMapProps) {
  const [chooser, setChooser] = React.useState<string[] | null>(null);
  const center = userLocation ?? { lat: 10.7725, lng: 106.698 };
  const { containerRef, ready, error, tileWarning, retry, resetView } = useRestaurantStreetMap({
    items,
    center,
    radiusM,
    selectedId,
    isSearchingArea,
    onSelect: onSelectRestaurant,
    onClearSelection,
    onBoundsChange,
    onCluster: setChooser,
  });
  const validItems = toRestaurantMapData(items).features;
  const selected = items.find((item) => item.id === selectedId);
  const chosenItems = chooser ? items.filter((item) => chooser.includes(item.id)) : [];
  const warning = notices.find(
    (notice) => notice.kind === 'UNAVAILABLE' || notice.kind === 'SUPPRESSED'
  );
  const attribution = [
    ...new Set(
      items
        .filter((item) => item.isExternal)
        .map((item) => item.attribution)
        .filter(Boolean)
    ),
  ].join(' · ');

  return (
    <div
      className="restaurant-street-map relative size-full min-h-[440px] overflow-hidden rounded-2xl bg-muted"
      role="region"
      aria-label="Bản đồ đường phố các quán chay"
    >
      <div ref={containerRef} className="absolute inset-0" data-restaurant-street-map />
      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col gap-3 bg-muted p-5" role="status">
          <Skeleton className="h-10 w-48 motion-reduce:animate-none" />
          <Skeleton className="min-h-64 flex-1 motion-reduce:animate-none" />
          <p className="text-sm text-muted-foreground">Đang tải bản đồ đường phố…</p>
        </div>
      )}
      {error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background px-6 text-center"
          role="alert"
        >
          <MapPin className="size-8 text-muted-foreground" aria-hidden />
          <p className="max-w-sm text-pretty text-sm leading-relaxed">{error}</p>
          <Button variant="outline" onClick={retry}>
            <RefreshCw data-icon="inline-start" />
            Tải lại bản đồ
          </Button>
          <p className="text-xs text-muted-foreground">
            Bạn vẫn có thể xem danh sách quán và mở chỉ đường.
          </p>
        </div>
      )}
      {ready && (
        <>
          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-2 pr-14">
            <div className="max-w-full rounded-xl bg-background px-3 py-2 shadow-md">
              <p className="text-sm font-semibold tabular-nums">
                {validItems.length} quán trên bản đồ
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isLoading
                  ? 'Đang cập nhật quán…'
                  : 'Chạm cụm số để phóng to, chọn ghim để xem quán.'}
              </p>
            </div>
            <Button
              className="pointer-events-auto h-11 rounded-xl shadow-md"
              size="sm"
              onClick={onSearchThisArea}
              disabled={!canSearchThisArea || isLoading}
              aria-label="Tìm trong vùng đang xem trên bản đồ"
            >
              <Search data-icon="inline-start" />
              {isSearchingArea ? 'Tìm lại vùng này' : 'Tìm trong vùng đang xem'}
            </Button>
            {!canSearchThisArea && (
              <p className="rounded-lg bg-background px-2 py-1 text-xs text-muted-foreground shadow-sm">
                Phóng to để thu hẹp vùng tìm kiếm.
              </p>
            )}
          </div>
          <div className="absolute right-3 top-44 flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-11 bg-background shadow-sm"
              onClick={resetView}
              aria-label="Về vùng tìm kiếm"
              title="Về vùng tìm kiếm"
            >
              <LocateFixed />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-11 bg-background shadow-sm"
              onClick={() => setChooser(validItems.map((item) => item.properties.id))}
              disabled={validItems.length === 0}
              aria-label="Danh sách ghim trên bản đồ"
              title="Chọn quán bằng danh sách"
            >
              <Layers />
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-x-3 bottom-16 flex flex-col gap-2 pr-0">
            {(warning || tileWarning) && (
              <Alert className="pointer-events-auto bg-background py-2 shadow-sm">
                <AlertDescription
                  className="flex items-center justify-between gap-2 text-xs"
                  aria-label={warning?.message}
                >
                  <span>
                    {warning?.kind === 'UNAVAILABLE'
                      ? 'Một phần kết quả chưa tải được.'
                      : warning?.kind === 'SUPPRESSED'
                        ? 'Bộ lọc chỉ giữ quán đã được kiểm duyệt.'
                        : 'Một phần nền bản đồ chưa tải được.'}
                  </span>
                  {tileWarning && (
                    <Button variant="ghost" size="sm" onClick={retry}>
                      Tải lại nền
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {!isLoading && items.length === 0 && !warning && (
              <div className="rounded-xl bg-background p-3 shadow-sm" role="status">
                <p className="text-sm font-semibold">
                  {emptyTitle ?? 'Chưa có quán trong kết quả này'}
                </p>
                <p className="mt-1 text-pretty text-xs text-muted-foreground">
                  {emptyDescription ?? 'Di chuyển bản đồ rồi tìm lại trong vùng đang xem.'}
                </p>
              </div>
            )}
            {selected && (
              <div className="pointer-events-auto flex flex-col gap-2 rounded-xl bg-background p-3 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/restaurants/${selected.id}`}
                      className="line-clamp-2 text-sm font-semibold hover:underline"
                    >
                      {selected.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {selected.address}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={onClearSelection}
                    aria-label="Bỏ chọn quán"
                  >
                    <X />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs tabular-nums">
                    {selected.rating !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5" aria-hidden />
                        {selected.ratingLabel}
                      </span>
                    )}
                    {selected.distanceLabel && <span>{selected.distanceLabel}</span>}
                  </div>
                  <Button asChild size="sm" className="h-10">
                    <a
                      href={getRestaurantDirectionsUrl(selected)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chỉ đường
                      <ArrowUpRight data-icon="inline-end" />
                    </a>
                  </Button>
                </div>
                {selected.requiresDietaryWarning && (
                  <p className="text-xs text-muted-foreground">
                    Nhãn ăn chay chưa được kiểm duyệt. Hãy xác nhận với quán.
                  </p>
                )}
              </div>
            )}
            {attribution && (
              <p className="self-start rounded-md bg-background px-2 py-1 text-[11px] text-muted-foreground">
                Quán: {attribution}
              </p>
            )}
          </div>
        </>
      )}
      <Dialog
        open={chooser !== null}
        onOpenChange={(open) => {
          if (!open) setChooser(null);
        }}
      >
        <DialogContent
          className="max-h-[80dvh] overflow-y-auto sm:max-w-md"
          data-restaurant-cluster-dialog
        >
          <DialogHeader>
            <DialogTitle>Chọn quán trên bản đồ</DialogTitle>
            <DialogDescription>
              {chosenItems.length} quán trong kết quả tìm kiếm. Chọn một quán để định vị và xem chỉ
              đường.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            {chosenItems.map((item) => (
              <Button
                key={item.id}
                variant={item.id === selectedId ? 'secondary' : 'ghost'}
                className="h-auto min-h-12 justify-start gap-3 whitespace-normal py-3 text-left"
                onClick={() => {
                  onSelectRestaurant?.(item.id);
                  setChooser(null);
                }}
              >
                <MapPin className="shrink-0" aria-hidden />
                <span className="flex min-w-0 flex-col gap-1">
                  <span>{item.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {item.distanceLabel}
                    {item.distanceLabel ? ' · ' : ''}
                    {item.address}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
