import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { PlaceErrorCode, PlaceProviderError } from './place-provider';

let configured = false;

/**
 * Cấu hình Google Maps SDK đúng 1 lần cho toàn app (provider + map dùng chung).
 * Ném PROVIDER_UNAVAILABLE khi thiếu key để UI rơi về fallback danh sách.
 */
export function ensureMapsConfigured(): void {
  const apiKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
  if (apiKey.length === 0) {
    throw new PlaceProviderError(PlaceErrorCode.PROVIDER_UNAVAILABLE);
  }
  if (!configured) {
    setOptions({ key: apiKey, v: 'weekly', language: 'vi', region: 'VN' });
    configured = true;
  }
}

export { importLibrary };
