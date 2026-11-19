import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  type CameraRef,
  type GeoJSONSourceRef,
  type MapRef,
  type PressEventWithFeatures,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { Compass, LocateFixed, MapPin, Minus, Plus, Search } from 'lucide-react-native';

import { MAP_STYLE_URL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { RestaurantBounds } from '../types/restaurant.model';
import {
  CLUSTER_MAX_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  areRestaurantBoundsEqual,
  clampZoom,
  collectAttributions,
  countInBounds,
  radiusFitBounds,
  restaurantRadiusPolygon,
  shouldListCluster,
  toRestaurantBounds,
  toRestaurantMapData,
  toSelectedMapData,
  type LngLatTuple,
} from '../utils/restaurant-street-map';
import { MapClusterSheet } from './map-cluster-sheet';
import type { RestaurantMapProps } from './restaurant-map.types';
import { SelectedRestaurantPanel } from './selected-restaurant-panel';

/** Bản đồ nền sáng ở cả chế độ tối, nên màu ghim cố định để luôn đủ tương phản. */
const PIN = {
  ink: '#1a2e1f',
  primary: '#2e7d32',
  white: '#ffffff',
} as const;

const MAX_RADIUS_M = 50000;
const LOAD_TIMEOUT_MS = 15_000;
const FIT_PADDING = { top: 90, right: 56, bottom: 90, left: 40 } as const;
const LEAVES_LIMIT = 50;

type StreetMapProps = RestaurantMapProps & {
  /** Gọi khi bản đồ không tải được để màn hình chuyển sang sơ đồ dự phòng. */
  onUnavailable: () => void;
};

function ToolButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      className={cn('size-11 items-center justify-center rounded-lg active:bg-muted', disabled ? 'opacity-40' : '')}>
      {children}
    </Pressable>
  );
}

/**
 * Bản đồ đường phố thật của quán chay (MapLibre + style trong `EXPO_PUBLIC_MAP_STYLE_URL`, ví dụ OpenFreeMap).
 * Cùng hợp đồng props với sơ đồ dự phòng: ghim đánh số theo thứ tự danh sách, gom cụm, vùng bán kính tìm kiếm,
 * "Tìm trong vùng đang xem" dùng đúng khung đang hiển thị. Chỉ nạp trong bản dựng native (không chạy trong Expo Go).
 */
export function RestaurantStreetMap({
  items,
  center,
  radiusM,
  isLoading,
  selectedId,
  onSelect,
  onRadiusChange,
  onBoundsChange,
  onSearchThisArea,
  canSearchThisArea,
  isSearchingArea,
  emptyTitle,
  emptyDescription,
  onUnavailable,
}: StreetMapProps) {
  const colors = useIconColors();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = React.useRef<MapRef>(null);
  const cameraRef = React.useRef<CameraRef>(null);
  const sourceRef = React.useRef<GeoJSONSourceRef>(null);
  const lastBoundsRef = React.useRef<RestaurantBounds | null>(null);
  const [ready, setReady] = React.useState(false);
  const [zoom, setZoom] = React.useState<number | null>(null);
  const [viewBounds, setViewBounds] = React.useState<RestaurantBounds | null>(null);
  const [clusterIds, setClusterIds] = React.useState<string[] | null>(null);

  const onBoundsChangeRef = React.useRef(onBoundsChange);
  const onUnavailableRef = React.useRef(onUnavailable);
  React.useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onUnavailableRef.current = onUnavailable;
  }, [onBoundsChange, onUnavailable]);

  const points = React.useMemo(() => toRestaurantMapData(items), [items]);
  const selectedPoints = React.useMemo(() => toSelectedMapData(items, selectedId), [items, selectedId]);
  const radiusArea = React.useMemo(() => restaurantRadiusPolygon(center, radiusM), [center, radiusM]);
  const centerPoint = React.useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'Point' as const, coordinates: [center.lng, center.lat] as LngLatTuple },
    }),
    [center]
  );
  const fitBounds = React.useMemo(() => radiusFitBounds(center, radiusM), [center, radiusM]);
  const activeRestaurant = items.find((item) => item.id === selectedId) ?? null;
  const attributions = React.useMemo(() => collectAttributions(items), [items]);
  const placeCount = points.features.length;
  const visibleCount = countInBounds(items, viewBounds);
  const clusterMembers = React.useMemo(
    () => (clusterIds ? items.filter((item) => clusterIds.includes(item.id)) : []),
    [clusterIds, items]
  );

  const reportBounds = React.useCallback((raw: readonly number[] | null | undefined) => {
    const next = toRestaurantBounds(raw);
    if (areRestaurantBoundsEqual(lastBoundsRef.current, next)) return;
    lastBoundsRef.current = next;
    setViewBounds(next);
    onBoundsChangeRef.current(next);
  }, []);

  // Style không tải được (mất mạng, URL sai) thì chuyển sang sơ đồ dự phòng thay vì để khung trắng.
  React.useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => onUnavailableRef.current(), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  // Đổi vị trí hoặc bán kính tìm kiếm → thu phóng lại vừa vùng tìm. Lần đầu đã được `initialViewState` xử lý.
  const firstFit = React.useRef(true);
  React.useEffect(() => {
    if (firstFit.current) {
      firstFit.current = false;
      return;
    }
    setClusterIds(null);
    cameraRef.current?.fitBounds(fitBounds, { padding: FIT_PADDING, duration: 400 });
  }, [fitBounds]);

  const handleLoaded = React.useCallback(async () => {
    setReady(true);
    try {
      const [bounds, currentZoom] = await Promise.all([mapRef.current?.getBounds(), mapRef.current?.getZoom()]);
      reportBounds(bounds);
      if (typeof currentZoom === 'number') setZoom(currentZoom);
    } catch {
      // Khung nhìn sẽ được cập nhật ở lần di chuyển bản đồ đầu tiên.
    }
  }, [reportBounds]);

  const handleRegionChange = React.useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { bounds, zoom: nextZoom } = event.nativeEvent;
      setZoom(nextZoom);
      reportBounds(bounds);
    },
    [reportBounds]
  );

  const handlePointsPress = React.useCallback(
    async (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      const feature = event.nativeEvent.features[0];
      if (!feature) return;
      const properties = (feature.properties ?? {}) as Record<string, unknown>;
      if (properties.cluster) {
        const clusterId = Number(properties.cluster_id);
        if (!Number.isFinite(clusterId)) return;
        try {
          const expansionZoom = await sourceRef.current?.getClusterExpansionZoom(clusterId);
          if (expansionZoom === undefined) return;
          if (shouldListCluster(expansionZoom)) {
            const leaves = await sourceRef.current?.getClusterLeaves(clusterId, LEAVES_LIMIT, 0);
            const ids = (leaves ?? [])
              .map((leaf) => (leaf.properties as Record<string, unknown> | null)?.id)
              .filter((id): id is string => typeof id === 'string');
            if (ids.length > 0) setClusterIds(ids);
            return;
          }
          const geometry = feature.geometry;
          if (geometry.type === 'Point') {
            cameraRef.current?.easeTo({
              center: geometry.coordinates as LngLatTuple,
              zoom: clampZoom(expansionZoom),
              duration: 350,
            });
          }
        } catch {
          // Cụm vừa được tính lại (đang phóng/thu): bỏ qua lần chạm này.
        }
        return;
      }
      if (typeof properties.id === 'string') onSelect(properties.id);
    },
    [onSelect]
  );

  const changeZoom = (delta: number) => {
    const base = zoom ?? 13;
    cameraRef.current?.zoomTo(clampZoom(base + delta), { duration: 250 });
  };
  const recenter = () => {
    setClusterIds(null);
    cameraRef.current?.fitBounds(fitBounds, { padding: FIT_PADDING, duration: 400 });
  };

  const radiusLabel = radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`;
  const showEmpty = ready && !isLoading && placeCount === 0;

  return (
    <View
      accessibilityLabel="Bản đồ đường phố các quán chay"
      className="overflow-hidden rounded-2xl border border-border bg-accent"
      style={{ height: Math.max(480, Math.round(windowHeight * 0.65)) }}>
      <View className="flex-1">
        <MapLibreMap
          ref={mapRef}
          style={{ flex: 1 }}
          mapStyle={MAP_STYLE_URL}
          // Trong ScrollView, bề mặt `texture` hiển thị đúng cùng các lớp nút phủ lên và không bị cắt sai vùng cuộn.
          androidView="texture"
          logo={false}
          compass={false}
          attributionPosition={{ left: 8, bottom: 8 }}
          onDidFinishLoadingMap={() => void handleLoaded()}
          onDidFailLoadingMap={() => onUnavailableRef.current()}
          onRegionDidChange={handleRegionChange}>
          <Camera
            ref={cameraRef}
            minZoom={MAP_MIN_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
            initialViewState={{ bounds: fitBounds, padding: FIT_PADDING }}
          />

          <GeoJSONSource id="restaurant-radius" data={radiusArea}>
            <Layer
              id="restaurant-radius-fill"
              type="fill"
              paint={{ 'fill-color': PIN.primary, 'fill-opacity': 0.06 }}
            />
            <Layer
              id="restaurant-radius-line"
              type="line"
              paint={{ 'line-color': PIN.primary, 'line-width': 1.5, 'line-opacity': 0.7, 'line-dasharray': [3, 3] }}
            />
          </GeoJSONSource>

          <GeoJSONSource
            ref={sourceRef}
            id="restaurant-points"
            data={points}
            cluster
            clusterRadius={48}
            clusterMaxZoom={CLUSTER_MAX_ZOOM}
            onPress={(event) => void handlePointsPress(event)}>
            <Layer
              id="restaurant-clusters"
              type="circle"
              filter={['has', 'point_count']}
              paint={{
                'circle-color': PIN.ink,
                'circle-radius': 22,
                'circle-stroke-color': PIN.white,
                'circle-stroke-width': 3,
              }}
            />
            <Layer
              id="restaurant-cluster-count"
              type="symbol"
              filter={['has', 'point_count']}
              layout={{
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['Noto Sans Bold'],
                'text-size': 13,
                'text-allow-overlap': true,
              }}
              paint={{ 'text-color': PIN.white }}
            />
            {/* Vùng chạm 44dp quanh mỗi ghim (vòng tròn trong suốt bán kính 22). */}
            <Layer
              id="restaurant-point-hits"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{ 'circle-radius': 22, 'circle-opacity': 0 }}
            />
            <Layer
              id="restaurant-point-dots"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={{
                'circle-color': PIN.white,
                'circle-radius': 14,
                'circle-stroke-color': PIN.primary,
                'circle-stroke-width': 2.5,
              }}
            />
            <Layer
              id="restaurant-point-numbers"
              type="symbol"
              filter={['!', ['has', 'point_count']]}
              layout={{
                'text-field': ['to-string', ['get', 'position']],
                'text-font': ['Noto Sans Bold'],
                'text-size': 12,
                'text-allow-overlap': true,
              }}
              paint={{ 'text-color': PIN.ink }}
            />
          </GeoJSONSource>

          <GeoJSONSource id="restaurant-selection" data={selectedPoints}>
            <Layer
              id="restaurant-selected-dot"
              type="circle"
              paint={{
                'circle-color': PIN.primary,
                'circle-radius': 18,
                'circle-stroke-color': PIN.white,
                'circle-stroke-width': 3,
              }}
            />
            <Layer
              id="restaurant-selected-number"
              type="symbol"
              layout={{
                'text-field': ['to-string', ['get', 'position']],
                'text-font': ['Noto Sans Bold'],
                'text-size': 13,
                'text-allow-overlap': true,
              }}
              paint={{ 'text-color': PIN.white }}
            />
          </GeoJSONSource>

          <GeoJSONSource id="restaurant-center" data={centerPoint}>
            <Layer
              id="restaurant-center-dot"
              type="circle"
              paint={{
                'circle-color': '#2563eb',
                'circle-radius': 7,
                'circle-stroke-color': PIN.white,
                'circle-stroke-width': 3,
              }}
            />
          </GeoJSONSource>
        </MapLibreMap>

        <View pointerEvents="box-none" className="absolute inset-x-0 top-0 flex-row items-start justify-between gap-3 p-3">
          <View pointerEvents="none" className="min-w-0 flex-1 rounded-xl border border-border bg-background/95 px-3 py-2">
            <View className="flex-row items-center gap-2">
              <Compass size={16} color={colors.primary} />
              <Text className="flex-1 text-sm font-semibold text-foreground">Quanh vị trí tìm kiếm</Text>
            </View>
            <Text className="mt-1 text-xs text-muted-foreground">
              {radiusLabel} · {isLoading ? 'Đang tìm quán' : `${visibleCount}/${placeCount} quán trong khung`}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-1 rounded-xl border border-border bg-background/95 p-1" style={{ width: 56 }}>
            <ToolButton label="Phóng to" disabled={zoom !== null && zoom >= MAP_MAX_ZOOM} onPress={() => changeZoom(1)}>
              <Plus size={18} color={colors.foreground} />
            </ToolButton>
            <ToolButton label="Thu nhỏ" disabled={zoom !== null && zoom <= MAP_MIN_ZOOM} onPress={() => changeZoom(-1)}>
              <Minus size={18} color={colors.foreground} />
            </ToolButton>
            <ToolButton label="Về vùng tìm kiếm" onPress={recenter}>
              <LocateFixed size={18} color={colors.foreground} />
            </ToolButton>
          </View>
        </View>

        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-9 items-center px-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tìm trong vùng đang xem trên bản đồ"
            accessibilityState={{ disabled: !canSearchThisArea }}
            disabled={!canSearchThisArea}
            onPress={onSearchThisArea}
            className={cn(
              'h-11 flex-row items-center gap-2 rounded-xl bg-primary px-5 shadow-sm active:opacity-90',
              canSearchThisArea ? '' : 'opacity-50'
            )}>
            <Search size={16} color={colors.primaryForeground} />
            <Text className="text-sm font-semibold text-primary-foreground">
              {isSearchingArea ? 'Tìm lại vùng này' : 'Tìm trong vùng đang xem'}
            </Text>
          </Pressable>
        </View>

        {!ready || isLoading ? (
          <View pointerEvents="none" className="absolute inset-x-0 top-24 items-center px-6">
            <View
              accessibilityRole="progressbar"
              className="flex-row items-center gap-2.5 rounded-xl border border-border bg-background px-4 py-2.5">
              <ActivityIndicator color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground">
                {ready ? 'Đang tìm quán chay quanh đây…' : 'Đang tải bản đồ…'}
              </Text>
            </View>
          </View>
        ) : null}

        {showEmpty ? (
          <View pointerEvents="box-none" className="absolute inset-x-0 top-24 items-center px-6">
            <View className="items-center rounded-2xl border border-border bg-background p-5">
              <MapPin size={26} color={colors.primary} />
              <Text className="mt-3 text-center text-sm font-semibold text-foreground">
                {emptyTitle ?? 'Chưa tìm thấy quán quanh đây'}
              </Text>
              <Text className="mt-2 text-center text-xs leading-5 text-muted-foreground">
                {emptyDescription ?? 'Thử mở rộng bán kính hoặc tìm ở khu vực khác.'}
              </Text>
              {onRadiusChange && radiusM < MAX_RADIUS_M ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onRadiusChange(Math.min(radiusM * 2, MAX_RADIUS_M))}
                  className="mt-4 h-11 items-center justify-center self-stretch rounded-xl border border-border px-4 active:bg-muted">
                  <Text className="text-sm font-semibold text-foreground">Mở rộng bán kính</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      <View className="mx-3 mt-2">
        <SelectedRestaurantPanel restaurant={activeRestaurant} />
      </View>
      <View className="gap-0.5 px-3 pb-3 pt-2">
        <Text className="text-center text-[11px] leading-4 text-muted-foreground">
          Bản đồ nền: OpenFreeMap © OpenMapTiles, dữ liệu OpenStreetMap.
        </Text>
        {attributions.length > 0 ? (
          <Text className="text-center text-[11px] leading-4 text-muted-foreground">Quán: {attributions.join(' · ')}</Text>
        ) : null}
      </View>

      {clusterIds && clusterMembers.length > 0 ? (
        <MapClusterSheet
          members={clusterMembers}
          onClose={() => setClusterIds(null)}
          onSelect={(id) => {
            onSelect(id);
            setClusterIds(null);
          }}
        />
      ) : null}
    </View>
  );
}
