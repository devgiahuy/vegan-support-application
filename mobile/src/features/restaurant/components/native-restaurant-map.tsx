import * as React from 'react';
import { Text, View, type NativeSyntheticEvent } from 'react-native';
import {
  Camera,
  Map as MapLibreMap,
  Marker,
  type CameraRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';

import { MAP_STYLE_URL } from '@/lib/env';
import { cn } from '@/lib/utils';
import { buildMapPins, zoomForRadius } from '../utils/map-pins';
import { MapFrame, useSearchHere } from './map-frame';
import type { RestaurantMapProps } from './restaurant-map-types';

const MIN_ZOOM = 3;
const MAX_ZOOM = 19;

/**
 * Bản đồ MapLibre native (cần development build, không chạy trong Expo Go). Luôn hiển thị, kể cả khi chưa có vị trí người
 * dùng (tâm mặc định). Chỉ vẽ ghim cho quán nội bộ đã duyệt — quán từ nhà cung cấp bên ngoài vẫn có trong danh sách bên
 * dưới. Kéo bản đồ không gọi backend: người dùng phải bấm "Tìm trong vùng đang xem" để tránh tốn lượt gọi nhà cung cấp.
 */
export function NativeRestaurantMap({
  items,
  center,
  radiusM,
  hasLocation,
  isEmpty,
  selectedId,
  onSelect,
  onRadiusChange,
  onSearchHere,
  onUseMyLocation,
  locating,
}: RestaurantMapProps) {
  const cameraRef = React.useRef<CameraRef>(null);
  const zoomRef = React.useRef<number>(zoomForRadius(radiusM, center.lat));
  const searchHere = useSearchHere(center, onSearchHere);

  const pins = React.useMemo(() => buildMapPins(items), [items]);
  const selectedRestaurant = React.useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );
  const initialZoom = React.useMemo(() => zoomForRadius(radiusM, center.lat), [radiusM, center.lat]);

  // Đổi tâm hoặc bán kính tìm kiếm thì đưa camera về khu vực mới.
  React.useEffect(() => {
    zoomRef.current = initialZoom;
    cameraRef.current?.easeTo({ center: [center.lng, center.lat], zoom: initialZoom, duration: 600 });
  }, [center.lat, center.lng, initialZoom]);

  // Chọn quán ở danh sách thì bay tới ghim tương ứng (nếu quán đó có ghim).
  React.useEffect(() => {
    const pin = pins.find((item) => item.id === selectedId);
    if (pin) cameraRef.current?.flyTo({ center: [pin.lng, pin.lat], duration: 600 });
  }, [selectedId, pins]);

  const onRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { center: next, zoom, userInteraction } = event.nativeEvent;
    zoomRef.current = zoom;
    if (userInteraction) searchHere.onUserMoved(next[1], next[0]);
  };

  const zoomBy = (delta: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current + delta));
    zoomRef.current = next;
    cameraRef.current?.zoomTo(next, { duration: 300 });
  };

  return (
    <MapFrame
      radiusM={radiusM}
      pinCount={pins.length}
      hiddenCount={items.length - pins.length}
      hasLocation={hasLocation}
      isEmpty={isEmpty}
      selectedRestaurant={selectedRestaurant}
      searchHere={searchHere}
      onZoom={zoomBy}
      onLocate={onUseMyLocation}
      locating={locating}
      onRadiusChange={onRadiusChange}>
      <MapLibreMap style={{ flex: 1 }} mapStyle={MAP_STYLE_URL} compass={false} onRegionDidChange={onRegionDidChange}>
        <Camera
          initialViewState={{ center: [center.lng, center.lat], zoom: initialZoom }}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          ref={cameraRef}
        />

        {hasLocation ? (
          <Marker id="search-center" lngLat={[center.lng, center.lat]}>
            <View className="h-4 w-4 rounded-full border-2 border-white bg-blue-500" />
          </Marker>
        ) : null}

        {pins.map((pin) => {
          const selected = pin.id === selectedId;
          return (
            <Marker key={pin.id} id={pin.id} lngLat={[pin.lng, pin.lat]} onPress={() => onSelect(pin.id)}>
              <View
                className={cn(
                  'h-7 w-7 items-center justify-center rounded-full border-2 border-white',
                  selected ? 'bg-cta' : 'bg-primary'
                )}>
                <Text className="text-[11px] font-bold text-white">{pin.label}</Text>
              </View>
            </Marker>
          );
        })}
      </MapLibreMap>
    </MapFrame>
  );
}
