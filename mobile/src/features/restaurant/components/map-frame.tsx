import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LocateFixed, MapPin, Minus, Plus, Search } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import type { Restaurant } from '../types/restaurant.model';
import { distanceMeters } from '../utils/map-pins';
import { MapStatusNotice } from './map-status-notice';
import { SelectedRestaurantPanel } from './selected-restaurant-panel';

/** Kéo bản đồ xa hơn ngưỡng này (mét) so với tâm hiện tại thì mới hiện nút "Tìm trong vùng đang xem". */
const SEARCH_HERE_THRESHOLD_M = 300;

/**
 * Theo dõi vùng người dùng kéo tới trên bản đồ (không gọi API) và cho biết khi nào nên hiện nút "Tìm trong vùng đang xem".
 * Kết quả kéo gắn với tâm lúc kéo nên tự mất hiệu lực khi tâm tìm kiếm đổi.
 */
export function useSearchHere(center: { lat: number; lng: number }, onSearchHere: (c: { lat: number; lng: number }) => void) {
  const [view, setView] = React.useState<{ lat: number; lng: number; anchor: string } | null>(null);
  const anchor = `${center.lat},${center.lng}`;
  const viewCenter = view?.anchor === anchor ? view : null;
  const visible =
    viewCenter !== null &&
    distanceMeters(center.lat, center.lng, viewCenter.lat, viewCenter.lng) > SEARCH_HERE_THRESHOLD_M;

  return {
    visible,
    /** Gọi khi người dùng kéo bản đồ xong. */
    onUserMoved: (lat: number, lng: number) => setView({ lat, lng, anchor }),
    onPress: () => {
      if (viewCenter) onSearchHere({ lat: viewCenter.lat, lng: viewCenter.lng });
    },
  };
}

/**
 * Khung chung quanh bề mặt bản đồ (MapLibre trong WebView hoặc radar). TRONG bản đồ chỉ có nút định vị và nút phóng/thu
 * (`showZoom`); mọi ghi chú, nút "Tìm trong vùng đang xem" và thẻ quán đang chọn nằm bên dưới để không che bản đồ.
 */
export function MapFrame({
  radiusM,
  pinCount,
  hiddenCount,
  hasLocation,
  isEmpty,
  selectedRestaurant,
  searchHere,
  showZoom = true,
  onZoom,
  onLocate,
  locating,
  onRadiusChange,
  children,
}: {
  radiusM: number;
  pinCount: number;
  hiddenCount: number;
  hasLocation: boolean;
  isEmpty: boolean;
  selectedRestaurant: Restaurant | null;
  searchHere: ReturnType<typeof useSearchHere>;
  showZoom?: boolean;
  onZoom?: (delta: number) => void;
  onLocate: () => void;
  locating: boolean;
  onRadiusChange: (radiusM: number) => void;
  children: React.ReactNode;
}) {
  const colors = useIconColors();
  const radiusLabel = radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`;

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-muted/40">
      <View className="flex-row items-center gap-2 px-3 py-3">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <MapPin size={15} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-foreground">Bản đồ vị trí</Text>
          <Text className="text-[11px] text-muted-foreground">
            Bán kính {radiusLabel} • {pinCount} ghim
          </Text>
        </View>
      </View>

      <View className="h-80 overflow-hidden">
        {children}

        <View className="absolute right-3 top-3 gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dùng vị trí của tôi"
            disabled={locating}
            onPress={onLocate}
            className="h-9 w-9 items-center justify-center rounded-xl border border-border bg-background shadow active:bg-muted">
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <LocateFixed size={16} color={colors.primary} />
            )}
          </Pressable>
          {showZoom && onZoom ? (
            <View className="overflow-hidden rounded-xl border border-border bg-background shadow">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Phóng to"
                onPress={() => onZoom(1)}
                className="h-9 w-9 items-center justify-center border-b border-border active:bg-muted">
                <Plus size={16} color={colors.foreground} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thu nhỏ"
                onPress={() => onZoom(-1)}
                className="h-9 w-9 items-center justify-center active:bg-muted">
                <Minus size={16} color={colors.foreground} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {searchHere.visible ? (
        <Pressable
          accessibilityRole="button"
          onPress={searchHere.onPress}
          className="mx-3 mt-3 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 active:opacity-90">
          <Search size={14} color={colors.primaryForeground} />
          <Text className="text-xs font-semibold text-primary-foreground">Tìm trong vùng đang xem</Text>
        </Pressable>
      ) : null}

      <MapStatusNotice hasLocation={hasLocation} isEmpty={isEmpty} radiusM={radiusM} onRadiusChange={onRadiusChange} />

      {hiddenCount > 0 ? (
        <Text className="mx-3 mt-2 text-[11px] leading-4 text-muted-foreground">
          {hiddenCount} quán từ nguồn bản đồ bên ngoài chỉ hiện trong danh sách, không có ghim trên bản đồ.
        </Text>
      ) : null}

      <View className="mt-2">
        <SelectedRestaurantPanel restaurant={selectedRestaurant} />
      </View>
    </View>
  );
}
