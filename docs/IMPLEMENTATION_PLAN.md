# Implementation Plan — Vegan Support Application

**Version:** 4.0

**Updated:** 2026-09-18

**Status:** Approved implementation baseline

**Current backend baseline:** Phases 00–11 completed; Phase 12 is next

## 1. Document authority

This plan translates `docs/SRS.md` into business rules, domain boundaries, state machines, and delivery phases. The exact execution order, completion gates, and standalone prompts are in `backend/docs/IMPLEMENTATION_PHASES.md`.

The current API contract may still contain legacy Contributor subtype fields until Phase 14. `frontend/docs/BACKEND_INTEGRATION.md` is authoritative for what is READY today. Post-MVP directions are retained in `docs/ROADMAP_PHASE_2.md`.

## 2. Approved decisions

| ID | Topic | Decision |
|---|---|---|
| D1 | Delivery | Implement vertical backend phases; every phase is independently verifiable and committed. |
| D2 | Personalization | MVP uses explainable behavioral scoring. Advanced embeddings/GenAI ranking remains in Roadmap Phase 2. |
| D3 | Contributor | One Contributor permission set. User applies during registration or later; Admin manually approves. Store approval basis only: `ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED`. |
| D4 | Vegetarian rules | Keep `dietPattern`, `practiceSchedule`, and `tradition`. MVP traditions: Buddhist and Christian. The system proposes rules and the user confirms/toggles each rule. |
| D5 | Publication | Recipes, handbooks, and videos require manual Admin approval. AI flags and reports are evidence for review, never automatic deletion. |
| D6 | Health data | MVP web uses user-entered measurements. HealthKit/Health Connect/wearables/phone-sensor research remains in Roadmap Phase 2. |
| D7 | Persistence | PostgreSQL + Prisma. |
| D8 | Backend | Node.js + Express + TypeScript, OpenAPI-first. |
| D9 | Maps | Internal restaurant records plus a provider adapter for Google Maps/Places/Geocoding. |
| D10 | Media | Cloudinary and permitted external video URLs; enforce per-file and per-account quotas before payments. |
| D11 | AI | Provider adapters; no model ID or quota in domain logic. AI output is advisory and auditable. |
| D12 | Food data | Canonical internal ingredient/nutrient database with provenance. External providers bootstrap/import data; AI is fallback/suggestion only. |
| D13 | Recipe nutrition | Estimate nutrition using ingredients and cooking process. Deterministic calculation is the baseline; AI may infer missing mappings/factors and must return confidence/assumptions. |
| D14 | Compatibility | Store evidence-graded daily limits and ingredient interaction rules for a dish and across selected meals. Only reviewed data can create hard rules. |
| D15 | Custom meals | Users may add private meals outside the public catalog, photos, and arbitrary user-created tags such as `shopee`; no marketplace API is implied. |
| D16 | Planning horizon | Support weekly plans first, then multi-week programs with cumulative and repeated-pattern analysis. |
| D17 | Recognition | Fridge input supports multiple images and quantity estimates. User confirmation is required before pantry/plan changes. |
| D18 | Receipts | Extract candidate purchased ingredients, require user confirmation, then update pantry and compute shopping gaps. |
| D19 | Video | Enforce storage first. Videos use recipe/handbook review parity. Formal DMCA and advanced audio/frame moderation are Roadmap Phase 2. |
| D20 | Certificates | No certificate verification in MVP. Future evidence badges do not silently introduce Contributor permission tiers. |
| D21 | Documentation | `docs/SRS.md` is canonical; runtime capability status stays in frontend integration docs; roadmap is separate from implementation phases. |
| D22 | Safety | Nutrition, freshness, compatibility, BMI, and AI answers are educational support, not diagnosis or guaranteed safety. |

## 3. MVP scope

### 3.1 Existing baseline — Phases 00–11

- Foundation, authentication, profile, health metrics, dietary rule configuration.
- Ingredient/category catalog, recipes/handbooks/videos, search, comments, votes/bookmarks.
- Legacy Contributor workflow, content moderation, behavioral recommendations.
- Weekly meal planner and AI nutrition chatbot.

These capabilities remain subject to the READY statuses in the frontend integration contract.

### 3.2 Reviewed MVP extension — Phases 12–27

- Canonical food/nutrient knowledge base, reference intake limits, retention/yield data, and interaction rules.
- Cooking-aware nutrition calculation with AI-assisted fallback and explicit provenance.
- Migration from Contributor subtypes to one role with an approval basis.
- Account storage quota and reservation accounting.
- Video review parity.
- Private custom meals, multiple photos, and user-created tags.
- Portion, daily-limit, and cross-dish compatibility analysis.
- Multi-week programs.
- Pantry inventory, multi-image fridge recognition, quantity estimation, receipt analysis, and shopping gaps.
- AI draft sharing and unified Contributor verification.
- Restaurants/maps, notifications, AI governance, and final hardening.

### 3.3 Deferred

All deferred ideas are retained in `docs/ROADMAP_PHASE_2.md`, including advanced GenAI ranking, video transcription/summarization, wearable integration, regional seasonality, more traditions, credential verification, storage payments, formal DMCA operations, advanced moderation, and clinical-grade interactions.

## 4. Domain model direction

Names below express domain intent; each active phase must reconcile them with the current Prisma schema and migration history.

### 4.1 Identity, diet, and Contributor

```text
User
UserProfile
HealthMetric
DietPreference
DietRuleDefinition
UserDietRule
ContributorApplication
ContributorProfile
ContributorDecision

Role                     MEMBER | CONTRIBUTOR | ADMIN
ContributorApplication   PENDING | APPROVED | REJECTED | WITHDRAWN
ContributorApprovalBasis ORGANIZATION_AFFILIATION
                         | PLATFORM_TRACK_RECORD
                         | ADMIN_INVITED
```

Legacy `requestedContributorType`, `approvedContributorType`, and `contributorType` fields are removed or migrated in Phase 14. Approval basis is descriptive audit data, not authorization input.

### 4.2 Content, review, and community

```text
Post
PostRevision
RecipeDetail
RecipeIngredient
RecipeStep
PostMedia
PostReview
ModerationSignal
UserReport
Comment
Vote
Bookmark
Category
UserTag
```

`Post` supports `RECIPE`, `HANDBOOK`, and `VIDEO`. Publication state is separate from automated moderation signals.

### 4.3 Food knowledge and nutrition

```text
CanonicalIngredient
IngredientAlias
IngredientMeasureConversion
NutrientDefinition
IngredientNutrientValue
FoodDataSource
FoodDataImport
ReferenceIntake
IngredientIntakeGuideline
CookingMethod
NutrientRetentionFactor
CookingYieldFactor
IngredientInteractionRule
NutritionEstimate
NutritionEstimateLine
NutritionVerification
```

All imported or curated values carry source, version, locale/applicability, review state, and timestamps. Compatibility rules also carry evidence grade and severity.

### 4.4 Storage, pantry, and recognition

```text
StoragePolicy
StorageAccount
StorageReservation
MediaAsset
PantryItem
RecognitionJob
RecognitionInput
RecognitionCandidate
ReceiptJob
ReceiptCandidate
```

Recognition candidates are proposals. Only confirmed candidates create or update pantry items.

### 4.5 Planning

```text
MealPlan
MealPlanDay
MealPlanItem
CustomMeal
CustomMealIngredient
CustomMealMedia
CustomMealTag
MealAnalysis
MealWarning
MealProgram
MealProgramWeek
ShoppingList
ShoppingListItem
```

A meal item references either published content or a private custom meal through an explicit source type.

### 4.6 AI, behavior, restaurant, and notification

```text
AiRequestLog
AiArtifact
AiFeedback
BehaviorEvent
RecommendationSnapshot
Restaurant
RestaurantExternalRef
Notification
```

AI artifacts keep provider/model version, input/output trace metadata, prompt/template version, status, and relevant confidence/provenance without retaining unnecessary sensitive text.

## 5. Business logic baseline

### BL-01 — Contributor application and authorization

1. A user may request Contributor status during registration or from an existing Member account.
2. A user-initiated request records motivation and may claim `ORGANIZATION_AFFILIATION` or `PLATFORM_TRACK_RECORD`; it does not grant permission. `ADMIN_INVITED` is created only by an Admin invitation/approval path.
3. Certificates are neither required nor verified in MVP.
4. An Administrator manually approves or rejects with a reason. Approval records the final approval basis.
5. For `ORGANIZATION_AFFILIATION`, retain the organization claim and reference links; no certificate verification is implied. For `PLATFORM_TRACK_RECORD`, store an immutable review-time snapshot of relevant post history and interaction/quality aggregates. For `ADMIN_INVITED`, retain inviter and reason.
6. Approved users receive the single `CONTRIBUTOR` role/profile. Every Contributor has equal permissions.
7. Approval basis/evidence may be displayed as context but must never branch RBAC.
8. Rejection leaves the user as Member and follows an explicit reapplication policy.
9. Revocation is an audited Admin action and removes Contributor-only authorization.

### BL-02 — Diet rules and precedence

1. Selecting a diet pattern or tradition returns a versioned default rule set.
2. The user confirms and may toggle individual rules. Store enabled state and rule version.
3. Effective constraints use this precedence:
   - allergies and explicit ingredient exclusions;
   - enabled diet-pattern rules;
   - enabled tradition rules for the current practice schedule;
   - health/nutrition limits;
   - preferences and ranking signals.
4. Hard constraints remove candidates before scoring. Ranking cannot restore them.
5. MVP supports Buddhist and Christian traditions; the model remains extensible.

### BL-03 — Practice schedule

- `ALWAYS` rules apply continuously.
- Periodic schedules use local date/time and explicit recurrence configuration.
- User overrides are versioned and explainable.
- Missing/ambiguous schedules fail safely by asking for confirmation rather than inferring religious observance.

### BL-04 — Canonical ingredients and compatibility

1. Recipe ingredients map to canonical records; aliases are locale-aware.
2. Quantities normalize to mass where a reviewed conversion exists.
3. Nutrients use a known basis, normally per 100 g edible portion.
4. Daily reference/upper limits specify population, unit, source, and version.
5. Ingredient intake guidelines separately specify ingredient amount/frequency, period (for example per day), population/applicability, unit, evidence grade, source, severity, and review state.
6. Ingredient interaction rules identify scope (`SAME_DISH`, `SAME_MEAL`, `SAME_DAY`), direction, severity, applicability, evidence grade, source, and review status.
7. AI may propose a mapping or rule but cannot activate a hard rule. An authorized review action is required.
8. Unknown ingredients remain visible as unknown/estimated; they are not silently treated as zero nutrition.

### BL-05 — Cooking-aware recipe nutrition

1. Normalize ingredient quantities and calculate the raw canonical baseline.
2. Parse structured recipe steps into cooking method, duration, temperature, and yield context.
3. Apply reviewed yield and nutrient-retention factors when available.
4. AI may suggest mappings/factors for free text or missing data, using both ingredients and cooking process.
5. Store per-value origin: `CANONICAL_CALCULATED`, `AI_ESTIMATED`, `USER_PROVIDED`, or `VERIFIED_OVERRIDE`.
6. Return assumptions, confidence, uncertainty range, uncovered ingredients, source versions, and calculation version.
7. AI estimates never overwrite canonical food data. Corrections create versioned records.
8. Recalculate when ingredient quantities, serving count, cooking steps, or source/factor versions change.

### BL-06 — Content and video review lifecycle

1. Author creates a draft and submits a specific immutable revision.
2. Automated moderation may attach signals but cannot publish, reject, or delete.
3. Admin approves or rejects with reason. Only approved revision becomes public.
4. Editing approved content creates a new draft revision; the last approved revision remains public until replacement approval.
5. Recipe, handbook, and video use the same state principles.
6. Ownership, moderation evidence, review events, and media references are retained according to policy.
7. DMCA-specific workflow is not claimed in MVP.

### BL-07 — Community and moderation

- Only authenticated users comment/vote/bookmark.
- Vote uniqueness and mutation idempotency are backend enforced.
- Reports and AI flags create moderation signals.
- Removal requires an Admin decision and reason; no signal performs hard deletion automatically.
- Contributor role does not grant final moderation or publication authority.

### BL-08 — Storage quota

1. Validate MIME, extension, declared size, actual provider result, and per-file limit.
2. Atomically reserve account quota before upload; commit actual bytes after success.
3. Release expired/failed reservations and decrement committed use only after a valid asset deletion.
4. Prevent concurrent uploads from exceeding quota.
5. Return used, reserved, limit, and remaining bytes plus typed quota errors.
6. Admin may configure policy or grant audited adjustments. MVP has no payment flow.

### BL-09 — Custom meals and user tags

- A custom meal is private to its owner unless a later approved flow publishes it.
- It may contain name, notes, servings, structured ingredients, nutrition estimate, multiple images, source note, and arbitrary tags.
- Tags such as `shopee` are normalized user text, not provider identities or API calls.
- A custom meal can be inserted into a plan and analyzed like a recipe when sufficient ingredient data exists.

### BL-10 — Meal planning and compatibility

1. Determine energy target from stored health/profile inputs and make assumptions explicit.
2. Apply dietary/allergy constraints before assembling candidates.
3. Use serving size, portion guidance, ingredient amounts, canonical nutrients, and cooking-aware estimates.
4. Check daily limits and interaction rules within a dish, meal, and day.
5. Return warning code, severity, evidence/source, affected items, explanation, and suggested adjustment.
6. Warnings support tooltip/dialog UX and do not claim medical certainty.
7. The user chooses among suggestions before final insertion; swap/regenerate preserves hard constraints.
8. Unknown data lowers confidence instead of being treated as safe or nutritionally zero.

### BL-11 — Multi-week programs

- A program contains ordered weeks with dates/timezone and plan snapshots.
- Repeated-pattern and cumulative nutrient checks span the configured horizon.
- Editing one week invalidates affected later analyses and shopping projections.
- Generated programs are drafts until the user confirms them.

### BL-12 — Pantry, fridge images, and receipts

1. Pantry quantities retain unit, normalized amount when possible, source, confidence, and confirmation state.
2. One fridge-recognition job accepts multiple images; deduplicate candidates across images.
3. AI may estimate item, amount, unit, and freshness observation. Never state definitive food safety.
4. The user confirms/edits/rejects candidates before pantry update.
5. Receipt extraction follows the same confirmation boundary and records source image/job.
6. Meal suggestions use confirmed pantry state and offer multiple candidates.
7. Shopping gaps are computed only after recipe/custom-meal choice, servings, unit conversion, and confirmed pantry inventory.
8. Shopping items show required, available, missing, unit, conversion assumptions, and confidence.

### BL-13 — Behavioral recommendations

- Record only approved event types with retention and privacy controls.
- Explainable scoring may use searches, chats, views, saves, votes, plan selections, swaps, and skips.
- Hard constraints run before ranking.
- Guest ranking is contextual/non-personalized.
- Users can reset or opt out of behavioral history when implemented.

### BL-14 — Chatbot and AI artifacts

- Guest quota is smaller than authenticated quota and protected from trivial bypass.
- AI provider/model is configuration and logged per request.
- Health/profile context is used only for the requested purpose.
- Answers provide uncertainty/safety guidance and never mutate canonical data automatically.
- Saved/shareable outputs become versioned AI artifacts and enter the applicable review flow.

### BL-15 — Contributor verification

- Every approved Contributor may verify an eligible AI artifact; approval basis does not matter.
- Verification records conclusion, evidence note, scope, actor, time, artifact version, and supersession.
- Verification is a human opinion/audit event, not proof of scientific correctness.
- Admin can review/revoke verification without deleting the original audit event.

### BL-16 — Restaurants and maps

- Use internal and external-source records through adapters.
- Deduplicate using provider reference first, then normalized name/location heuristics.
- Location requires consent or explicit user entry.
- Dietary compatibility is applied before distance/relevance ranking.
- Respect provider caching, attribution, and retention terms.

### BL-17 — Notifications

- Domain events create idempotent in-app notifications.
- Users can list, paginate, mark read, and view an unread count.
- Required events include content/contributor decisions, reports, quota warnings, and AI-verification outcomes.
- Email/push/realtime delivery is post-MVP unless separately approved.

### BL-18 — AI governance

- Log capability, provider/model, prompt/template version, latency, status, token/cost metadata when available, safety result, and correlation ID.
- Minimize/redact sensitive content and restrict log access.
- Track feedback, failure rate, moderation outcomes, recognition/extraction corrections, estimate coverage, and verification outcomes.
- Admin feature toggles disable a capability/provider with a defined fallback.
- AI signals do not trigger permanent user/content sanctions automatically.

### BL-19 — Account lifecycle and retention

- Soft-delete or anonymize where legal/audit retention is required.
- Deletion jobs cover profile, health, behavior, AI, pantry, receipt, recognition, media, and location data according to policy.
- Public content ownership/display after account deletion follows an explicit policy and audit trail.

## 6. RBAC summary

| Capability | Guest | Member | Contributor | Admin |
|---|:---:|:---:|:---:|:---:|
| View/search published content | ✓ | ✓ | ✓ | ✓ |
| Limited chatbot | ✓ |  |  |  |
| Full member chatbot and planning |  | ✓ | ✓ | ✓ |
| Manage own content/comments/media |  | ✓ | ✓ | ✓ |
| Comment/vote/bookmark |  | ✓ | ✓ | ✓ |
| Apply for Contributor |  | ✓ |  |  |
| Verify eligible AI artifact |  |  | ✓ | ✓ |
| Final content/video publication decision |  |  |  | ✓ |
| Final moderation/removal decision |  |  |  | ✓ |
| Contributor approval/revocation |  |  |  | ✓ |
| Manage categories, food data, quotas, AI configuration |  |  |  | ✓ |

## 7. State machines

### 7.1 Content revision

```text
DRAFT -> SUBMITTED -> APPROVED
                   -> REJECTED -> DRAFT (new revision/resubmission)

APPROVED --edit--> DRAFT (new revision; previous approved revision remains public)
APPROVED --admin moderation decision--> HIDDEN/REMOVED
```

### 7.2 Contributor application

```text
PENDING -> APPROVED
        -> REJECTED
        -> WITHDRAWN

APPROVED -> REVOKED (audited account/profile transition)
```

Approval records one basis; no subtype is selected.

### 7.3 AI estimate and verification

```text
GENERATED -> USER_CONFIRMED (where applicable)
          -> CONTRIBUTOR_VERIFIED
          -> SUPERSEDED
          -> REJECTED
```

Canonical promotion is a separate Admin-reviewed operation, not an implicit verification result.

### 7.4 Upload reservation

```text
RESERVED -> COMMITTED
         -> RELEASED
         -> EXPIRED
```

### 7.5 Recognition/receipt job

```text
QUEUED -> PROCESSING -> NEEDS_CONFIRMATION -> CONFIRMED
                    -> FAILED
                    -> CANCELLED
```

## 8. Delivery slices after Phase 11

| Phase | Vertical outcome | Main dependency |
|---:|---|---|
| 12 | Food and nutrient knowledge base | Phase 03 |
| 13 | Cooking-aware recipe nutrition | 04, 11, 12 |
| 14 | Unified Contributor trust migration | 01, 06, 07, 08 |
| 15 | Storage quota and upload accounting | 01, 04 |
| 16 | Video review parity | 04, 08, 15 |
| 17 | Custom meals, photos, user tags | 04, 12, 15 |
| 18 | Portion and compatibility analysis | 02, 10, 12, 13, 17 |
| 19 | Multi-week meal programs | 10, 17, 18 |
| 20 | Pantry inventory | 03, 12, 15 |
| 21 | Multi-image fridge recognition | 11, 15, 20 |
| 22 | Receipt analysis and shopping gaps | 10, 12, 15, 20 |
| 23 | AI sharing and Contributor verification | 11, 13, 14, 21, 22 |
| 24 | Restaurants and Google Maps | 01, 02 |
| 25 | In-app notifications | 01, 08, 14, 16, 23, 24 |
| 26 | Admin AI governance | 08, 11, 13, 16, 21, 22, 23 |
| 27 | Cross-cutting hardening/release gate | 00–26 |

Each phase owns its Prisma migration/seed, routes, OpenAPI, integration document update, lint/typecheck/build, and one scoped commit. Detailed prompts define exact endpoints without relying on session memory.

## 9. External data/provider strategy

Detailed source evaluation and links are maintained in `docs/FOOD_DATA_SOURCES.md`.

### 9.1 Food composition

- Prefer a provider-neutral import layer and a canonical internal schema.
- USDA FoodData Central is a suitable broad bootstrap source.
- The Vietnamese Food Composition Table is important for regional curation; licensing/access must be confirmed before digital import.
- Open Food Facts may supplement packaged/barcode data, but crowd-sourced records require validation and license compliance.
- Commercial providers such as Edamam or Nutritionix remain optional adapters, not domain dependencies.

### 9.2 Reference intake and cooking factors

- Reference intake/upper limits must identify authoritative source, population, unit, and revision.
- Nutrient retention and recipe yield use reviewed factor tables where possible.
- Recipe calculation remains an estimate because cooking time, temperature, water/fat transfer, and household technique vary.

### 9.3 AI boundary

AI may normalize text, propose ingredient matches, infer cooking methods, estimate missing values, and explain results. It may not silently author canonical nutrient facts, interaction rules, upper limits, or publication/moderation decisions.

## 10. Verification strategy

### Backend phase gate

- Prisma migration/seed requirements completed and reviewed.
- Authorization, ownership, validation, idempotency, pagination, and state transitions handled.
- OpenAPI `/api-docs.json` matches implementation.
- `frontend/docs/BACKEND_INTEGRATION.md` updated without marking incomplete endpoints READY.
- Backend lint, typecheck, build, and `git diff --check` pass.
- Repository policy currently does not require new automated backend test infrastructure.

### Frontend integration gate

- Integrate only READY endpoints after `npm run sync:swagger`.
- Use endpoint constants, DTO/Model/Mapper/API/Query layers, mapper tests, and typed business errors.
- Provide loading, error, empty, success, permission, quota, confidence, and partial-result states as relevant.
- Update FE-integrated status, progress, and work log.

### Critical end-to-end scenarios

1. User applies for Contributor; remains Member until manual approval; all approved Contributors receive identical permissions.
2. Diet/allergy rules remove prohibited items before recommendation ranking.
3. Recipe nutrition reflects ingredient data plus cooking steps and displays estimated/provenance fields.
4. Concurrent upload reservations cannot exceed account quota.
5. Video remains unpublished until Admin approval.
6. User adds a tagged custom meal and receives portion/compatibility warnings.
7. Multi-image fridge results require confirmation before pantry update.
8. Receipt candidates require confirmation; shopping gaps reflect confirmed pantry and selected servings.
9. AI flag/report cannot hard-delete content without Admin action.
10. AI provider is disabled and the capability follows its documented fallback.

## 11. Definition of Done

A phase is complete only when:

- all prompt acceptance criteria are met;
- no later-phase feature was partially smuggled into the phase;
- schema changes include safe migration and seed handling;
- observable contract, enums, errors, authorization, and state changes are documented;
- runtime status is honest (`PLANNED`, `IN_PROGRESS`, `CHANGING`, `READY`, `DEPRECATED`, or `REMOVED`);
- required quality gates pass;
- one scoped commit uses the specified message;
- the phase completion record and changelogs are updated.

## 12. Principal risks and controls

| Risk | Control |
|---|---|
| Nutrition estimate presented as exact | Provenance, uncertainty, assumptions, and educational disclaimer |
| AI invents ingredient facts/rules | Suggestion-only staging plus reviewed promotion |
| Poor local food coverage | Provider-neutral imports plus Vietnamese curation and aliases |
| Contributor basis becomes hidden RBAC | Single role; explicit review of authorization paths |
| Upload race exceeds quota | Transactional reservation/commit/release accounting |
| False freshness or compatibility certainty | Evidence grade, severity, confidence, and cautious language |
| Recognition/receipt corrupts pantry | Mandatory user confirmation boundary |
| Video abuse/copyright exposure | Manual review and storage controls now; formal legal workflow later |
| Behavioral personalization violates diet rules | Filter hard constraints before ranking |
| Phase 2 ideas are forgotten or accidentally claimed READY | Dedicated roadmap plus explicit status taxonomy |

## 13. Change record

- **4.0 — 2026-09-18:** Consolidated product decisions after Phase 11 review; added food database, cooking-aware nutrition, unified Contributor, quota, video parity, custom meals/tags, compatibility, multi-week planning, pantry, fridge and receipt workflows; expanded phases to 27; moved all deferred work into the complete Phase 2 roadmap.
