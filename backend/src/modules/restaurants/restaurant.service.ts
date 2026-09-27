import {
  DietPattern,
  RestaurantSource,
  RestaurantStatus,
  type PrismaClient,
  type Restaurant,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import {
  distanceMeters,
  type ExternalPlace,
  type MapsProvider,
  type MapsSearchFilters,
} from './maps.provider.js';
import type {
  AdminEditInput,
  AdminListQuery,
  NearbyQuery,
  RestaurantInput,
  ReviewInput,
  SearchQuery,
} from './restaurant.schemas.js';

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

interface ResultPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categories: string[];
  rating: number | null;
  reviewCount: number | null;
  price: string | null;
  openState: string | null;
  operatingHours: Record<string, string> | null;
  phone: string | null;
  website: string | null;
  thumbnailUrl: string | null;
  mapsUrl: string | null;
  dietTags: string[];
  source: 'INTERNAL' | 'GOOGLE' | 'SERPAPI' | 'FAKE';
  externalPlaceId: string | null;
  attribution: string;
  fetchedAt: string | null;
  distanceMeters: number | null;
  matchReasons: string[];
  dietaryReviewed: boolean;
}

function fromInternal(
  place: Restaurant & { externalRefs: { provider: string; placeId: string }[] },
  lat?: number,
  lng?: number,
): ResultPlace {
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    categories: place.categories,
    rating: null,
    reviewCount: null,
    price: null,
    openState: null,
    operatingHours: null,
    phone: null,
    website: null,
    thumbnailUrl: null,
    mapsUrl: null,
    dietTags: place.dietTags,
    source: 'INTERNAL',
    externalPlaceId: place.externalRefs.find((r) => r.provider === 'GOOGLE')?.placeId ?? null,
    attribution:
      place.source === RestaurantSource.MEMBER
        ? 'Community submission, admin reviewed'
        : 'Internal, admin reviewed',
    fetchedAt: place.dataCheckedAt?.toISOString() ?? place.updatedAt.toISOString(),
    distanceMeters:
      lat !== undefined && lng !== undefined
        ? Math.round(distanceMeters(lat, lng, Number(place.latitude), Number(place.longitude)))
        : null,
    matchReasons: ['ADMIN_REVIEWED', ...place.dietTags.map((tag) => `DIET_${tag}`)],
    dietaryReviewed: true,
  };
}

function fromExternal(
  place: ExternalPlace,
  provider: string,
  lat: number,
  lng: number,
): ResultPlace {
  return {
    id: `${provider.toLowerCase()}:${place.placeId}`,
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    categories: place.categories,
    rating: place.rating ?? null,
    reviewCount: place.reviewCount ?? null,
    price: place.price ?? null,
    openState: place.openState ?? null,
    operatingHours: place.operatingHours ?? null,
    phone: place.phone ?? null,
    website: place.website ?? null,
    thumbnailUrl: place.thumbnailUrl ?? null,
    mapsUrl: place.mapsUrl ?? null,
    dietTags: [],
    source: provider === 'GOOGLE' || provider === 'SERPAPI' ? provider : 'FAKE',
    externalPlaceId: place.placeId,
    attribution: place.attribution,
    fetchedAt: place.fetchedAt,
    distanceMeters: Math.round(distanceMeters(lat, lng, place.latitude, place.longitude)),
    matchReasons: ['PROVIDER_TEXT_MATCH', 'DIETARY_UNREVIEWED'],
    dietaryReviewed: false,
  };
}

function conflict(code: string, message: string): never {
  throw new AppError({ statusCode: 409, code, message });
}

export class RestaurantService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly provider: MapsProvider,
  ) {}

  private async constraints(userId: string | undefined, requested?: DietPattern) {
    const user = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            dietPreference: true,
            dietPreferenceRules: { where: { enabled: true }, include: { ruleDefinition: true } },
            allergies: { where: { active: true } },
            ingredientExclusions: { where: { active: true } },
          },
        })
      : null;
    const pattern = user?.dietPreference?.dietPattern;
    const effectivePattern =
      requested === DietPattern.VEGAN || pattern === DietPattern.VEGAN
        ? DietPattern.VEGAN
        : (requested ?? pattern);
    const traditions =
      user?.dietPreferenceRules
        .filter((r) => r.ruleDefinition.source === 'TRADITION' && r.ruleDefinition.tradition)
        .map((r) => r.ruleDefinition.tradition as string) ?? [];
    return {
      pattern: effectivePattern,
      traditions,
      allergens: user?.allergies.map((a) => a.allergenCode) ?? [],
      exclusions: user?.ingredientExclusions.map((i) => i.normalizedName) ?? [],
    };
  }

  private compatible(
    place: Restaurant,
    constraints: Awaited<ReturnType<RestaurantService['constraints']>>,
  ): boolean {
    if (constraints.pattern && !place.dietTags.includes(constraints.pattern)) return false;
    if (constraints.traditions.some((tag) => !place.dietTags.includes(tag))) return false;
    if (constraints.allergens.some((code) => !place.allergenFreeCodes.includes(code))) return false;
    if (constraints.exclusions.some((name) => !place.excludedIngredients.includes(name)))
      return false;
    return true;
  }

  private assertLocation(query: NearbyQuery | SearchQuery): void {
    if ((query.lat === undefined || query.lng === undefined) && query.north === undefined) {
      throw new AppError({
        statusCode: 400,
        code: 'LOCATION_REQUIRED',
        message: 'Enter a location or allow device location',
      });
    }
    if (query.locationSource === 'DEVICE' && query.locationConsent !== 'true') {
      throw new AppError({
        statusCode: 403,
        code: 'LOCATION_CONSENT_REQUIRED',
        message: 'Device location requires explicit consent',
      });
    }
  }

  async discover(query: NearbyQuery | SearchQuery, userId?: string) {
    this.assertLocation(query);
    const lat = query.lat ?? (query.north! + query.south!) / 2;
    const lng = query.lng ?? (query.east! + query.west!) / 2;
    const radiusMeters =
      query.north !== undefined
        ? distanceMeters(query.south!, query.west!, query.north, query.east!) / 2
        : query.radiusMeters;
    if (radiusMeters > 50000)
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_LOCATION_BOUNDS',
        message: 'Location bounds are too large',
      });
    const text = 'q' in query ? query.q : undefined;
    const constraints = await this.constraints(userId, query.dietPattern);
    const latDelta = radiusMeters / 111_000;
    const lngDelta = radiusMeters / Math.max(20_000, 111_000 * Math.cos((lat * Math.PI) / 180));
    const internal = await this.prisma.restaurant.findMany({
      where: {
        status: RestaurantStatus.APPROVED,
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
      include: { externalRefs: true },
      orderBy: { createdAt: 'desc' },
      take: 1001,
    });
    const resultsTruncated = internal.length > 1000;
    const inArea = (pLat: number, pLng: number) =>
      query.north !== undefined
        ? pLat <= query.north && pLat >= query.south! && pLng <= query.east! && pLng >= query.west!
        : distanceMeters(lat, lng, pLat, pLng) <= radiusMeters;
    const selected = internal
      .slice(0, 1000)
      .filter(
        (p) => inArea(Number(p.latitude), Number(p.longitude)) && this.compatible(p, constraints),
      )
      .filter(
        (p) =>
          !text ||
          normalize(`${p.name} ${p.address} ${p.categories.join(' ')}`).includes(normalize(text)),
      )
      .map((p) => fromInternal(p, lat, lng));
    let externalDataUnavailable = false;
    let external: ResultPlace[] = [];
    const providerResultLimit = 200;
    const mapsFilters: MapsSearchFilters =
      'q' in query
        ? Object.fromEntries(
            Object.entries({
              minPrice: query.minPrice,
              maxPrice: query.maxPrice,
              minRating: query.minRating,
              openState: query.openState,
              openOnDay: query.openOnDay,
              openAtHour: query.openAtHour,
            }).filter(([, value]) => value !== undefined),
          )
        : {};
    // Provider text/type labels are not evidence of allergy or diet compatibility.
    const hardConstraints = Boolean(
      constraints.pattern ||
      constraints.traditions.length ||
      constraints.allergens.length ||
      constraints.exclusions.length,
    );
    if (!hardConstraints) {
      try {
        external = (
          await this.provider.search(
            text ? `vegetarian ${text}` : 'vegetarian restaurant',
            lat,
            lng,
            radiusMeters,
            mapsFilters,
          )
        )
          .filter((p) => inArea(p.latitude, p.longitude))
          .map((p) => fromExternal(p, this.provider.name, lat, lng));
      } catch {
        externalDataUnavailable = true;
      }
    }
    const result = [...selected];
    for (const candidate of external) {
      if (
        result.some(
          (p) =>
            (p.externalPlaceId && p.externalPlaceId === candidate.externalPlaceId) ||
            (normalize(p.name) === normalize(candidate.name) &&
              distanceMeters(p.latitude, p.longitude, candidate.latitude, candidate.longitude) <
                80),
        )
      )
        continue;
      result.push(candidate);
    }
    result.sort((a, b) => {
      const aRating = a.rating ?? -1;
      const bRating = b.rating ?? -1;
      const q = text ? normalize(text) : '';
      const aScore = q && normalize(a.name).includes(q) ? 0 : 1;
      const bScore = q && normalize(b.name).includes(q) ? 0 : 1;
      return (
        bRating - aRating ||
        aScore - bScore ||
        (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity) ||
        a.id.localeCompare(b.id)
      );
    });
    return {
      data: result,
      meta: {
        page: 1,
        limit: result.length,
        total: result.length,
        resultsTruncated: resultsTruncated || external.length >= providerResultLimit,
        externalDataUnavailable,
        provider: this.provider.name,
        providerResultLimit,
        locationStored: false,
      },
    };
  }

  async get(id: string, userId?: string) {
    if (id.startsWith('google:') || id.startsWith('fake:')) {
      const prefix = `${this.provider.name.toLowerCase()}:`;
      if (!id.startsWith(prefix))
        throw new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Place not found' });
      let place: ExternalPlace | null;
      try {
        place = await this.provider.get(id.slice(prefix.length));
      } catch {
        throw new AppError({
          statusCode: 503,
          code: 'EXTERNAL_LOCATION_UNAVAILABLE',
          message: 'Maps provider unavailable',
        });
      }
      if (!place)
        throw new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Place not found' });
      const constraints = await this.constraints(userId);
      if (
        constraints.pattern ||
        constraints.traditions.length ||
        constraints.allergens.length ||
        constraints.exclusions.length
      ) {
        throw new AppError({
          statusCode: 404,
          code: 'NOT_FOUND',
          message: 'Place not verified for dietary constraints',
        });
      }
      return fromExternal(place, this.provider.name, place.latitude, place.longitude);
    }
    const place = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { externalRefs: true },
    });
    if (
      !place ||
      place.status !== RestaurantStatus.APPROVED ||
      !this.compatible(place, await this.constraints(userId))
    )
      throw new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Place not found' });
    return fromInternal(place);
  }

  async submit(userId: string, input: RestaurantInput) {
    const normalizedName = normalize(input.name);
    const normalizedAddress = normalize(input.address);
    const existing = await this.prisma.restaurant.findFirst({
      where: { normalizedName, normalizedAddress, status: { not: RestaurantStatus.REJECTED } },
    });
    if (existing) conflict('RESTAURANT_DUPLICATE', 'A matching place already exists');
    return this.prisma.restaurant.create({
      data: {
        name: input.name,
        normalizedName,
        address: input.address,
        normalizedAddress,
        latitude: input.latitude,
        longitude: input.longitude,
        categories: input.categories,
        dietTags: input.dietTags,
        allergenFreeCodes: input.allergenFreeCodes,
        excludedIngredients: input.excludedIngredients.map(normalize),
        source: RestaurantSource.MEMBER,
        submitterId: userId,
        auditEvents: { create: { actorId: userId, action: 'SUBMITTED' } },
      },
      include: { externalRefs: true },
    });
  }

  async adminList(query: AdminListQuery) {
    const where = { status: query.status };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.restaurant.count({ where }),
      this.prisma.restaurant.findMany({
        where,
        include: { externalRefs: true },
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async mine(userId: string, query: { page: number; limit: number }) {
    const where = { submitterId: userId };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.restaurant.count({ where }),
      this.prisma.restaurant.findMany({
        where,
        include: { externalRefs: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async history(id: string) {
    const exists = await this.prisma.restaurant.findUnique({ where: { id }, select: { id: true } });
    if (!exists)
      throw new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Place not found' });
    return this.prisma.restaurantAudit.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(id: string, adminId: string, input: ReviewInput) {
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.restaurant.updateMany({
        where: { id, status: RestaurantStatus.PENDING, submitterId: { not: adminId } },
        data: {
          status: input.decision,
          reviewerId: adminId,
          reviewedAt: new Date(),
          reviewReason: input.reason,
          dataCheckedAt: input.decision === 'APPROVED' ? new Date() : null,
        },
      });
      if (!result.count)
        conflict('RESTAURANT_REVIEW_CONFLICT', 'Place is not pending or cannot be self-reviewed');
      await tx.restaurantAudit.create({
        data: { restaurantId: id, actorId: adminId, action: input.decision, reason: input.reason },
      });
    });
    return this.prisma.restaurant.findUniqueOrThrow({
      where: { id },
      include: { externalRefs: true },
    });
  }

  async adminEdit(id: string, adminId: string, input: AdminEditInput) {
    const current = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!current)
      throw new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Place not found' });
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        name: input.name,
        normalizedName: normalize(input.name),
        address: input.address,
        normalizedAddress: normalize(input.address),
        latitude: input.latitude,
        longitude: input.longitude,
        categories: input.categories,
        dietTags: input.dietTags,
        allergenFreeCodes: input.allergenFreeCodes,
        excludedIngredients: input.excludedIngredients.map(normalize),
        dataCheckedAt: new Date(),
        auditEvents: { create: { actorId: adminId, action: 'EDITED', reason: input.reason } },
        ...(input.externalPlaceId
          ? {
              externalRefs: {
                deleteMany: {},
                create: { provider: 'GOOGLE', placeId: input.externalPlaceId },
              },
            }
          : {}),
      },
      include: { externalRefs: true },
    });
  }

  async geocode(address: string) {
    try {
      return { data: await this.provider.geocode(address), externalDataUnavailable: false };
    } catch {
      return { data: null, externalDataUnavailable: true };
    }
  }
}
