import { z } from '../../common/validation/zod.js';
import type { AppConfig } from '../../config/env.js';

export interface ExternalPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categories: string[];
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
  search(query: string, lat: number, lng: number, radiusMeters: number): Promise<ExternalPlace[]>;
  get(placeId: string): Promise<ExternalPlace | null>;
  geocode(address: string): Promise<GeocodeResult | null>;
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

export function createMapsProvider(config: AppConfig): MapsProvider {
  return config.maps.provider === 'google' && config.maps.apiKey
    ? new GoogleMapsProvider(config.maps.apiKey, config.maps.timeoutMs)
    : new FakeMapsProvider();
}
