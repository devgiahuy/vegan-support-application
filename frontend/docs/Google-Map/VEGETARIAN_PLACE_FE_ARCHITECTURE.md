# Vegetarian Place Discovery — FE-Only Architecture & Backend Migration Strategy

**Project:** VeggieConnect
**Feature:** Vegetarian / Vegan Place Discovery
**Architecture Version:** 1.0
**Current Strategy:** FE-only Google Maps / Places integration
**Future Strategy:** FE → VeggieConnect Backend → Google Places API
**Status:** Approved for MVP implementation

---

## 1. Purpose

This document defines the frontend architecture for integrating Google Maps and Google Places into VeggieConnect while keeping the system prepared for a future Backend integration.

The MVP intentionally uses a frontend-only architecture to reduce initial development time and infrastructure complexity.

However, the implementation MUST introduce an abstraction layer between the application feature and Google APIs.

The objective is:

```text
MVP

Web / Mobile
     ↓
Place Provider
     ↓
Google Places API
```

while preserving the ability to migrate to:

```text
Future

Web / Mobile
     ↓
Place Provider
     ↓
VeggieConnect Backend
     ↓
Google Places API
```

The migration should primarily require changing the provider implementation rather than rewriting the feature layer.

---

# 2. Architecture Goals

## 2.1 Primary Goals

The MVP must support:

- Current user location
- Nearby vegetarian places
- Nearby vegan places
- Search places
- Map display
- Place markers
- Place list
- Distance calculation
- Place details
- Opening status
- Rating
- Google Maps navigation
- Loading states
- Error states
- Empty states

## 2.2 Future Compatibility Goals

The architecture should allow future support for:

- Backend caching
- PostgreSQL place persistence
- Redis caching
- User reviews
- Saved places
- Community verification
- Vegan / vegetarian classification
- AI place classification
- Recommendation engine
- Personalized place ranking
- Analytics
- Centralized rate limiting

---

# 3. Current Architecture

The MVP uses:

```text
                    Google
              ┌─────────────────┐
              │ Maps JavaScript  │
              │ Places API       │
              └────────┬────────┘
                       │
                       ▼
               Place Provider
                       │
                       ▼
              Place Feature Layer
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Website             Mobile
          Next.js           React Native
```

The important architectural rule is:

> Feature code MUST NOT call Google Places APIs directly.

Do NOT implement:

```text
Component
   ↓
Google Places API
```

Do NOT implement:

```text
Hook
   ↓
Google Places API
```

Instead:

```text
Component
   ↓
Feature Hook
   ↓
Place Service
   ↓
Place Provider
   ↓
Google
```

---

# 4. Target Architecture

## 4.1 Current MVP

```text
┌───────────────────────┐
│      Website          │
│       Next.js         │
└───────────┬───────────┘
            │
            │
┌───────────▼───────────┐
│    Place Feature      │
│                       │
│ Search / Nearby / UI  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    Place Service      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  Google Place Provider│
└───────────┬───────────┘
            │
            ▼
      Google Places
```

Mobile follows the same application architecture.

---

# 5. Future Architecture

When Backend support is introduced:

```text
┌───────────────────────┐
│      Website          │
└───────────┬───────────┘
            │
            ▼
      Place Feature
            │
            ▼
      Place Service
            │
            ▼
     Backend Provider
            │
            ▼
┌───────────────────────┐
│ VeggieConnect Backend │
│                       │
│ Place Service         │
│ Cache                 │
│ Database              │
│ AI                    │
└───────────┬───────────┘
            │
            ▼
      Google Places
```

The feature layer remains unchanged.

The main change is:

```text
GooglePlaceProvider
```

to:

```text
VeggieConnectPlaceProvider
```

---

# 6. Core Architectural Principle

The application MUST depend on an internal Place domain model rather than Google's raw response model.

Bad:

```ts
function renderPlace(place: GooglePlaceResult) {
  // ...
}
```

Good:

```ts
function renderPlace(place: Place) {
  // ...
}
```

The application should understand:

```ts
Place;
```

not:

```ts
GooglePlaceResult;
```

---

# 7. Internal Place Model

Define an internal model.

Example:

```ts
export interface Place {
  id: string;
  providerId: string;

  name: string;

  location: {
    latitude: number;
    longitude: number;
  };

  address?: string;

  rating?: number;

  reviewCount?: number;

  distanceMeters?: number;

  openingStatus?: PlaceOpeningStatus;

  dietType?: PlaceDietType;

  isVeganFriendly?: boolean;

  photos?: PlacePhoto[];

  googleMapsUri?: string;
}
```

Enums:

```ts
export enum PlaceDietType {
  VEGAN = 'VEGAN',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN_FRIENDLY = 'VEGAN_FRIENDLY',
  UNKNOWN = 'UNKNOWN',
}
```

```ts
export enum PlaceOpeningStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  UNKNOWN = 'UNKNOWN',
}
```

The model should contain only fields required by VeggieConnect.

Do not copy Google's entire response structure into the application model.

---

# 8. Provider Interface

Create a provider abstraction.

Example:

```ts
export interface PlaceProvider {
  searchNearby(params: SearchNearbyParams): Promise<Place[]>;

  search(params: SearchPlaceParams): Promise<Place[]>;

  getDetails(placeId: string): Promise<Place | null>;
}
```

Optional future methods:

```ts
export interface PlaceProvider {
  searchNearby(params: SearchNearbyParams): Promise<Place[]>;

  search(params: SearchPlaceParams): Promise<Place[]>;

  getDetails(placeId: string): Promise<Place | null>;
}
```

The interface MUST NOT contain Google-specific concepts unless they are part of the application domain.

---

# 9. Google Provider

Current MVP implementation:

```text
PlaceProvider
      ▲
      │
GooglePlaceProvider
      │
      ▼
Google Places API
```

Example:

```ts
export class GooglePlaceProvider implements PlaceProvider {
  async searchNearby(params: SearchNearbyParams): Promise<Place[]> {
    // Call Google Places
    // Transform Google response
    // Return internal Place[]
  }

  async search(params: SearchPlaceParams): Promise<Place[]> {
    // Call Google Text Search
  }

  async getDetails(placeId: string): Promise<Place | null> {
    // Call Google Place Details
  }
}
```

The Google provider is responsible for:

- Google API communication
- Google response parsing
- Google-specific error handling
- Mapping Google data to internal `Place`
- Provider-specific implementation details

---

# 10. Google Response MUST Be Mapped

Never expose raw Google data to the rest of the application.

Bad:

```text
Google API
   ↓
Google response
   ↓
React component
```

Good:

```text
Google API
   ↓
GooglePlaceProvider
   ↓
mapGooglePlaceToPlace()
   ↓
Place
   ↓
Application
```

Example:

```ts
function mapGooglePlaceToPlace(googlePlace: GooglePlace): Place {
  return {
    id: googlePlace.id,
    providerId: googlePlace.id,

    name: googlePlace.displayName,

    location: {
      latitude: googlePlace.location.latitude,
      longitude: googlePlace.location.longitude,
    },

    address: googlePlace.formattedAddress,

    rating: googlePlace.rating,

    reviewCount: googlePlace.userRatingCount,

    googleMapsUri: googlePlace.googleMapsUri,
  };
}
```

This mapper is important for future migration.

---

# 11. Place Service

The feature should communicate with a service rather than the provider directly.

```ts
export class PlaceService {
  constructor(private readonly provider: PlaceProvider) {}

  async getNearbyPlaces(params: SearchNearbyParams): Promise<Place[]> {
    return this.provider.searchNearby(params);
  }

  async searchPlaces(params: SearchPlaceParams): Promise<Place[]> {
    return this.provider.search(params);
  }

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    return this.provider.getDetails(placeId);
  }
}
```

This gives us:

```text
Feature
   ↓
PlaceService
   ↓
PlaceProvider
```

instead of:

```text
Feature
   ↓
Google API
```

---

# 12. Provider Configuration

The application should not instantiate Google services throughout the codebase.

Use one provider composition point.

Example:

```ts
const placeProvider = new GooglePlaceProvider();

export const placeService = new PlaceService(placeProvider);
```

Future:

```ts
const placeProvider = new VeggieConnectPlaceProvider();

export const placeService = new PlaceService(placeProvider);
```

This is the main migration point.

---

# 13. Feature Layer

Recommended structure:

```text
features/
└── places/
    ├── components/
    │   ├── PlaceMap.tsx
    │   ├── PlaceCard.tsx
    │   ├── PlaceList.tsx
    │   ├── PlaceFilters.tsx
    │   ├── PlaceDetail.tsx
    │   └── PlaceBottomSheet.tsx
    │
    ├── hooks/
    │   ├── useNearbyPlaces.ts
    │   ├── usePlaceSearch.ts
    │   ├── usePlaceDetails.ts
    │   └── useUserLocation.ts
    │
    ├── services/
    │   └── placeService.ts
    │
    ├── providers/
    │   └── googlePlaceProvider.ts
    │
    ├── mappers/
    │   └── googlePlaceMapper.ts
    │
    ├── types/
    │   ├── place.ts
    │   └── place-search.ts
    │
    └── constants/
        └── place.constants.ts
```

---

# 14. Website Architecture

Website:

```text
apps/web
```

Use:

```text
Next.js
Google Maps JavaScript API
Place Feature
Place Service
GooglePlaceProvider
```

Recommended flow:

```text
User
 ↓
Places Page
 ↓
useNearbyPlaces()
 ↓
PlaceService
 ↓
PlaceProvider
 ↓
Google Places
 ↓
Place[]
 ↓
UI
```

The map component should only care about:

```ts
Place[]
```

Example:

```tsx
<PlaceMap places={places} />
```

It should NOT care whether the places came from:

```text
Google
```

or:

```text
VeggieConnect Backend
```

---

# 15. Mobile Architecture

Mobile:

```text
apps/mobile
```

Use:

```text
React Native
Expo
Google Maps native integration
Place Feature
Place Service
GooglePlaceProvider
```

Flow:

```text
GPS
 ↓
useUserLocation()
 ↓
useNearbyPlaces()
 ↓
PlaceService
 ↓
PlaceProvider
 ↓
Google Places
 ↓
Place[]
 ↓
Map + Bottom Sheet
```

Mobile UI should also depend only on:

```ts
Place;
```

not Google's response.

---

# 16. Web and Mobile Should Share Domain Types

If Web and Mobile are inside a monorepo:

```text
packages/
└── place-domain/
    ├── types/
    │   └── place.ts
    ├── constants/
    └── utils/
```

Then:

```text
Web
 ↓
packages/place-domain

Mobile
 ↓
packages/place-domain
```

Both clients use the same:

```ts
Place;
PlaceDietType;
PlaceOpeningStatus;
SearchNearbyParams;
SearchPlaceParams;
```

This reduces inconsistencies between clients.

---

# 17. What Should NOT Be Shared

Do not force Google Maps UI code into shared packages.

Website:

```text
Google Maps JavaScript
```

Mobile:

```text
Google Maps Native
```

Therefore:

```text
packages/
└── place-domain/
```

can be shared.

But:

```text
PlaceMap.tsx
```

should remain platform-specific.

---

# 18. Nearby Place Flow

## 18.1 User Location

Website:

```text
Browser Geolocation
       ↓
latitude
longitude
```

Mobile:

```text
Native Location
       ↓
latitude
longitude
```

Normalize both to:

```ts
export interface UserLocation {
  latitude: number;
  longitude: number;
}
```

---

# 19. Nearby Search

Example:

```ts
const params: SearchNearbyParams = {
  location: {
    latitude,
    longitude,
  },

  radiusMeters: 3000,

  query: 'vegetarian restaurant',
};
```

Then:

```ts
const places = await placeService.getNearbyPlaces(params);
```

The feature layer does not know where the data comes from.

---

# 20. Vegetarian Filtering

The MVP may use Google's search capability and lightweight frontend filtering.

Example:

```ts
const VEGGIE_KEYWORDS = ['vegetarian', 'vegan', 'chay'];
```

However, this MUST be considered a heuristic rather than authoritative classification.

Do not claim:

```text
Google says this restaurant is vegetarian.
```

unless the source data explicitly supports that classification.

Use:

```text
Potentially vegetarian
```

or equivalent product wording when classification is heuristic.

---

# 21. Distance Calculation

The application can calculate distance between:

```text
User
```

and:

```text
Place
```

using latitude and longitude.

Recommended utility:

```ts
calculateDistanceMeters(userLocation, place.location);
```

Then:

```ts
places.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
```

This utility should be provider-independent.

---

# 22. Search and Filtering Responsibility

Separate provider search from UI filtering.

Provider:

```text
Search nearby vegetarian restaurants
```

Application:

```text
Sort by distance
Filter by supported dietary type
Filter by rating
Filter by open status
```

UI:

```text
User selects filters
```

This separation makes future Backend migration easier.

---

# 23. Map Rendering Responsibility

Map rendering is a UI responsibility.

Website:

```text
Google Maps JavaScript
```

Mobile:

```text
Google Maps Native
```

The map receives:

```ts
Place[]
```

and converts them into platform-specific markers.

Example:

```tsx
<PlaceMap places={places} selectedPlaceId={selectedPlaceId} />
```

The map component MUST NOT:

- Call Google Places Search
- Call Backend APIs
- Apply business classification
- Manage persistence
- Perform recommendation logic

---

# 24. Place Detail

Place detail flow:

```text
PlaceCard
   ↓
usePlaceDetails(placeId)
   ↓
PlaceService
   ↓
PlaceProvider
   ↓
Google
```

The UI receives:

```ts
Place;
```

rather than:

```ts
GooglePlace;
```

---

# 25. Error Handling

Provider errors should be converted into application-level errors.

Bad:

```ts
catch (GoogleApiError)
```

throughout the application.

Better:

```ts
PlaceServiceError;
```

Example:

```ts
export enum PlaceErrorCode {
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  SEARCH_FAILED = 'SEARCH_FAILED',
  PLACE_NOT_FOUND = 'PLACE_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
}
```

The UI handles:

```text
SEARCH_FAILED
```

rather than:

```text
Google HTTP 429
```

This is important for future Backend integration.

---

# 26. Loading / Empty / Error States

The UI should support:

```text
Loading
Empty
Success
Error
```

Example:

```text
Loading:
"Finding vegetarian places nearby..."

Empty:
"No vegetarian places found nearby."

Error:
"We couldn't load nearby places. Please try again."
```

These messages should not mention internal provider implementation.

---

# 27. API Key Strategy

Google client-side APIs may require client-side configuration.

Client keys MUST be restricted according to Google's recommended application restrictions.

For Website:

```text
HTTP referrer restriction
```

For Mobile:

```text
Application/package restrictions
```

Do not put unrestricted API keys into the application.

Do not commit secrets into Git.

Use environment-specific configuration.

Example:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

For Mobile, use the appropriate Expo/native configuration mechanism.

The actual configuration depends on the selected Google Maps SDK and deployment environment.

---

# 28. Future Backend Migration

When the Backend is ready, introduce:

```text
VeggieConnectPlaceProvider
```

Current:

```text
PlaceProvider
      ↓
GooglePlaceProvider
      ↓
Google
```

Future:

```text
PlaceProvider
      ↓
VeggieConnectPlaceProvider
      ↓
VeggieConnect API
      ↓
Google
```

The feature code remains:

```text
useNearbyPlaces()
usePlaceSearch()
usePlaceDetails()
PlaceMap
PlaceList
PlaceCard
```

No rewrite should be necessary.

---

# 29. Future Backend API Contract

The future Backend should expose a domain-oriented API.

Example:

```http
GET /api/v1/places/nearby
```

Parameters:

```text
latitude
longitude
radius
dietType
```

Search:

```http
GET /api/v1/places/search
```

Details:

```http
GET /api/v1/places/{placeId}
```

Future:

```http
POST /api/v1/places/{placeId}/reviews
POST /api/v1/places/{placeId}/save
POST /api/v1/places/{placeId}/reports
```

The Backend response should match the application's internal `Place` contract as closely as practical.

---

# 30. Future Backend Provider

Example:

```ts
export class VeggieConnectPlaceProvider implements PlaceProvider {
  async searchNearby(params: SearchNearbyParams): Promise<Place[]> {
    const response = await api.get('/places/nearby', {
      params,
    });

    return response.data.data;
  }

  async search(params: SearchPlaceParams): Promise<Place[]> {
    const response = await api.get('/places/search', {
      params,
    });

    return response.data.data;
  }

  async getDetails(placeId: string): Promise<Place | null> {
    const response = await api.get(`/places/${placeId}`);

    return response.data.data;
  }
}
```

---

# 31. Backend Migration Must NOT Change Feature APIs

Before migration:

```ts
useNearbyPlaces();
```

After migration:

```ts
useNearbyPlaces();
```

The caller remains unchanged.

Before:

```text
useNearbyPlaces
    ↓
PlaceService
    ↓
GooglePlaceProvider
```

After:

```text
useNearbyPlaces
    ↓
PlaceService
    ↓
VeggieConnectPlaceProvider
```

This is the primary architectural objective.

---

# 32. Recommended Provider Selection

Use a single composition point.

Example:

```ts
const provider =
  process.env.NEXT_PUBLIC_PLACE_PROVIDER === 'backend'
    ? new VeggieConnectPlaceProvider()
    : new GooglePlaceProvider();

export const placeService = new PlaceService(provider);
```

However, production builds should preferably use explicit environment configuration rather than runtime switching if the provider has substantially different authentication/security requirements.

Example:

```env
PLACE_PROVIDER=google
```

Future:

```env
PLACE_PROVIDER=veggieconnect
```

---

# 33. Do Not Create a Google Dependency Everywhere

Bad:

```text
PlaceCard
 → Google

PlaceList
 → Google

PlaceDetail
 → Google

Map
 → Google

Hook
 → Google
```

Good:

```text
                  PlaceService
                       │
                       ▼
                 PlaceProvider
                       │
                ┌──────┴──────┐
                ▼             ▼
             Google       VeggieConnect
```

Only the provider layer knows the external data source.

---

# 34. Caching Strategy

MVP FE-only:

```text
Google Places
      ↓
Client-side query/cache
```

Client caching may be implemented through the application's existing data-fetching strategy.

Future:

```text
Frontend
   ↓
Backend
   ↓
Redis
   ↓
Google Places
```

Do not build a complicated client cache specifically to replace Backend caching.

Client caching is for UX and reducing duplicate requests.

Backend caching is for centralized cost/performance control.

---

# 35. AI Integration Boundary

AI should NOT be placed directly inside:

```text
PlaceMap
PlaceCard
PlaceList
```

Future architecture:

```text
Google Place
      ↓
Backend
      ↓
AI Classification
      ↓
Place
```

For example:

```json
{
  "id": "place_123",
  "name": "Example Restaurant",
  "dietType": "VEGETARIAN",
  "veganConfidence": 0.87
}
```

The frontend simply displays the resulting domain information.

---

# 36. Community Verification Boundary

Future:

```text
User
 ↓
Report / Review
 ↓
VeggieConnect Backend
 ↓
Place Verification
 ↓
Place
```

Frontend:

```text
<VerificationBadge />
```

should depend on:

```ts
place.verificationStatus;
```

rather than directly querying Google.

---

# 37. Recommendation Boundary

Future recommendation:

```text
User
 +
Location
 +
Diet Preference
 +
Place Data
 +
Behavior
        ↓
Recommendation Service
        ↓
Recommended Place[]
```

Frontend receives:

```ts
Place[]
```

with optional metadata:

```ts
recommendationReason?: string;
recommendationScore?: number;
```

The frontend should not implement the recommendation algorithm.

---

# 38. Testing Strategy

## Unit Tests

Test:

```text
calculateDistanceMeters()
mapGooglePlaceToPlace()
filterVegetarianPlaces()
sortPlacesByDistance()
```

## Provider Tests

Test:

```text
GooglePlaceProvider
VeggieConnectPlaceProvider
```

independently.

## Feature Tests

Test:

```text
useNearbyPlaces
usePlaceSearch
usePlaceDetails
```

using a mocked `PlaceProvider`.

This is another major benefit of the abstraction.

---

# 39. Mock Provider

For development/testing, implement:

```ts
export class MockPlaceProvider implements PlaceProvider {
  async searchNearby(): Promise<Place[]> {
    return MOCK_PLACES;
  }

  async search(): Promise<Place[]> {
    return MOCK_PLACES;
  }

  async getDetails(placeId: string): Promise<Place | null> {
    return MOCK_PLACES.find((place) => place.id === placeId) ?? null;
  }
}
```

Then:

```text
PlaceService
      ↓
MockPlaceProvider
```

can be used without Google API access.

---

# 40. Production Readiness Checklist

## MVP

- [ ] Google Maps integration
- [ ] Google Places integration
- [ ] Location permission
- [ ] Nearby search
- [ ] Vegetarian search
- [ ] Place list
- [ ] Map markers
- [ ] Place details
- [ ] Distance
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] API key restrictions
- [ ] Provider abstraction
- [ ] Internal `Place` model
- [ ] Google response mapper
- [ ] Mock provider

## Future Backend

- [ ] VeggieConnect Place API
- [ ] Redis cache
- [ ] PostgreSQL
- [ ] Rate limiting
- [ ] Authentication
- [ ] User reviews
- [ ] Saved places
- [ ] Community verification
- [ ] AI classification
- [ ] Recommendation
- [ ] Analytics

---

# 41. Migration Checklist

When Backend is ready:

### Step 1

Create:

```text
VeggieConnectPlaceProvider
```

### Step 2

Implement:

```text
PlaceProvider
```

### Step 3

Connect to:

```text
/api/v1/places/*
```

### Step 4

Ensure Backend response maps to:

```ts
Place;
```

### Step 5

Replace provider composition:

```text
GooglePlaceProvider
```

with:

```text
VeggieConnectPlaceProvider
```

### Step 6

Run existing feature tests.

### Step 7

Verify:

```text
Search
Nearby
Details
Map
Distance
Filtering
```

### Step 8

Remove direct Google Places data access from the client if no longer required.

---

# 42. Migration Impact

The following SHOULD remain unchanged:

```text
PlaceMap
PlaceCard
PlaceList
PlaceDetail
PlaceFilters

useNearbyPlaces
usePlaceSearch
usePlaceDetails
useUserLocation

Place
SearchNearbyParams
SearchPlaceParams
```

The following SHOULD change:

```text
GooglePlaceProvider
        ↓
VeggieConnectPlaceProvider
```

and:

```text
Provider configuration
```

Potentially:

```text
Authentication
API configuration
Error mapping
```

This keeps migration cost low.

---

# 43. Final Architecture

## MVP

```text
                         Google
                    ┌─────────────┐
                    │ Maps /      │
                    │ Places API  │
                    └──────┬──────┘
                           │
                           ▼
                  GooglePlaceProvider
                           │
                           ▼
                     PlaceService
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
          Website                      Mobile
          Next.js                    React Native
             │                           │
       Google Maps JS             Google Maps Native
```

## Future

```text
                         Google
                            ▲
                            │
                    ┌───────┴────────┐
                    │ VeggieConnect  │
                    │    Backend     │
                    │                │
                    │ Place Service  │
                    │ Redis          │
                    │ PostgreSQL     │
                    │ AI             │
                    └───────┬────────┘
                            │
                            ▼
                 VeggieConnectProvider
                            │
                      PlaceService
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
              Website                Mobile
              Next.js              React Native
```

---

# 44. Architectural Decision

The project officially adopts:

> **FE-only Google Maps/Places integration for MVP, with a Provider/Service abstraction that isolates external Google dependencies from the feature layer.**

This provides the fastest path to MVP while preserving a migration path to a production Backend architecture.

The frontend must be designed around the **VeggieConnect Place domain**, not around the Google Places response structure.

The intended migration is:

```text
FE → Google
```

to:

```text
FE → VeggieConnect BE → Google
```

rather than rewriting the feature from scratch.

---

# 45. Non-Negotiable Rules

1. Feature components MUST NOT call Google Places directly.
2. Hooks MUST NOT contain Google API-specific implementation.
3. Google response types MUST NOT leak into the feature layer.
4. All Google responses MUST be mapped to internal `Place`.
5. All clients MUST depend on `PlaceProvider`.
6. Website and Mobile MUST share domain contracts where practical.
7. Website and Mobile MUST NOT be forced to share platform-specific Map UI.
8. Business logic MUST remain provider-independent.
9. Google API keys MUST be appropriately restricted.
10. Backend migration MUST be implemented as a provider replacement whenever possible.
11. The frontend MUST NOT assume that Google data is authoritative proof that a restaurant is vegan or vegetarian.
12. AI classification, community verification, reviews, and recommendation logic belong behind an application/backend boundary rather than inside map UI components.

---

# 46. Expected Result

The MVP should be capable of shipping with:

```text
Google Maps
+
Nearby vegetarian places
+
Location
+
Search
+
Filters
+
Place details
```

without requiring a Place Backend.

At the same time, the architecture must make it possible to evolve into:

```text
Google Places
        +
VeggieConnect Data
        +
Community Verification
        +
AI Classification
        +
Recommendation
        +
Redis
        +
PostgreSQL
```

without rewriting the core Place Discovery UI and feature layer.
