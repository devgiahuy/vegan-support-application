'use client';

import * as React from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Skeleton } from '@/components/ui/skeleton';
import type { Restaurant } from '../types/restaurant.model';
import { ensureMapsConfigured, importLibrary } from '../providers/maps-bootstrap';
import { MapPlaceholder } from './map-placeholder';

export interface RestaurantMapCenter {
  lat: number;
  lng: number;
}

interface RestaurantMapProps {
  items: Restaurant[];
  center: RestaurantMapCenter;
  selectedPlaceId: string | null;
  onSelect: (id: string) => void;
}

interface PlottedMarker {
  id: string;
  marker: google.maps.Marker;
}

const FALLBACK_ZOOM = 14;

/**
 * Bản đồ Google tương tác (thay MapPlaceholder khi có key — FR-001/FR-002):
 * marker đồng bộ cùng tập kết quả với danh sách, gom nhóm khi đông (FR-008),
 * chọn 2 chiều qua selectedPlaceId/onSelect. SDK lỗi/thiếu key → fallback
 * MapPlaceholder + danh sách đầy đủ (US-3). Chỉ animate transform/opacity của
 * overlay riêng; bản đồ dùng panTo, tắt khi giảm chuyển động (FR-012).
 */
export function RestaurantMap({ items, center, selectedPlaceId, onSelect }: RestaurantMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const plottedRef = React.useRef<PlottedMarker[]>([]);
  const clustererRef = React.useRef<MarkerClusterer | null>(null);
  const selectRef = React.useRef(onSelect);
  React.useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  const hasKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').length > 0;
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'failed'>(
    hasKey ? 'loading' : 'failed'
  );

  // Khởi tạo map 1 lần.
  React.useEffect(() => {
    if (!hasKey) return;
    let cancelled = false;
    async function init(): Promise<void> {
      try {
        ensureMapsConfigured();
        const { Map } = await importLibrary('maps');
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new Map(containerRef.current, {
          center,
          zoom: FALLBACK_ZOOM,
          gestureHandling: 'cooperative',
        });
        if (!cancelled) setStatus('ready');
      } catch (err) {
        console.error('[RestaurantMap] Lỗi khởi tạo Google Maps SDK:', err);
        if (!cancelled) setStatus('failed');
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey]);

  // Theo tâm khi vị trí đổi (tôn trọng giảm chuyển động).
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) map.setCenter(center);
    else map.panTo(center);
  }, [center]);

  // Dựng lại markers + cluster khi tập kết quả đổi.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    clustererRef.current?.clearMarkers();
    for (const plotted of plottedRef.current) plotted.marker.setMap(null);
    const plotted: PlottedMarker[] = [];
    for (const item of items) {
      if (item.lat === null || item.lng === null) continue;
      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        title: item.name,
      });
      const id = item.id;
      marker.addListener('click', () => selectRef.current(id));
      plotted.push({ id, marker });
    }
    plottedRef.current = plotted;
    clustererRef.current = new MarkerClusterer({
      map,
      markers: plotted.map((entry) => entry.marker),
    });
    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
      for (const entry of plotted) entry.marker.setMap(null);
      plottedRef.current = [];
    };
  }, [items, status]);

  // Nổi bật marker được chọn từ danh sách (không dựng lại markers).
  React.useEffect(() => {
    if (typeof google === 'undefined') return;
    for (const entry of plottedRef.current) {
      if (entry.id === selectedPlaceId) {
        entry.marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#2E7D32',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        });
      } else {
        entry.marker.setIcon(null);
      }
    }
  }, [selectedPlaceId, status]);

  if (!hasKey || status === 'failed') {
    return <MapPlaceholder items={items} />;
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-2xl border xl:h-[560px]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Bản đồ các quán chay"
      />
      {status === 'loading' && <Skeleton className="absolute inset-0 rounded-none" />}
    </div>
  );
}
