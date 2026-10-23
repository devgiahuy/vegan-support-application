import * as React from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { MAP_STYLE_URL } from '@/lib/env';
import { useIconColors } from '@/lib/theme-colors';
import { buildMapPins, zoomForRadius } from '../utils/map-pins';
import { buildWebMapHtml, type WebMapMessage, type WebMapState } from '../utils/web-map-html';
import { MapFrame, useSearchHere } from './map-frame';
import type { RestaurantMapProps } from './restaurant-map-types';

const MIN_ZOOM = 3;
const MAX_ZOOM = 19;

/**
 * Bản đồ MapLibre GL JS chạy trong WebView — dùng được trong Expo Go (không cần development build), kém mượt hơn bản
 * native. Cùng quy tắc ghim (chỉ quán nội bộ) và cùng khung điều khiển với bản native. Khi trang bản đồ không tải được
 * (mất mạng, CDN lỗi) thì gọi `onFailed` để màn hình chuyển sang bản đồ radar.
 */
export function WebViewRestaurantMap({
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
  onFailed,
}: RestaurantMapProps & { onFailed: () => void }) {
  const colors = useIconColors();
  const webViewRef = React.useRef<WebView>(null);
  const zoomRef = React.useRef<number>(zoomForRadius(radiusM, center.lat));
  const [ready, setReady] = React.useState(false);
  const searchHere = useSearchHere(center, onSearchHere);

  const pins = React.useMemo(() => buildMapPins(items), [items]);
  const selectedRestaurant = React.useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );
  const zoom = React.useMemo(() => zoomForRadius(radiusM, center.lat), [radiusM, center.lat]);

  // HTML chỉ dựng một lần: đổi `source` sẽ tải lại cả trang bản đồ.
  const [html] = React.useState(() =>
    buildWebMapHtml({ styleUrl: MAP_STYLE_URL, lat: center.lat, lng: center.lng, zoom })
  );

  const state = React.useMemo<WebMapState>(
    () => ({
      center,
      zoom,
      pins,
      selectedId,
      hasLocation,
      pinColor: colors.primary,
      selectedColor: colors.cta,
    }),
    [center, zoom, pins, selectedId, hasLocation, colors.primary, colors.cta]
  );

  // Mỗi khi dữ liệu đổi (và trang đã sẵn sàng) thì đẩy trạng thái mới vào trang bản đồ.
  React.useEffect(() => {
    if (!ready) return;
    zoomRef.current = state.zoom;
    webViewRef.current?.injectJavaScript(`window.__setState(${JSON.stringify(state)}); true;`);
  }, [ready, state]);

  const onMessage = (event: WebViewMessageEvent) => {
    let message: WebMapMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as WebMapMessage;
    } catch {
      return;
    }
    switch (message.type) {
      case 'ready':
        setReady(true);
        break;
      case 'error':
        onFailed();
        break;
      case 'select':
        onSelect(message.id);
        break;
      case 'moved':
        searchHere.onUserMoved(message.lat, message.lng);
        break;
      case 'zoom':
        zoomRef.current = message.zoom;
        break;
    }
  };

  const zoomBy = (delta: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current + delta));
    zoomRef.current = next;
    webViewRef.current?.injectJavaScript(`window.__zoom(${delta}); true;`);
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
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://veggieconnect.local/' }}
          javaScriptEnabled
          domStorageEnabled
          nestedScrollEnabled
          overScrollMode="never"
          setSupportMultipleWindows={false}
          onMessage={onMessage}
          onError={onFailed}
          onHttpError={onFailed}
          style={{ flex: 1, backgroundColor: 'transparent' }}
        />
      </View>
    </MapFrame>
  );
}
