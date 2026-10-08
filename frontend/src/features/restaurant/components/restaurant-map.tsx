'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Restaurant } from '../types/restaurant.model';
import type { RestaurantBounds } from '../types/restaurant.model';
import { areBoundsEqual } from '../utils/restaurant-bounds';
import { useGoogleMaps } from './use-google-maps';
import { MapFallback } from './map-fallback';

export interface RestaurantMapProps {
  items: Restaurant[];
  userLocation?: { lat: number; lng: number } | null;
  radiusM?: number;
  selectedId?: string | null;
  onSelectRestaurant?: (id: string) => void;
  onRadiusChange?: (radiusM: number) => void;
  /**
   * Báo khung vùng đang xem mỗi khi người dùng ngừng kéo/thu phóng.
   * Parent PHẢI lưu vào ref, tuyệt đối không nối vào `queryKey` — nếu không, mỗi cử chỉ kéo
   * chuột sẽ phát sinh một request mới (vi phạm SC-011).
   */
  onBoundsChange?: (bounds: RestaurantBounds | null) => void;
  /** Người dùng bấm nút "Tìm trong vùng đang xem". */
  onSearchThisArea?: () => void;
  /** Đã có khung vùng để tìm hay chưa — dùng để vô hiệu hoá nút, tránh bấm không có phản hồi. */
  canSearchThisArea?: boolean;
  /** Đang ở chế độ tìm theo vùng → hiện nút quay lại tìm lân cận. */
  isSearchingArea?: boolean;
}

/**
 * Bản đồ tương tác Google Maps kèm cơ chế suy giảm êm dịm:
 * - Có SDK hợp lệ: khởi tạo map, render marker, bám theo quán được chọn.
 * - Thiếu API key / lỗi mạng / lỗi runtime: tự chuyển sang `MapFallback`, không để trống.
 */
export function RestaurantMap({
  items,
  userLocation,
  radiusM = 5000,
  selectedId,
  onSelectRestaurant,
  onRadiusChange,
  onBoundsChange,
  onSearchThisArea,
  canSearchThisArea = true,
  isSearchingArea = false,
}: RestaurantMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const [hasMapError, setHasMapError] = React.useState(false);
  const googleMapInstance = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<google.maps.Marker[]>([]);
  const radiusCircleRef = React.useRef<google.maps.Circle | null>(null);
  const lastBoundsRef = React.useRef<RestaurantBounds | null>(null);

  const handleSelect = React.useCallback(
    (id: string) => {
      onSelectRestaurant?.(id);
    },
    [onSelectRestaurant]
  );

  // Tâm bản đồ: vị trí người dùng → quán đầu tiên có tọa độ → mặc định Bến Thành.
  const center = React.useMemo(() => {
    if (userLocation?.lat !== undefined && userLocation?.lng !== undefined) {
      return userLocation;
    }
    const firstWithCoords = items.find((item) => item.hasCoordinates);
    if (firstWithCoords?.lat !== null && firstWithCoords?.lat !== undefined) {
      return { lat: firstWithCoords.lat, lng: firstWithCoords.lng ?? 0 };
    }
    return { lat: 10.7725, lng: 106.698 };
  }, [userLocation, items]);

  // Khởi tạo Google Map an toàn khi SDK tải xong.
  React.useEffect(() => {
    if (!isLoaded || !mapRef.current || typeof window.google === 'undefined' || hasMapError) return;

    try {
      if (!googleMapInstance.current) {
        googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      } else {
        googleMapInstance.current.setCenter(center);
      }
    } catch {
      setHasMapError(true);
    }
  }, [isLoaded, center, hasMapError]);

  // Vẽ marker. Chỉ dựng marker cho quán có tọa độ hợp lệ.
  React.useEffect(() => {
    if (
      !isLoaded ||
      !googleMapInstance.current ||
      typeof window.google === 'undefined' ||
      hasMapError
    ) {
      return;
    }

    try {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const map = googleMapInstance.current;

      if (userLocation?.lat !== undefined && userLocation?.lng !== undefined) {
        markersRef.current.push(
          new window.google.maps.Marker({
            position: userLocation,
            map,
            title: 'Vị trí của bạn',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          })
        );
      }

      items.forEach((restaurant) => {
        if (!restaurant.hasCoordinates || restaurant.lat === null || restaurant.lng === null)
          return;
        const isSelected = restaurant.id === selectedId;
        const marker = new window.google.maps.Marker({
          position: { lat: restaurant.lat, lng: restaurant.lng },
          map,
          title: restaurant.name,
          zIndex: isSelected ? 100 : undefined,
        });
        marker.addListener('click', () => handleSelect(restaurant.id));
        markersRef.current.push(marker);
      });
    } catch {
      setHasMapError(true);
    }
  }, [isLoaded, items, userLocation, selectedId, handleSelect, hasMapError]);

  // Bám theo quán đang được chọn từ danh sách (đồng bộ hai chiều).
  React.useEffect(() => {
    if (!selectedId || !googleMapInstance.current || !isLoaded || hasMapError) return;
    const restaurant = items.find((item) => item.id === selectedId);
    if (!restaurant?.hasCoordinates || restaurant.lat === null || restaurant.lng === null) return;
    try {
      googleMapInstance.current.panTo({ lat: restaurant.lat, lng: restaurant.lng });
    } catch {
      // Bỏ qua lỗi panTo; không được phép làm hỏng vòng chọn quán.
    }
  }, [selectedId, items, isLoaded, hasMapError]);

  // Vẽ vòng tròn bán kính tìm kiếm để bản đồ phản ánh ranh giới khu vực đang tìm (FR-004),
  // giống hệt cách `MapFallback` hiển thị. Ở chế độ tìm theo vùng thì vòng bán kính không còn ý nghĩa.
  React.useEffect(() => {
    const map = googleMapInstance.current;
    if (!isLoaded || !map || typeof window.google === 'undefined' || hasMapError) return;
    if (!userLocation || userLocation.lat === undefined || userLocation.lng === undefined) return;
    if (isSearchingArea || radiusM <= 0) return;

    try {
      radiusCircleRef.current?.setMap(null);
      radiusCircleRef.current = new window.google.maps.Circle({
        map,
        center: userLocation,
        radius: radiusM,
        strokeColor: '#10b981',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: '#10b981',
        fillOpacity: 0.06,
        clickable: false,
        zIndex: 5,
      });
    } catch {
      // Không có thư viện drawing hoặc runtime lỗi: bỏ qua, marker vẫn phải hiển thị.
    }

    return () => {
      radiusCircleRef.current?.setMap(null);
      radiusCircleRef.current = null;
    };
  }, [isLoaded, hasMapError, userLocation, radiusM, isSearchingArea]);

  // Báo khung vùng đang xem khi người dùng ngừng tương tác. Chỉ gọi callback, KHÔNG refetch.
  React.useEffect(() => {
    const map = googleMapInstance.current;
    if (!isLoaded || !map || !onBoundsChange || hasMapError) return;

    const listener = map.addListener('idle', () => {
      try {
        const bounds = map.getBounds();
        if (!bounds) {
          if (lastBoundsRef.current !== null) {
            lastBoundsRef.current = null;
            onBoundsChange(null);
          }
          return;
        }
        const next: RestaurantBounds = {
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        };
        if (areBoundsEqual(lastBoundsRef.current, next)) return;
        lastBoundsRef.current = next;
        onBoundsChange(next);
      } catch {
        // Bỏ qua lỗi đọc bounds; không được phép làm hỏng vòng tương tác bản đồ.
      }
    });

    return () => {
      listener.remove();
    };
  }, [isLoaded, hasMapError, onBoundsChange]);

  if (loadError || !isLoaded || hasMapError) {
    return (
      <MapFallback
        items={items}
        userLocation={userLocation}
        radiusM={radiusM}
        selectedId={selectedId}
        onSelect={onSelectRestaurant}
        onRadiusChange={onRadiusChange}
        onBoundsChange={onBoundsChange}
        onSearchThisArea={onSearchThisArea}
        canSearchThisArea={canSearchThisArea}
        isSearchingArea={isSearchingArea}
      />
    );
  }

  return (
    <div className="relative size-full min-h-[400px] overflow-hidden rounded-2xl border bg-muted/20">
      <div ref={mapRef} className="size-full" />
      {onSearchThisArea && (
        <div className="absolute inset-x-0 top-3 flex justify-center px-3">
          <Button
            size="sm"
            className="gap-1.5 rounded-full shadow-lg"
            onClick={onSearchThisArea}
            disabled={!canSearchThisArea}
            title={
              canSearchThisArea
                ? 'Tìm các quán trong vùng bạn đang xem trên bản đồ'
                : 'Hãy kéo hoặc thu phóng bản đồ để chọn vùng cần tìm'
            }
            aria-label="Tìm trong vùng đang xem trên bản đồ"
          >
            <Search className="size-3.5" aria-hidden="true" />
            Tìm trong vùng đang xem
          </Button>
        </div>
      )}
    </div>
  );
}
