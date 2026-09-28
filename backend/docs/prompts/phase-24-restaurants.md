# Prompt — Phase 24: Restaurants & Google Maps

Implement Phase 24 from the current repository root in a new session.

Read root `AGENTS.md`, `docs/SRS.md`, BL-16, current profile/diet code, phase map, OpenAPI, and frontend integration guide. Verify Phases 01 and 02.

## Goal

Provide nearby vegetarian restaurant/shop discovery from internal records plus a maps-provider adapter, with consent and dietary filtering.

## Required scope

- Model internal places, normalized address/coordinates, categories/diet tags, source, external references, submission/review status, and cache metadata.
- Implement `MapsProvider` with fake/local adapter and optional Google Places/Geocoding adapter configured via environment.
- Nearby/search uses explicit coordinates or permitted user location, radius/bounds, pagination, dietary hard filtering, then relevance/distance ranking.
- Deduplicate by provider reference first, then conservative normalized name/location heuristics.
- Support Member submission and Admin review/edit; provider results do not automatically become trusted internal records.
- Return source/attribution, distance, match reasons, data freshness, and provider-degraded behavior.
- Respect provider caching/retention terms; do not store continuous location history.

## Acceptance and handoff

- Validate no-location flow, invalid radius, dietary filters, dedupe, provider failure/fallback, attribution, submission/review, ownership, and Admin actions.
- Update migration/config/fake fixtures, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, fake-provider flow, OpenAPI validation, and `git diff --check`.
- Commit exactly:

```text
feat(restaurants): add location and maps integration
```

Final report: hash, provider/cache policy, READY endpoints, and unrun live checks.
