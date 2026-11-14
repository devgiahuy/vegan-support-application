'use client';

import * as React from 'react';
import type { GeoJSONSource, Map as StreetMap, MapMouseEvent } from 'maplibre-gl';
import { RESTAURANT_MAP_STYLE_URL } from '@/lib/env';
import type { Restaurant, RestaurantBounds } from '../types/restaurant.model';
import { restaurantRadiusPolygon, toRestaurantMapData } from '../utils/restaurant-map-data';
import { areBoundsEqual } from '../utils/restaurant-bounds';

interface StreetMapOptions {
  items: Restaurant[];
  center: { lat: number; lng: number };
  radiusM: number;
  selectedId?: string | null;
  isSearchingArea: boolean;
  onSelect?: (id: string) => void;
  onClearSelection?: () => void;
  onBoundsChange?: (bounds: RestaurantBounds | null) => void;
  onCluster: (ids: string[]) => void;
}

const POINTS = 'restaurant-points';
const CLUSTERS = 'restaurant-clusters';
const HITS = 'restaurant-point-hits';
const SELECTED = 'restaurant-selected';

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fitSearchArea(map: StreetMap, options: StreetMapOptions) {
  const ring = restaurantRadiusPolygon(options.center, options.radiusM).geometry.coordinates[0];
  const longitudes = ring.map((point) => point[0]);
  const latitudes = ring.map((point) => point[1]);
  map.fitBounds(
    [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ],
    { padding: { top: 100, bottom: 150, left: 40, right: 65 }, maxZoom: 17, duration: 0 }
  );
}

export function useRestaurantStreetMap(options: StreetMapOptions) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<StreetMap | null>(null);
  const optionsRef = React.useRef(options);
  const lastBoundsRef = React.useRef<RestaurantBounds | null>(null);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tileWarning, setTileWarning] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let started = false;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let map: StreetMap | null = null;

    const fail = () => {
      if (disposed) return;
      if (deadline) clearTimeout(deadline);
      map?.remove();
      map = null;
      mapRef.current = null;
      setReady(false);
      setError(
        'Chưa tải được bản đồ đường phố. Hãy kiểm tra kết nối hoặc dùng trình duyệt hỗ trợ WebGL.'
      );
    };
    const initialize = async () => {
      if (disposed || started || container.clientWidth === 0 || container.clientHeight === 0)
        return;
      started = true;
      try {
        const { Map, NavigationControl, FullscreenControl, ScaleControl, setWorkerUrl } =
          await import('maplibre-gl');
        if (disposed) return;
        setWorkerUrl(
          new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString()
        );
        const current = optionsRef.current;
        map = new Map({
          container,
          style: RESTAURANT_MAP_STYLE_URL,
          center: [current.center.lng, current.center.lat],
          zoom: 13,
          minZoom: 2,
          maxZoom: 21,
          renderWorldCopies: false,
          cooperativeGestures: true,
          attributionControl: { compact: true },
          locale: {
            'NavigationControl.ZoomIn': 'Phóng to',
            'NavigationControl.ZoomOut': 'Thu nhỏ',
            'FullscreenControl.Enter': 'Mở bản đồ toàn màn hình',
            'FullscreenControl.Exit': 'Thoát toàn màn hình',
            'AttributionControl.ToggleAttribution': 'Nguồn dữ liệu bản đồ',
            'CooperativeGesturesHandler.WindowsHelpText': 'Giữ Ctrl và cuộn để thu phóng bản đồ',
            'CooperativeGesturesHandler.MacHelpText': 'Giữ ⌘ và cuộn để thu phóng bản đồ',
            'CooperativeGesturesHandler.MobileHelpText': 'Dùng hai ngón tay để di chuyển bản đồ',
          },
        });
        const liveMap = map;
        mapRef.current = liveMap;
        liveMap.addControl(new NavigationControl({ showCompass: false }), 'top-right');
        liveMap.addControl(
          new FullscreenControl({ container: container.parentElement ?? container }),
          'top-right'
        );
        liveMap.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
        liveMap
          .getCanvas()
          .setAttribute(
            'aria-label',
            'Bản đồ quán chay. Dùng các phím mũi tên để di chuyển hoặc chọn quán qua danh sách ghim.'
          );
        deadline = setTimeout(fail, 15_000);
        liveMap.on('error', () => {
          if (!disposed) setTileWarning(true);
        });
        liveMap.on('load', () => {
          if (disposed) return;
          try {
            const palette = getComputedStyle(container);
            const primary = palette.getPropertyValue('--primary').trim() || '#2e7d32';
            const foreground = palette.getPropertyValue('--foreground').trim() || '#1a2e1f';
            const background = palette.getPropertyValue('--background').trim() || '#ffffff';
            liveMap.addSource(POINTS, {
              type: 'geojson',
              data: toRestaurantMapData(optionsRef.current.items),
              cluster: true,
              clusterRadius: 48,
              clusterMaxZoom: 19,
            });
            liveMap.addSource('restaurant-radius', {
              type: 'geojson',
              data: restaurantRadiusPolygon(optionsRef.current.center, optionsRef.current.radiusM),
            });
            liveMap.addSource('restaurant-center', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [optionsRef.current.center.lng, optionsRef.current.center.lat],
                },
              },
            });
            liveMap.addSource('restaurant-selection', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
            });
            liveMap.addLayer({
              id: 'restaurant-radius-fill',
              type: 'fill',
              source: 'restaurant-radius',
              paint: { 'fill-color': primary, 'fill-opacity': 0.045 },
            });
            liveMap.addLayer({
              id: 'restaurant-radius-line',
              type: 'line',
              source: 'restaurant-radius',
              paint: {
                'line-color': primary,
                'line-width': 1.5,
                'line-opacity': 0.65,
                'line-dasharray': [3, 3],
              },
            });
            liveMap.addLayer({
              id: CLUSTERS,
              type: 'circle',
              source: POINTS,
              filter: ['has', 'point_count'],
              paint: {
                'circle-color': foreground,
                'circle-radius': 22,
                'circle-stroke-color': background,
                'circle-stroke-width': 3,
              },
            });
            liveMap.addLayer({
              id: 'restaurant-cluster-count',
              type: 'symbol',
              source: POINTS,
              filter: ['has', 'point_count'],
              layout: {
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['Noto Sans Bold'],
                'text-size': 13,
                'text-allow-overlap': true,
              },
              paint: { 'text-color': background },
            });
            liveMap.addLayer({
              id: HITS,
              type: 'circle',
              source: POINTS,
              filter: ['!', ['has', 'point_count']],
              paint: { 'circle-radius': 22, 'circle-opacity': 0 },
            });
            liveMap.addLayer({
              id: 'restaurant-point-dots',
              type: 'circle',
              source: POINTS,
              filter: ['!', ['has', 'point_count']],
              paint: {
                'circle-color': background,
                'circle-radius': 14,
                'circle-stroke-color': foreground,
                'circle-stroke-width': 2,
              },
            });
            liveMap.addLayer({
              id: 'restaurant-point-numbers',
              type: 'symbol',
              source: POINTS,
              filter: ['!', ['has', 'point_count']],
              layout: {
                'text-field': ['to-string', ['get', 'position']],
                'text-font': ['Noto Sans Bold'],
                'text-size': 11,
                'text-allow-overlap': true,
              },
              paint: { 'text-color': foreground },
            });
            liveMap.addLayer({
              id: SELECTED,
              type: 'circle',
              source: 'restaurant-selection',
              paint: {
                'circle-color': primary,
                'circle-radius': 18,
                'circle-stroke-color': background,
                'circle-stroke-width': 3,
              },
            });
            liveMap.addLayer({
              id: 'restaurant-selected-number',
              type: 'symbol',
              source: 'restaurant-selection',
              layout: {
                'text-field': ['to-string', ['get', 'position']],
                'text-font': ['Noto Sans Bold'],
                'text-size': 12,
                'text-allow-overlap': true,
              },
              paint: { 'text-color': background },
            });
            liveMap.addLayer({
              id: 'restaurant-search-center',
              type: 'circle',
              source: 'restaurant-center',
              paint: {
                'circle-radius': 5,
                'circle-color': primary,
                'circle-stroke-color': background,
                'circle-stroke-width': 2,
              },
            });
            liveMap.moveLayer('restaurant-search-center', CLUSTERS);
            fitSearchArea(liveMap, optionsRef.current);
            if (deadline) clearTimeout(deadline);
            setReady(true);
          } catch {
            fail();
          }
        });
        liveMap.on('moveend', () => {
          if (disposed) return;
          const bounds = liveMap.getBounds();
          const next = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          };
          if (!areBoundsEqual(lastBoundsRef.current, next)) {
            lastBoundsRef.current = next;
            optionsRef.current.onBoundsChange?.(next);
          }
        });
        liveMap.on('click', async (event: MapMouseEvent) => {
          if (disposed || !liveMap.getLayer(CLUSTERS)) return;
          const features = liveMap.queryRenderedFeatures(event.point, { layers: [CLUSTERS, HITS] });
          const cluster = features.find(
            (feature) => typeof feature.properties.cluster_id === 'number'
          );
          if (cluster && cluster.geometry.type === 'Point') {
            try {
              const source = liveMap.getSource(POINTS) as GeoJSONSource;
              const id = Number(cluster.properties.cluster_id);
              const leaves = await source.getClusterLeaves(
                id,
                Math.max(1, optionsRef.current.items.length),
                0
              );
              if (disposed) return;
              const ids = leaves.flatMap((leaf) =>
                typeof leaf.properties?.id === 'string' ? [leaf.properties.id] : []
              );
              const positions = new Set(leaves.map((leaf) => JSON.stringify(leaf.geometry)));
              if (positions.size === 1 || liveMap.getZoom() >= 19) {
                optionsRef.current.onCluster(ids);
              } else {
                const zoom = await source.getClusterExpansionZoom(id);
                if (!disposed)
                  liveMap.easeTo({
                    center: [cluster.geometry.coordinates[0], cluster.geometry.coordinates[1]],
                    zoom: Math.min(20, zoom),
                    duration: reducedMotion() ? 0 : 200,
                  });
              }
            } catch {
              /* A refreshed source can replace the clicked cluster before its leaves resolve. */
            }
            return;
          }
          const ids = [
            ...new Set(
              features.flatMap((feature) =>
                typeof feature.properties.id === 'string' ? [feature.properties.id] : []
              )
            ),
          ];
          if (ids.length > 1) optionsRef.current.onCluster(ids);
          else if (ids[0]) optionsRef.current.onSelect?.(ids[0]);
          else optionsRef.current.onClearSelection?.();
        });
        liveMap.on('mousemove', (event) => {
          if (disposed || !liveMap.getLayer(CLUSTERS)) return;
          liveMap.getCanvas().style.cursor = liveMap.queryRenderedFeatures(event.point, {
            layers: [CLUSTERS, HITS],
          }).length
            ? 'pointer'
            : '';
        });
      } catch {
        fail();
      }
    };
    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        if (map) map.resize();
        else void initialize();
      }
    });
    observer.observe(container);
    void initialize();
    return () => {
      disposed = true;
      if (deadline) clearTimeout(deadline);
      observer.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, [attempt]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource(POINTS) as GeoJSONSource).setData(toRestaurantMapData(options.items));
  }, [ready, options.items]);

  const { lat, lng } = options.center;
  React.useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const center = { lat, lng };
    (map.getSource('restaurant-radius') as GeoJSONSource).setData(
      restaurantRadiusPolygon(center, options.radiusM)
    );
    (map.getSource('restaurant-center') as GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [lng, lat] },
    });
    fitSearchArea(map, optionsRef.current);
  }, [ready, lat, lng, options.radiusM]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const id of ['restaurant-radius-fill', 'restaurant-radius-line'])
      map.setLayoutProperty(id, 'visibility', options.isSearchingArea ? 'none' : 'visible');
  }, [ready, options.isSearchingArea]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const data = toRestaurantMapData(options.items);
    (map.getSource('restaurant-selection') as GeoJSONSource).setData({
      ...data,
      features: data.features.filter((feature) => feature.properties.id === options.selectedId),
    });
  }, [ready, options.selectedId, options.items]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const selected = optionsRef.current.items.find((item) => item.id === options.selectedId);
    if (selected?.lat !== null && selected?.lat !== undefined && selected.lng !== null) {
      const position: [number, number] = [selected.lng, selected.lat];
      if (!map.getBounds().contains(position))
        map.easeTo({ center: position, duration: reducedMotion() ? 0 : 200 });
    }
  }, [ready, options.selectedId]);

  const retry = React.useCallback(() => {
    setReady(false);
    setError(null);
    setTileWarning(false);
    setAttempt((current) => current + 1);
  }, []);
  const resetView = React.useCallback(() => {
    if (mapRef.current) fitSearchArea(mapRef.current, optionsRef.current);
  }, []);
  return { containerRef, ready, error, tileWarning, retry, resetView };
}
