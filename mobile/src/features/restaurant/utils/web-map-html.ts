/** Phiên bản MapLibre GL JS cố định, tải từ CDN khi mở bản đồ trong WebView. */
const MAPLIBRE_VERSION = '4.7.1';

export interface WebMapInit {
  styleUrl: string;
  lat: number;
  lng: number;
  zoom: number;
}

/** Trạng thái app gửi xuống trang bản đồ mỗi khi dữ liệu đổi. */
export interface WebMapState {
  center: { lat: number; lng: number };
  zoom: number;
  pins: { id: string; label: number; lat: number; lng: number }[];
  selectedId: string | null;
  hasLocation: boolean;
  pinColor: string;
  selectedColor: string;
}

/** Tin nhắn trang bản đồ gửi lên app. */
export type WebMapMessage =
  | { type: 'ready' }
  | { type: 'error' }
  | { type: 'select'; id: string }
  | { type: 'moved'; lat: number; lng: number }
  | { type: 'zoom'; zoom: number };

/** Chuỗi JSON an toàn để nhúng trong thẻ `<script>` (chặn `</script>` và ký tự phân tách dòng). */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .split(String.fromCharCode(0x2028))
    .join('\\u2028')
    .split(String.fromCharCode(0x2029))
    .join('\\u2029');
}

/**
 * Trang HTML nhúng bản đồ MapLibre GL JS dùng trong WebView (chạy được trong Expo Go). Trang tự gửi `ready` khi tải xong,
 * app đẩy trạng thái bằng `window.__setState(state)` và điều khiển zoom bằng `window.__zoom(delta)`.
 */
export function buildWebMapHtml(init: WebMapInit): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link href="https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css" rel="stylesheet" />
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e8efe8; }
  .pin { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; color: #fff; font: 700 11px/24px sans-serif; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
  .me { width: 16px; height: 16px; border-radius: 50%; background: #3b82f6; border: 2px solid #fff; box-shadow: 0 0 0 4px rgba(59,130,246,.25); }
</style>
<script>
  function post(message) { window.ReactNativeWebView.postMessage(JSON.stringify(message)); }
</script>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js" onerror="post({ type: 'error' })"></script>
<script>
  var CFG = ${safeJson(init)};
  var map = null;
  var markers = [];
  var lastView = '';
  var lastSelected = null;

  function clearMarkers() {
    markers.forEach(function (marker) { marker.remove(); });
    markers = [];
  }

  try {
    map = new maplibregl.Map({
      container: 'map',
      style: CFG.styleUrl,
      center: [CFG.lng, CFG.lat],
      zoom: CFG.zoom,
      attributionControl: { compact: true }
    });
    map.on('moveend', function (event) {
      if (!event.originalEvent) return;
      var c = map.getCenter();
      post({ type: 'moved', lat: c.lat, lng: c.lng });
    });
    map.on('zoomend', function () { post({ type: 'zoom', zoom: map.getZoom() }); });
    map.on('error', function () { if (!map.isStyleLoaded()) post({ type: 'error' }); });
    map.on('load', function () { post({ type: 'ready' }); });
  } catch (error) {
    post({ type: 'error' });
  }

  window.__setState = function (state) {
    if (!map) return;
    var viewKey = state.center.lat + ',' + state.center.lng + ',' + state.zoom;
    if (viewKey !== lastView) {
      lastView = viewKey;
      map.easeTo({ center: [state.center.lng, state.center.lat], zoom: state.zoom, duration: 600 });
    }
    clearMarkers();
    if (state.hasLocation) {
      var me = document.createElement('div');
      me.className = 'me';
      markers.push(new maplibregl.Marker({ element: me }).setLngLat([state.center.lng, state.center.lat]).addTo(map));
    }
    state.pins.forEach(function (pin) {
      var element = document.createElement('div');
      element.className = 'pin';
      element.textContent = String(pin.label);
      element.style.background = pin.id === state.selectedId ? state.selectedColor : state.pinColor;
      element.addEventListener('click', function (event) {
        event.stopPropagation();
        post({ type: 'select', id: pin.id });
      });
      markers.push(new maplibregl.Marker({ element: element }).setLngLat([pin.lng, pin.lat]).addTo(map));
    });
    if (state.selectedId && state.selectedId !== lastSelected) {
      var selectedPin = state.pins.filter(function (pin) { return pin.id === state.selectedId; })[0];
      if (selectedPin) map.flyTo({ center: [selectedPin.lng, selectedPin.lat], duration: 600 });
    }
    lastSelected = state.selectedId;
  };

  window.__zoom = function (delta) {
    if (!map) return;
    if (delta > 0) map.zoomIn({ duration: 300 }); else map.zoomOut({ duration: 300 });
  };
</script>
</body>
</html>`;
}
