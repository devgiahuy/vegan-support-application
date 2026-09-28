# UI Implementation Plan — VeggieConnect

**Version:** 2.0

**Updated:** 2026-09-18

**Status:** Living frontend plan; integrate only READY APIs

Sources: `/docs/SRS.md`, `/docs/IMPLEMENTATION_PLAN.md`, `/docs/ROADMAP_PHASE_2.md`, `docs/BACKEND_INTEGRATION.md`, `docs/ARCHITECTURE.md`, and `docs/UI_UX_DESIGN_PROMPT.md`. OpenAPI plus the integration registry decide whether a screen can use live data.

## 1. Foundation decisions

- Vietnamese-first, responsive, keyboard/screen-reader accessible, and mobile touch targets at least 44×44 px.
- Use project design tokens, shadcn/ui, Lucide icons, `next-themes`, and Be Vietnam Pro.
- Follow DTO → Mapper → UI Model → TanStack Query. Components never consume raw DTOs.
- Mock UI is allowed only behind explicit development fixtures while an endpoint is `PLANNED`; never present it as implemented.
- Every data screen provides loading, error, empty, success, permission, and relevant partial/confidence/quota states.
- All AI/nutrition/freshness/compatibility output distinguishes canonical/calculated/AI-estimated/Contributor-verified status and shows appropriate disclaimer.

## 2. Current core routes

| Screen | Route | Domain |
|---|---|---|
| Home | `/` | discovery/recommendation |
| Login/Register | `/login`, `/onboarding` | auth/diet setup |
| Recipe list/detail/editor | `/recipes`, `/recipes/[id]`, `/recipes/new` | content/nutrition |
| Articles | `/articles`, `/articles/[id]` | content |
| Videos | `/videos`, `/videos/[id]`, `/videos/new` | content/review/storage |
| Weekly plans | `/meal-plans`, `/meal-plans/[id]`, `/meal-plans/saved` | meal planning |
| Profile | `/profile` | health/diet/privacy/contributor/storage |
| Pantry | `/pantry` | inventory/fridge/receipts |
| Custom meals | `/meals/custom`, `/meals/custom/[id]` | private meals |
| Multi-week programs | `/meal-programs`, `/meal-programs/[id]` | long-horizon planning |
| Restaurants | `/restaurants`, `/restaurants/[id]` | maps/location |
| AI assistant | `/assistant` | chat/artifacts |
| Admin | `/admin` | moderation/data/governance |

No page may be orphaned: every implemented route needs a natural navigation or contextual entry.

## 3. Screen delivery by backend phase

### Existing baseline — Phases 00–11

- Auth/session, profile/health, dietary rule confirmation.
- Category/ingredient lookup, content discovery, community interactions.
- Current legacy Contributor application UI; do not infer permissions from requested subtype.
- Moderation, personalized recommendations, weekly meal planner, and AI chat according to READY statuses.

### Phase 12 — Food knowledge

- Ingredient detail drawer with nutrient values, units, provenance, source/version, and unknown-data state.
- Admin food-source/import preview and curation screens.
- Reference intake and interaction-rule Admin views with evidence/severity badges.

### Phase 13 — Cooking-aware recipe nutrition

- Recipe editor gains ordered structured steps, cooking method, duration/temperature, and affected ingredients.
- Nutrition preview shows per-serving result, raw vs cooking-adjusted value, origin, coverage, assumptions, confidence/range, and uncovered ingredients.
- AI suggestion requires explicit acceptance and never looks identical to canonical data.

### Phase 14 — Unified Contributor

- Registration/profile form asks for Contributor request and requested approval basis, not subtype.
- Admin review selects final basis and decision reason.
- One Contributor badge/permission set. Basis may be secondary profile context only.
- During migration, use `CHANGING` guidance and do not mix legacy and target DTOs.

### Phases 15–16 — Storage and video

- Profile storage meter shows used/reserved/limit/remaining.
- Upload UI reserves quota, displays progress, commits/releases correctly, and handles quota errors.
- Video author screen displays draft/submitted/approved/rejected state and review reason/history.
- Admin content review uses the same interaction for recipe, handbook, and video.

### Phases 17–19 — Custom meals and deeper planning

- Custom meal editor: servings, ingredients, notes, multiple photos, arbitrary user tags, and source note. `shopee` is a tag, not an integration.
- Plan item picker supports a published recipe or private custom meal.
- Warning drawer/dialog explains portion, daily limit, same-dish/meal/day compatibility, evidence/source, confidence, affected items, and adjustment suggestion.
- Multi-week program timeline supports draft alternatives, confirmation, version conflict, repeated-pattern, and cumulative analysis states.

### Phases 20–22 — Pantry, fridge, and receipts

- Pantry list/editor with amount/unit, source, confidence, expiry note, history, and merge duplicates.
- Fridge scan accepts multiple images, shows asynchronous job progress, deduplicated candidate chips, quantity estimates, low-confidence warnings, and edit/confirm/reject flow.
- Never show “safe to eat”; use cautious freshness-observation copy.
- Receipt screen shows extracted candidate lines and requires confirmation before pantry update.
- Shopping-gap screen compares required/available/missing quantities and exposes unresolved conversions/assumptions.

### Phases 23–27 — Trust and operations

- AI artifact share/unshare and public detail use strict privacy presentation.
- Unified Contributor verification screen records conclusion/evidence; no expert subtype or certificate UI.
- Restaurants/location, in-app notifications, and Admin AI governance connect only once READY.
- Final accessibility, responsive, privacy, degraded-provider, and slow-network audit is part of Phase 27 integration.

## 4. Admin information architecture

Admin navigation should contain: overview; users; Contributor applications; content/video review; reports/comments; categories; ingredients/food data; restaurants; storage; AI governance/logs; and audit history. Hide or label modules whose endpoints are not READY.

## 5. Roadmap Phase 2 UI placeholders

Do not implement as live capabilities: video transcript/summary; wearable/HealthKit/Health Connect sync; extra dietary traditions; certificate/organization verification; storage purchase/payment; formal DMCA center; advanced frame/audio moderation; commerce/marketplace links; clinical medication interactions; push/native controls. Preserve these in product discovery only via `/docs/ROADMAP_PHASE_2.md`.

## 6. Mandatory integration workflow

1. Check endpoint status in `docs/BACKEND_INTEGRATION.md`.
2. Run `npm run sync:swagger` before adding/updating a consumer.
3. Add endpoint constants, separate DTOs/models/mappers, API functions, query keys/hooks, and mapper tests.
4. Implement all UI states and documented business errors.
5. Run TypeScript/tests/build required by `frontend/AGENTS.md`.
6. Update FE-integrated status, `docs/PROGRESS.md`, and `docs/WORK-LOG.md`.
