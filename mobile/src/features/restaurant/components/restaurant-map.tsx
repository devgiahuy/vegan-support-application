import * as React from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Compass, ExternalLink, LocateFixed, MapPin, Minus, Navigation, Plus, Search } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { Restaurant, RestaurantBounds } from '../types/restaurant.model';
import { getMapViewportBounds, layoutMapMarkers } from '../utils/restaurant-map-layout';
import { MapBackdrop } from './map-backdrop';
import { MapClusterSheet } from './map-cluster-sheet';
import { SelectedRestaurantPanel } from './selected-restaurant-panel';

const MIN_ZOOM_FACTOR = 0.05;
const MAX_ZOOM_FACTOR = 8;
const MAX_RADIUS_M = 50000;

export interface RestaurantMapProps {
  items: Restaurant[];
  /** Tâm tìm kiếm (vị trí đã chọn, hoặc tâm mặc định khi chưa có vị trí). */
  center: { lat: number; lng: number };
  radiusM: number;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Chỉ truyền khi được phép nới bán kính (không ở chế độ tìm theo vùng đang xem). */
  onRadiusChange?: (radiusM: number) => void;
  /** Gọi mỗi khi khung nhìn đổi (tâm, bán kính, mức phóng, kích thước) — callback cần ổn định. */
  onBoundsChange: (bounds: RestaurantBounds | null) => void;
  onSearchThisArea: () => void;
  canSearchThisArea: boolean;
  isSearchingArea: boolean;
  /** Nội dung khi không có quán nào (đổi theo chế độ tìm hoặc khi tải lỗi). */
  emptyTitle?: string;
  emptyDescription?: string;
}

/** `1,5` thay vì `1.5`: tránh phụ thuộc `Intl` của Hermes. */
function formatZoom(zoomFactor: number): string {
  return String(Math.round((1 / zoomFactor) * 10) / 10).replace('.', ',');
}

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
 * Sơ đồ vị trí tương đối của quán chay — đồng bộ `map-fallback.tsx` của web (không phải bản đồ đường phố): thẻ
 * "Quanh vị trí tìm kiếm", nút mở Google Maps / đặt lại mức phóng / phóng to / thu nhỏ, nút "Tìm trong vùng đang xem",
 * ghim đánh số (gom cụm khi gần nhau, bấm cụm mở danh sách), thẻ quán đang chọn kèm "Chỉ đường".
 */
export function RestaurantMap({
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
}: RestaurantMapProps) {
  const colors = useIconColors();
  const { height: windowHeight } = useWindowDimensions();
  const [zoomFactor, setZoomFactor] = React.useState(1);
  const [plotSize, setPlotSize] = React.useState({ width: 320, height: 260 });
  const [openClusterId, setOpenClusterId] = React.useState<string | null>(null);

  const validPlaces = React.useMemo(() => items.filter((item) => item.lat !== null && item.lng !== null), [items]);
  const activeRestaurant = items.find((item) => item.id === selectedId) ?? null;
  const viewport = React.useMemo(() => ({ center, radiusM, zoomFactor, ...plotSize }), [center, radiusM, zoomFactor, plotSize]);
  const plotted = React.useMemo(
    () =>
      layoutMapMarkers(
        validPlaces.map((place) => ({ id: place.id, lat: place.lat as number, lng: place.lng as number })),
        viewport
      ),
    [validPlaces, viewport]
  );
  const visibleCount = plotted.reduce((count, group) => count + group.members.length, 0);
  const openCluster = plotted.find((group) => group.id === openClusterId) ?? null;
  const clusterMembers = React.useMemo(
    () => (openCluster ? openCluster.members.flatMap((member) => validPlaces.filter((place) => place.id === member.id)) : []),
    [openCluster, validPlaces]
  );

  React.useEffect(() => {
    onBoundsChange(getMapViewportBounds(viewport));
  }, [viewport, onBoundsChange]);

  const changeZoom = (next: number) => {
    setZoomFactor(next);
    setOpenClusterId(null);
  };
  const onPlotLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setPlotSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
    }
  };
  const radiusLabel = radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`;

  return (
    <View
      accessibilityLabel="Sơ đồ vị trí tương đối của quán chay"
      className="overflow-hidden rounded-2xl border border-border bg-accent"
      style={{ height: Math.max(480, Math.round(windowHeight * 0.65)) }}>
      <MapBackdrop />

      <View className="flex-row items-start justify-between gap-3 p-4">
        <View className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2">
          <View className="flex-row items-center gap-2">
            <Compass size={16} color={colors.primary} />
            <Text className="flex-1 text-sm font-semibold text-foreground">Quanh vị trí tìm kiếm</Text>
          </View>
          <Text className="mt-1 text-xs text-muted-foreground">
            {radiusLabel} · {isLoading ? 'Đang tìm quán' : `${visibleCount}/${validPlaces.length} quán trong khung`}
          </Text>
          <Text accessibilityLiveRegion="polite" className="mt-1 text-xs text-muted-foreground">
            Mức phóng {formatZoom(zoomFactor)}×
          </Text>
        </View>
        <View className="w-[100px] flex-row flex-wrap gap-1 rounded-xl border border-border bg-background p-1">
          <ToolButton label="Mở khu vực trên Google Maps" onPress={() => void Linking.openURL(googleMapsUrl)}>
            <ExternalLink size={16} color={colors.foreground} />
          </ToolButton>
          <ToolButton label="Đặt lại mức phóng" disabled={zoomFactor === 1} onPress={() => changeZoom(1)}>
            <LocateFixed size={16} color={colors.foreground} />
          </ToolButton>
          <ToolButton label="Phóng to" disabled={zoomFactor <= MIN_ZOOM_FACTOR} onPress={() => changeZoom(Math.max(MIN_ZOOM_FACTOR, zoomFactor / 1.6))}>
            <Plus size={16} color={colors.foreground} />
          </ToolButton>
          <ToolButton label="Thu nhỏ" disabled={zoomFactor >= MAX_ZOOM_FACTOR} onPress={() => changeZoom(Math.min(MAX_ZOOM_FACTOR, zoomFactor * 1.6))}>
            <Minus size={16} color={colors.foreground} />
          </ToolButton>
        </View>
      </View>

      <View className="items-center px-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tìm trong vùng đang xem trên bản đồ"
          accessibilityState={{ disabled: !canSearchThisArea }}
          disabled={!canSearchThisArea}
          onPress={onSearchThisArea}
          className={cn('h-11 flex-row items-center gap-2 rounded-xl bg-primary px-5 shadow-sm active:opacity-90', canSearchThisArea ? '' : 'opacity-50')}>
          <Search size={16} color={colors.primaryForeground} />
          <Text className="text-sm font-semibold text-primary-foreground">{isSearchingArea ? 'Tìm lại vùng này' : 'Tìm trong vùng đang xem'}</Text>
        </Pressable>
      </View>

      <View onLayout={onPlotLayout} className="relative min-h-[300px] flex-1 overflow-hidden">
        <View pointerEvents="none" accessibilityLabel="Tâm tìm kiếm" className="absolute items-center" style={{ left: plotSize.width / 2 - 20, top: plotSize.height / 2 - 20, width: 40 }}>
          <View className="size-10 items-center justify-center rounded-full border-4 border-background bg-primary shadow-sm">
            <Navigation size={16} color={colors.primaryForeground} />
          </View>
        </View>

        {plotted.map((group) => {
          const place = validPlaces.find((item) => item.id === group.members[0]!.id)!;
          const isCluster = group.members.length > 1;
          const isSelected = group.members.some((member) => member.id === selectedId);
          const number = items.findIndex((item) => item.id === place.id) + 1;
          return (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              accessibilityLabel={isCluster ? `${group.members.length} quán gần nhau. Mở danh sách quán` : `${place.name}, ${place.distanceLabel || 'lân cận'}`}
              accessibilityState={isCluster ? undefined : { selected: isSelected }}
              onPress={() => (isCluster ? setOpenClusterId(group.id) : onSelect(place.id))}
              className={cn(
                'absolute size-11 items-center justify-center rounded-full border-2 shadow-sm',
                isSelected ? 'border-background bg-primary' : 'border-primary/20 bg-background'
              )}
              style={{ left: group.x - 22, top: group.y - 22, zIndex: isSelected ? 20 : 10 }}>
              {isCluster ? (
                <View className="items-center">
                  <Text className={cn('text-sm font-bold leading-4', isSelected ? 'text-primary-foreground' : 'text-primary')}>{group.members.length}</Text>
                  <Text className={cn('text-[10px] leading-3', isSelected ? 'text-primary-foreground' : 'text-primary')}>quán</Text>
                </View>
              ) : (
                <Text className={cn('text-sm font-semibold', isSelected ? 'text-primary-foreground' : 'text-primary')}>{number}</Text>
              )}
            </Pressable>
          );
        })}

        {/* Các thẻ trạng thái nằm trong lớp phủ kín khung: thẻ tự co giãn theo nội dung nên không bị cắt chữ trên Android. */}
        {!isLoading && validPlaces.length > 0 && visibleCount === 0 ? (
          <View pointerEvents="box-none" className="absolute inset-0 justify-start px-8 pt-6">
            <View className="rounded-xl border border-border bg-background p-4">
              <Text className="text-center text-sm text-foreground">Không có quán trong khung này. Thu nhỏ hoặc đặt lại mức phóng để xem các quán.</Text>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View pointerEvents="none" className="absolute inset-0 justify-center px-6">
            <View accessibilityRole="progressbar" className="items-center rounded-2xl border border-border bg-background p-5">
              <Text className="text-sm font-semibold text-foreground">Đang tìm quán chay quanh đây…</Text>
              <ActivityIndicator className="mt-3" color={colors.primary} />
              <Text className="mt-3 text-center text-xs text-muted-foreground">Đang tải địa điểm theo vùng và bộ lọc bạn chọn.</Text>
            </View>
          </View>
        ) : null}

        {!isLoading && validPlaces.length === 0 ? (
          <View pointerEvents="box-none" className="absolute inset-0 justify-center px-6">
            <View className="items-center rounded-2xl border border-border bg-background p-5">
              <MapPin size={28} color={colors.primary} />
              <Text className="mt-3 text-center text-sm font-semibold text-foreground">{emptyTitle ?? 'Chưa tìm thấy quán quanh đây'}</Text>
              <Text className="mt-2 text-center text-xs leading-5 text-muted-foreground">{emptyDescription ?? 'Thử mở rộng bán kính hoặc tìm ở khu vực khác.'}</Text>
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

      <View className="mx-4 mb-3">
        <SelectedRestaurantPanel restaurant={activeRestaurant} />
      </View>
      <Text className="px-4 pb-4 text-center text-xs text-muted-foreground">Sơ đồ vị trí tương đối, không phải bản đồ đường phố.</Text>

      {openCluster && clusterMembers.length > 0 ? (
        <MapClusterSheet
          members={clusterMembers}
          onClose={() => setOpenClusterId(null)}
          onSelect={(id) => {
            onSelect(id);
            setOpenClusterId(null);
          }}
        />
      ) : null}
    </View>
  );
}
