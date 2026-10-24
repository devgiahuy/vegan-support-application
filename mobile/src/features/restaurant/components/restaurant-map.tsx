import * as React from 'react';

import { MAP_STYLE_URL } from '@/lib/env';
import { RadarMap } from './radar-map';
import type { RestaurantMapProps } from './restaurant-map-types';
import { WebViewRestaurantMap } from './webview-restaurant-map';

/**
 * Bản đồ quán: MapLibre GL JS chạy trong WebView (dùng được trong Expo Go, không cần build native). Thiếu
 * `EXPO_PUBLIC_MAP_STYLE_URL`, hoặc trang bản đồ không tải được (mất mạng, CDN lỗi) thì chuyển sang bản đồ radar. Cả hai dùng
 * chung thẻ "quán đang chọn" và nút chỉ đường.
 */
export function RestaurantMap(props: RestaurantMapProps) {
  const [webViewFailed, setWebViewFailed] = React.useState(false);

  if (MAP_STYLE_URL && !webViewFailed) {
    return <WebViewRestaurantMap {...props} onFailed={() => setWebViewFailed(true)} />;
  }
  return <RadarMap {...props} />;
}
