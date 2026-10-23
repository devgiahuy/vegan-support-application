import * as React from 'react';
import type { ComponentType } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { MAP_STYLE_URL } from '@/lib/env';
import { RadarMap } from './radar-map';
import type { RestaurantMapProps } from './restaurant-map-types';

/**
 * Nạp bản đồ MapLibre native nếu chạy được: cần `EXPO_PUBLIC_MAP_STYLE_URL` và development build (module native không
 * có trong Expo Go). Thiếu một trong hai, hoặc build chưa chứa module, thì trả về null để dùng phương án kế tiếp.
 */
function loadNativeMap(): ComponentType<RestaurantMapProps> | null {
  if (!MAP_STYLE_URL || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('./native-restaurant-map') as typeof import('./native-restaurant-map')).NativeRestaurantMap;
  } catch {
    return null;
  }
}

/** Bản đồ MapLibre GL JS trong WebView — chạy được cả trong Expo Go. Null nếu thiếu style hoặc module WebView. */
function loadWebViewMap(): ComponentType<RestaurantMapProps & { onFailed: () => void }> | null {
  if (!MAP_STYLE_URL) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('./webview-restaurant-map') as typeof import('./webview-restaurant-map')).WebViewRestaurantMap;
  } catch {
    return null;
  }
}

const NativeMap = loadNativeMap();
const WebViewMap = loadWebViewMap();

/**
 * Bản đồ quán, theo thứ tự ưu tiên: MapLibre native (development build) → MapLibre trong WebView (Expo Go) → bản đồ
 * radar. WebView lỗi tải (mất mạng, CDN lỗi) thì tự chuyển sang radar. Mọi phương án dùng chung thẻ "quán đang chọn".
 */
export function RestaurantMap(props: RestaurantMapProps) {
  const [webViewFailed, setWebViewFailed] = React.useState(false);

  if (NativeMap) return <NativeMap {...props} />;
  if (WebViewMap && !webViewFailed) return <WebViewMap {...props} onFailed={() => setWebViewFailed(true)} />;
  return <RadarMap {...props} />;
}
