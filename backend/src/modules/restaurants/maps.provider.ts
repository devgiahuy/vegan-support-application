import { z } from '../../common/validation/zod.js';
import type { AppConfig } from '../../config/env.js';

export interface ExternalPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categories: string[];
  rating?: number;
  reviewCount?: number;
  price?: string;
  openState?: string;
  operatingHours?: Record<string, string>;
  phone?: string;
  website?: string;
  thumbnailUrl?: string;
  mapsUrl?: string;
  attribution: string;
  fetchedAt: string;
}

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string | null;
  attribution: string;
}

export interface MapsProvider {
  readonly name: string;
  search(
    query: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    filters?: MapsSearchFilters,
  ): Promise<ExternalPlace[]>;
  get(placeId: string): Promise<ExternalPlace | null>;
  geocode(address: string): Promise<GeocodeResult | null>;
}

export interface MapsSearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  openState?: 'now' | '24h';
  openOnDay?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  openAtHour?: number;
}

const fakePlaces = [
  {
    placeId: 'fake-vegan-house',
    name: 'Vegan House Demo',
    address: '1 Nguyễn Huệ, Quận 1, TP Hồ Chí Minh',
    latitude: 10.7735,
    longitude: 106.7032,
    categories: ['restaurant'],
  },
  {
    placeId: 'fake-green-market',
    name: 'Green Market Demo',
    address: '20 Lê Lợi, Quận 1, TP Hồ Chí Minh',
    latitude: 10.7739,
    longitude: 106.6995,
    categories: ['store'],
  },
];

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const radians = Math.PI / 180;
  const dLat = (bLat - aLat) * radians;
  const dLng = (bLng - aLng) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * radians) * Math.cos(bLat * radians) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export { distanceMeters };

export class FakeMapsProvider implements MapsProvider {
  readonly name = 'FAKE';

  search(query: string, lat: number, lng: number, radiusMeters: number): Promise<ExternalPlace[]> {
    const term = query
      .toLowerCase()
      .replace(/^vegetarian\s+/, '')
      .trim();
    return Promise.resolve(
      fakePlaces
        .filter(
          (place) => distanceMeters(lat, lng, place.latitude, place.longitude) <= radiusMeters,
        )
        .filter(
          (place) =>
            !term ||
            term === 'restaurant' ||
            place.name.toLowerCase().includes(term) ||
            place.address.toLowerCase().includes(term),
        )
        .map((place) => ({
          ...place,
          attribution: 'Local demo data',
          fetchedAt: new Date().toISOString(),
        })),
    );
  }

  get(placeId: string): Promise<ExternalPlace | null> {
    const place = fakePlaces.find((item) => item.placeId === placeId);
    return Promise.resolve(
      place
        ? { ...place, attribution: 'Local demo data', fetchedAt: new Date().toISOString() }
        : null,
    );
  }

  geocode(address: string): Promise<GeocodeResult | null> {
    const place = fakePlaces.find(
      (item) =>
        item.address.toLowerCase().includes(address.toLowerCase()) ||
        item.name.toLowerCase().includes(address.toLowerCase()),
    );
    return Promise.resolve(
      place
        ? {
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            placeId: place.placeId,
            attribution: 'Local demo data',
          }
        : null,
    );
  }
}

const googlePlaceSchema = z
  .object({
    id: z.string(),
    displayName: z.object({ text: z.string() }).optional(),
    formattedAddress: z.string().optional(),
    location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
    types: z.array(z.string()).optional(),
    attributions: z.array(z.object({ provider: z.string().optional() }).passthrough()).optional(),
  })
  .passthrough();

export class GoogleMapsProvider implements MapsProvider {
  readonly name = 'GOOGLE';
  constructor(
    private readonly key: string,
    private readonly timeoutMs: number,
  ) {}

  private async request(url: string, init: RequestInit): Promise<unknown> {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new Error(`Maps provider HTTP ${response.status}`);
    return response.json();
  }

  private place(raw: unknown): ExternalPlace | null {
    const result = googlePlaceSchema.safeParse(raw);
    if (
      !result.success ||
      !result.data.displayName ||
      !result.data.formattedAddress ||
      !result.data.location
    )
      return null;
    const p = result.data;
    const { location, displayName, formattedAddress } = p;
    if (!location || !displayName || !formattedAddress) return null;
    if (Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) return null;
    return {
      placeId: p.id,
      name: displayName.text,
      address: formattedAddress,
      latitude: location.latitude,
      longitude: location.longitude,
      categories: p.types ?? [],
      attribution: [
        'Google Maps',
        ...(p.attributions ?? []).map((a) => a.provider).filter((a): a is string => !!a),
      ].join(' · '),
      fetchedAt: new Date().toISOString(),
    };
  }

  async search(
    query: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    _filters?: MapsSearchFilters,
  ): Promise<ExternalPlace[]> {
    const raw = await this.request('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.key,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.attributions',
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: 20,
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
        },
      }),
    });
    const parsed = z.object({ places: z.array(z.unknown()).optional() }).parse(raw);
    return (parsed.places ?? [])
      .map((item) => this.place(item))
      .filter((item): item is ExternalPlace => item !== null);
  }

  async get(placeId: string): Promise<ExternalPlace | null> {
    const raw = await this.request(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': this.key,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,attributions',
        },
      },
    );
    return this.place(raw);
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', this.key);
    const raw = await this.request(url.toString(), {});
    const parsed = z
      .object({
        status: z.string(),
        results: z
          .array(
            z.object({
              formatted_address: z.string(),
              place_id: z.string(),
              geometry: z.object({ location: z.object({ lat: z.number(), lng: z.number() }) }),
            }),
          )
          .optional(),
      })
      .parse(raw);
    if (parsed.status === 'ZERO_RESULTS') return null;
    if (parsed.status !== 'OK') throw new Error(`Geocoding status ${parsed.status}`);
    const first = parsed.results?.[0];
    return first
      ? {
          address: first.formatted_address,
          latitude: first.geometry.location.lat,
          longitude: first.geometry.location.lng,
          placeId: first.place_id,
          attribution: 'Google Maps',
        }
      : null;
  }
}

const serpApiPlaceSchema = z.object({
  place_id: z.string().optional(),
  data_cid: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  gps_coordinates: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  price: z.string().optional(),
  type: z.string().optional(),
  types: z.array(z.string()).optional(),
  open_state: z.string().optional(),
  operating_hours: z.record(z.string(), z.string()).optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  google_maps_url: z.string().url().optional(),
});

const serpApiResponseSchema = z.object({
  search_metadata: z.object({ status: z.string().optional() }).optional(),
  local_results: z.array(z.unknown()).optional(),
  place_results: z.unknown().optional(),
  serpapi_pagination: z.object({ next: z.string().optional() }).optional(),
});

export class SerpApiMapsProvider implements MapsProvider {
  readonly name = 'SERPAPI';

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  private async request(params: Record<string, string>): Promise<unknown> {
    const url = new URL(this.baseUrl);
    for (const [key, value] of Object.entries({
      ...params,
      api_key: this.apiKey,
      engine: 'google_maps',
    })) {
      url.searchParams.set(key, value);
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new Error(`SerpApi provider HTTP ${response.status}`);
    const body: unknown = await response.json();
    const parsed = serpApiResponseSchema.safeParse(body);
    if (!parsed.success || parsed.data.search_metadata?.status === 'Error') {
      throw new Error('SerpApi provider returned an invalid response');
    }
    return body;
  }

  private place(raw: unknown): ExternalPlace | null {
    const result = serpApiPlaceSchema.safeParse(raw);
    const place = result.success ? result.data : null;
    const coordinates = place?.gps_coordinates;
    if (!place?.place_id || !place.title || !place.address || !coordinates) return null;
    if (Math.abs(coordinates.latitude) > 90 || Math.abs(coordinates.longitude) > 180) return null;
    return {
      placeId: place.place_id,
      name: place.title,
      address: place.address,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      categories: [...(place.types ?? []), ...(place.type ? [place.type] : [])].filter(
        (value, index, values) => values.indexOf(value) === index,
      ),
      ...(place.rating !== undefined ? { rating: place.rating } : {}),
      ...(place.reviews !== undefined ? { reviewCount: place.reviews } : {}),
      ...(place.price ? { price: place.price } : {}),
      ...(place.open_state ? { openState: place.open_state } : {}),
      ...(place.operating_hours ? { operatingHours: place.operating_hours } : {}),
      ...(place.phone ? { phone: place.phone } : {}),
      ...(place.website ? { website: place.website } : {}),
      ...(place.thumbnail ? { thumbnailUrl: place.thumbnail } : {}),
      ...(place.google_maps_url ? { mapsUrl: place.google_maps_url } : {}),
      attribution: 'Google Maps data via SerpApi',
      fetchedAt: new Date().toISOString(),
    };
  }

  private zoomForRadius(radiusMeters: number): string {
    const zoom = Math.max(3, Math.min(30, Math.round(Math.log2(40_075_017 / radiusMeters))));
    return `${zoom}z`;
  }

  private async searchPage(
    query: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    filters: MapsSearchFilters | undefined,
    start: number,
  ): Promise<{ places: ExternalPlace[]; hasNext: boolean }> {
    const filterParams: Record<string, string> = {};
    for (const [key, value] of Object.entries({
      min_price: filters?.minPrice,
      max_price: filters?.maxPrice,
      min_rating: filters?.minRating,
      open_state: filters?.openState,
      open_on_day: filters?.openOnDay,
      open_at_hour: filters?.openAtHour,
    })) {
      if (value !== undefined) filterParams[key] = String(value);
    }
    const raw = await this.request({
      q: query,
      ll: `@${lat},${lng},${this.zoomForRadius(radiusMeters)}`,
      type: 'search',
      no_cache: 'false',
      ...(start > 0 ? { start: String(start) } : {}),
      ...filterParams,
    });
    const parsed = serpApiResponseSchema.parse(raw);
    const places = (parsed.local_results ?? [])
      .map((item) => this.place(item))
      .filter((item): item is ExternalPlace => item !== null)
      .filter((item) => distanceMeters(lat, lng, item.latitude, item.longitude) <= radiusMeters);
    return { places, hasNext: Boolean(parsed.serpapi_pagination?.next) };
  }

  async search(
    query: string,
    lat: number,
    lng: number,
    radiusMeters: number,
    filters?: MapsSearchFilters,
  ): Promise<ExternalPlace[]> {
    const places: ExternalPlace[] = [];
    const seen = new Set<string>();
    const pageSize = 20;
    const maxPages = 10;
    for (let page = 0; page < maxPages; page += 1) {
      const result = await this.searchPage(query, lat, lng, radiusMeters, filters, page * pageSize);
      for (const place of result.places) {
        if (!seen.has(place.placeId)) {
          seen.add(place.placeId);
          places.push(place);
        }
      }
      if (!result.hasNext || result.places.length < pageSize) break;
    }
    return places;
  }

  async get(placeId: string): Promise<ExternalPlace | null> {
    const raw = await this.request({ place_id: placeId });
    const parsed = serpApiResponseSchema.parse(raw);
    return this.place(parsed.place_results ?? parsed.local_results?.[0]);
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    const raw = await this.request({ q: address, type: 'search' });
    const parsed = serpApiResponseSchema.parse(raw);
    const place = this.place(parsed.local_results?.[0]);
    return place
      ? {
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          placeId: place.placeId,
          attribution: place.attribution,
        }
      : null;
  }
}

export function createMapsProvider(config: AppConfig): MapsProvider {
  if (config.maps.provider === 'google' && config.maps.apiKey)
    return new GoogleMapsProvider(config.maps.apiKey, config.maps.timeoutMs);
  if (config.maps.provider === 'serpapi' && config.maps.serpApiKey)
    return new SerpApiMapsProvider(
      config.maps.serpApiKey,
      config.maps.serpApiBaseUrl,
      config.maps.timeoutMs,
    );
  return new FakeMapsProvider();
}
