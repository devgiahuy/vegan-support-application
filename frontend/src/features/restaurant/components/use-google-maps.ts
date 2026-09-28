'use client';

import * as React from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export interface UseGoogleMapsOptions {
  apiKey?: string;
  libraries?: string[];
}

const DEFAULT_LIBRARIES = ['places'];

/**
 * Hook tải động Google Maps JavaScript SDK bằng `@googlemaps/js-api-loader` v2 functional API.
 * Hỗ trợ fallback an toàn khi không có key hoặc lỗi mạng (EC-05).
 */
export function useGoogleMaps({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  libraries = DEFAULT_LIBRARIES,
}: UseGoogleMapsOptions = {}) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!apiKey || apiKey.trim().length === 0 || apiKey.includes('FakeKey')) {
      // Bỏ qua load thật nếu không có API key hợp lệ
      setLoadError(new Error('Chưa cấu hình Google Maps API Key hợp lệ.'));
      return;
    }

    let isMounted = true;

    try {
      setOptions({
        key: apiKey,
        v: 'weekly',
        libraries,
      });

      importLibrary('maps')
        .then(() => {
          if (isMounted) {
            setIsLoaded(true);
            setLoadError(null);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setLoadError(err instanceof Error ? err : new Error(String(err)));
            setIsLoaded(false);
          }
        });
    } catch (err: unknown) {
      if (isMounted) {
        setLoadError(err instanceof Error ? err : new Error(String(err)));
        setIsLoaded(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [apiKey, libraries]);

  return { isLoaded, loadError };
}
