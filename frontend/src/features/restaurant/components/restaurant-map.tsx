'use client';

import * as React from 'react';
import type { Restaurant } from '../types/restaurant.model';
import { useGoogleMaps } from './use-google-maps';
import { MapFallback } from './map-fallback';

export interface RestaurantMapProps {
  items: Restaurant[];
  userLocation?: { lat: number; lng: number } | null;
  radiusM?: number;
  selectedId?: string | null;
  onSelectRestaurant?: (id: string) => void;
  onRadiusChange?: (radiusM: number) => void;
}

/**
 * Bản đồ tương tác Google Maps kèm cơ chế suy giảm êm dịu (EC-05):
 * - Khi có Google Maps SDK hợp lệ: khởi tạo map, render marker, pan to & highlight marker được chọn.
 * - Khi không có SDK, API key không hợp lệ, hoặc lỗi mạng: tự động fallback sang `MapFallback` độc lập, không crash và luôn có UI trực quan.
 */
export function RestaurantMap({
  items,
  userLocation,
  radiusM = 5000,
  selectedId,
  onSelectRestaurant,
  onRadiusChange,
}: RestaurantMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const [hasMapError, setHasMapError] = React.useState(false);
  const googleMapInstance = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<google.maps.Marker[]>([]);

  // Tọa độ trung tâm: lấy vị trí người dùng, hoặc quán đầu tiên có tọa độ, hoặc mặc định Bến Thành (TP.HCM)
  const center = React.useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) return userLocation;
    const firstWithCoords = items.find((i) => i.lat !== null && i.lng !== null);
    if (firstWithCoords?.lat && firstWithCoords?.lng) {
      return { lat: firstWithCoords.lat, lng: firstWithCoords.lng };
    }
    return { lat: 10.7725, lng: 106.698 };
  }, [userLocation, items]);

  // Khởi tạo Google Map an toàn khi SDK tải xong
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
      // Khi Google Maps script hoặc container DOM bị lỗi (vd: billing, quota, observer error)
      setHasMapError(true);
    }
  }, [isLoaded, center, hasMapError]);

  // Vẽ các Markers lên bản đồ Google Maps
  React.useEffect(() => {
    if (
      !isLoaded ||
      !googleMapInstance.current ||
      typeof window.google === 'undefined' ||
      hasMapError
    )
      return;

    try {
      // Xóa markers cũ
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const map = googleMapInstance.current;

      // Marker vị trí người dùng nếu có
      if (userLocation?.lat && userLocation?.lng) {
        const userMarker = new window.google.maps.Marker({
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
        });
        markersRef.current.push(userMarker);
      }

      // Markers các quán chay
      items.forEach((restaurant) => {
        if (restaurant.lat === null || restaurant.lng === null) return;
        const isSelected = restaurant.id === selectedId;
        const marker = new window.google.maps.Marker({
          position: { lat: restaurant.lat, lng: restaurant.lng },
          map,
          title: restaurant.name,
          animation: isSelected ? window.google.maps.Animation.BOUNCE : undefined,
        });

        marker.addListener('click', () => {
          onSelectRestaurant?.(restaurant.id);
        });

        markersRef.current.push(marker);
      });
    } catch {
      setHasMapError(true);
    }
  }, [isLoaded, items, userLocation, selectedId, onSelectRestaurant, hasMapError]);

  // Nếu SDK lỗi, chưa cấu hình API key, hoặc Google Map runtime crash -> Kích hoạt Fallback trực quan
  if (loadError || !isLoaded || hasMapError) {
    return (
      <MapFallback
        items={items}
        userLocation={userLocation}
        radiusM={radiusM}
        selectedId={selectedId}
        onSelect={onSelectRestaurant}
        onRadiusChange={onRadiusChange}
      />
    );
  }

  return (
    <div className="relative size-full min-h-[400px] overflow-hidden rounded-2xl border bg-muted/20">
      <div ref={mapRef} className="size-full" />
    </div>
  );
}
