import * as React from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { MAP_STYLE_URL } from '@/lib/env';
import type { RestaurantMapProps } from './restaurant-map.types';
import { RestaurantSchematicMap } from './restaurant-schematic-map';

export type { RestaurantMapProps } from './restaurant-map.types';

/**
 * Bản đồ đường phố cần module native (APK / development build) và URL style cấu hình trong `.env`.
 * Không đủ điều kiện (Expo Go, web, chưa cấu hình style) → dùng sơ đồ vị trí tương đối.
 */
const STREET_MAP_SUPPORTED =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && MAP_STYLE_URL !== '';

// Nạp lười: module native chỉ được thực thi khi thật sự dùng, nên Expo Go không bị lỗi thiếu module.
const LazyStreetMap = STREET_MAP_SUPPORTED
  ? React.lazy(() => import('./restaurant-street-map').then((module) => ({ default: module.RestaurantStreetMap })))
  : null;

const UNAVAILABLE_NOTICE = 'Chưa tải được bản đồ đường phố. Đang dùng sơ đồ vị trí tương đối; danh sách quán vẫn dùng được.';

class StreetMapBoundary extends React.Component<
  { onError: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function RestaurantMap(props: RestaurantMapProps) {
  const [unavailable, setUnavailable] = React.useState(false);
  const markUnavailable = React.useCallback(() => setUnavailable(true), []);

  if (!LazyStreetMap) return <RestaurantSchematicMap {...props} />;
  if (unavailable) return <RestaurantSchematicMap {...props} notice={UNAVAILABLE_NOTICE} />;

  return (
    <StreetMapBoundary onError={markUnavailable}>
      <React.Suspense fallback={<RestaurantSchematicMap {...props} />}>
        <LazyStreetMap {...props} onUnavailable={markUnavailable} />
      </React.Suspense>
    </StreetMapBoundary>
  );
}
