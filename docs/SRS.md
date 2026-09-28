# Software Requirements Specification — Vegan Support Application

**Version:** 1.0

**Updated:** 2026-09-18

**Status:** Approved product baseline

**Applies to:** backend, frontend, database, AI integrations, and implementation phases

## 1. Purpose and authority

This document is the canonical product requirement baseline. Detailed business rules and delivery sequencing live in:

- `docs/IMPLEMENTATION_PLAN.md`
- `backend/docs/IMPLEMENTATION_PHASES.md`
- `frontend/docs/BACKEND_INTEGRATION.md`
- `docs/ROADMAP_PHASE_2.md`
- `docs/FOOD_DATA_SOURCES.md`

When an older frontend SRS, UI prompt, completed phase prompt, or generated API document conflicts with this file, this file and the approved implementation plan take precedence. Generated API documents describe the currently deployed contract; they do not prove that a planned requirement is implemented.

## 2. Product scope

The application helps users discover and share vegetarian recipes, videos, and handbooks; manage dietary preferences; plan meals; understand nutrition; locate vegetarian restaurants; and use assisted AI features safely.

The MVP is delivered through backend Phases 00–27. Phases 00–11 are the existing baseline. Phases 12–27 incorporate the reviewed MVP requirements. “Roadmap Phase 2” means the post-MVP product roadmap and is not the same as a numbered backend implementation phase.

## 3. Actors and authorization

### 3.1 Guest

- Search and view published recipes, handbooks, and videos.
- Use a limited AI chatbot trial subject to rate limits.
- Register and sign in.

### 3.2 Member

- Has all Guest capabilities.
- Manage their own recipes, handbooks, videos, comments, votes, preferences, pantry, custom meals, meal plans, and AI conversations.
- Apply to become a Contributor during registration or later.
- Use personalized recommendations, meal planning, ingredient recognition, receipt analysis, restaurant discovery, and notifications when the corresponding phase is READY.

### 3.3 Contributor

- Has all Member capabilities.
- Share AI-generated drafts for community use after required review.
- Verify eligible AI nutrition or content suggestions with an evidence note.
- All Contributors have the same permissions. There are no nutrition-expert and experienced-practitioner permission tiers.

Contributor approval is manual and performed by an Administrator. The system stores one approval basis for audit and presentation only:

- `ORGANIZATION_AFFILIATION`
- `PLATFORM_TRACK_RECORD`
- `ADMIN_INVITED`

The approval basis never changes Contributor permissions. An applicant remains a Member until approval. Certificates are not verified in the MVP.
User-initiated applications may claim organization affiliation or platform track record. `ADMIN_INVITED` is assigned only through an Administrator invitation/approval path, never selected by a public registration form.
Approval audit data retains the relevant organization/reference claim, a review-time snapshot of platform post/interaction history, or the inviting Administrator and reason. This evidence is descriptive and does not create different permissions.

### 3.4 Administrator

- Manage members, content, categories, comments, moderation queues, contributor applications, storage policies, and reference food data.
- Review all submitted recipes, handbooks, and videos before publication.
- Review AI flags and user reports before any removal.
- Monitor AI providers, model configuration, logs, quality metrics, and failures; intervene manually.
- Manage restaurant data and notification operations when available.

## 4. Dietary model

Each user profile may define:

- `dietPattern`
- `tradition`
- `practiceSchedule`
- allergies and explicit ingredient exclusions
- health goal, body metrics, calorie target, and preferences

MVP traditions are Buddhist and Christian. Other traditions may be added without redesigning the profile schema or rule engine.

When a user selects a diet pattern or tradition, the backend provides a default rule set. The user confirms it and may enable or disable individual rules. Allergy rules, explicit exclusions, the selected diet pattern, and enabled tradition rules are hard constraints enforced by the backend. Recommendations must never reintroduce an item removed by these constraints.

## 5. Functional requirements

### FR-01 Accounts and profiles

- Register, authenticate, refresh sessions, and recover access according to the current authentication contract.
- Capture Contributor intent at registration or from an existing account without granting privileges.
- Store BMI inputs and calculated indicators with units and timestamps.
- Store dietary configuration and confirmed rule overrides.

### FR-02 Catalog and content

- Administrators manage food-type and recipe categories and normalized ingredients.
- Members create and manage recipes, handbooks, videos, and their revisions.
- Recipes use structured ingredients and structured cooking steps in addition to descriptive text.
- Published content is searchable and viewable according to visibility rules.

### FR-03 Community

- Authorized users comment and vote on eligible content.
- Owners manage their own comments and content subject to review-state rules.
- Abuse prevention, uniqueness, and idempotency rules are backend enforced.

### FR-04 Review and moderation

- Recipe, handbook, and video content follows draft → submitted → approved/rejected publication review.
- AI moderation and user reports create review signals, never automatic hard deletion.
- Administrators record decisions and reasons in an audit trail.
- Removed or rejected content can be handled through the documented state machine without destroying required evidence.

### FR-05 Food and nutrient knowledge base

- Maintain canonical ingredients, aliases, edible portions, household-unit conversions, nutrient values per 100 g, serving references, provenance, license, data quality, and version.
- Import authoritative food-composition data through adapters; do not couple domain logic to a provider.
- Support Vietnamese/local ingredient overrides and administrator curation.
- Maintain reference daily intake and upper-limit data with population applicability and source version.
- Maintain evidence-graded ingredient intake guidelines (for example an ingredient amount/frequency per day) separately from nutrient reference intakes; include population, unit, source, severity, and review status.
- Maintain evidence-graded ingredient interaction rules for one dish and across a meal/day.
- A warning rule must identify source, severity, applicability, and review status. Unsupported AI output cannot become a hard rule automatically.

### FR-06 Cooking-aware recipe nutrition

- Calculate a deterministic baseline from normalized ingredient mass and canonical nutrient data.
- Use structured cooking steps to map cooking method, time, temperature, edible yield, and nutrient-retention factors.
- AI may parse free text, suggest ingredient matching, infer missing cooking factors, or estimate unknown ingredients.
- Every result distinguishes calculated values from AI estimates and includes provenance, assumptions, confidence, and an uncertainty range where applicable.
- AI fallback never silently overwrites canonical data. Administrator or Contributor verification is explicit and audited.
- Nutrition is educational guidance, not a diagnosis or guarantee.

### FR-07 Search and personalized recommendations

- Search published recipes, handbooks, and videos.
- Suggest related content and restaurants using query context and, for signed-in users, permitted behavioral signals such as searches, chats, saved foods, and meal history.
- Apply hard dietary/allergy filtering before ranking.
- Explain the major reasons for a recommendation and allow relevant preference controls.

### FR-08 Meal planning and analysis

- Generate and edit weekly plans using BMI-related targets, health goals, allergies, dietary rules, available ingredients, preferences, and nutrition constraints.
- Allow the user to add an existing recipe or a private custom meal outside the public content catalog.
- A custom meal may include photos and user-created tags such as `shopee`; tags are plain user metadata and do not call external commerce APIs.
- Check portions, nutrient targets, ingredient limits, and incompatible combinations within dishes and across the selected meal/day.
- Return explainable warnings suitable for tooltips or dialogs. Warnings do not claim medical certainty.
- Support multi-week programs with repeated-pattern and cumulative nutrition analysis.

### FR-09 Pantry, fridge images, receipts, and shopping gaps

- Maintain a user pantry with quantity, unit, confidence, expiry/freshness notes, source, and confirmation status.
- Accept multiple fridge/ingredient images in one recognition job.
- AI proposes detected ingredients, estimated quantities, and freshness observations; the user confirms or edits results before they affect planning.
- Receipt analysis extracts candidate purchased items and quantities. The user confirms or edits candidates before inventory changes.
- Generate several recipe/meal options from confirmed pantry data; the user chooses before compatibility analysis and plan insertion.
- Produce a shopping-gap list from confirmed inventory, selected recipes, serving counts, and unit conversions.
- The system must not make definitive food-safety claims from images.

### FR-10 Media and storage

- Enforce per-file and per-account storage quotas before accepting durable uploads.
- Reserve, commit, and release quota safely so failed or abandoned uploads do not leak capacity.
- Report usage and limits to the user and administrators.
- MVP has no payment or quota-purchase flow.

### FR-11 Video lifecycle

- Video submissions follow the same manual review lifecycle as recipes and handbooks.
- Apply supported automated metadata/text moderation before the admin decision.
- Store upload ownership, size, status, review history, and moderation signals.
- Formal DMCA workflow, copyright fingerprinting, frame/audio moderation, and paid bandwidth are post-MVP roadmap items.

### FR-12 AI nutrition chatbot

- Answer vegetarian nutrition questions, explain BMI/calorie concepts, and suggest ingredient substitutions.
- Signed-in conversations use permitted profile context; Guest access is limited.
- Apply safety messaging, quotas, provider abstraction, and auditable request metadata.
- Chat output is advisory and cannot modify health data, dietary constraints, or canonical food rules without explicit user/admin action.

### FR-13 Contributor verification and AI sharing

- Eligible AI outputs can be saved as drafts and submitted through review.
- A Contributor may verify an eligible output by recording conclusion, evidence note, relevant scope, and timestamp.
- Verification does not convert an estimate into canonical scientific truth and can be superseded.
- Contributor permission is based only on approved Contributor status, not approval basis.

### FR-14 Restaurants and maps

- Find vegetarian shops/restaurants near a user-selected or permitted device location.
- Use a maps provider through an adapter and store only permitted cached data.
- Support suggestions related to searched foods and disclose distance/provider limitations.

### FR-15 Notifications

- Provide in-app notifications for review outcomes, contributor decisions, reports, quota warnings, verification events, and other approved domain events.
- Notifications are idempotent, paginated, and markable as read.

### FR-16 AI governance

- Administrators view provider/model configuration, request logs, latency, failures, moderation volumes, verification outcomes, and quality metrics.
- Model/vendor identifiers and quotas are configuration, not domain constants.
- Administrators can disable a capability/provider and route to a documented fallback.
- Sensitive prompt and health data are minimized and access-controlled.

## 6. Non-functional requirements

- **Security:** role checks, ownership checks, validation, rate limits, signed upload constraints, and least-privilege secrets.
- **Privacy:** explicit consent and purpose limitation for health, behavior, location, image, and receipt data.
- **Auditability:** important review, verification, rule, AI, and quota changes retain actor, time, reason, and version.
- **Reliability:** idempotent mutations where retries are expected; transactional quota and state transitions.
- **Explainability:** nutrition estimates, warnings, and recommendations expose source/reason/confidence appropriate to the UI.
- **Accessibility:** frontend experiences support keyboard and screen-reader use.
- **Localization:** Vietnamese-first copy with domain values represented independently of display text.
- **Performance:** paginated list endpoints; asynchronous processing for image, receipt, video, and expensive AI jobs.

## 7. Acceptance boundaries

- An endpoint is not READY until authorization, persistence/migration, OpenAPI, integration documentation, and required verification gates are complete.
- Frontend mocks do not count as backend capability.
- AI must not auto-publish, auto-ban, auto-delete, or create hard health rules.
- User-confirmed recognition output is required before pantry or shopping calculations.
- The MVP does not verify professional certificates, sell storage, integrate Shopee, implement formal DMCA processing, or claim clinical/food-safety accuracy.

## 8. Delivery traceability

| Requirement group | Backend phase |
|---|---:|
| Existing auth, profile, catalog, content, community, moderation, recommendation, meal plan, chat | 00–11 |
| Food/nutrient knowledge base | 12 |
| Cooking-aware recipe nutrition | 13 |
| Unified Contributor trust model | 14 |
| Account storage quota | 15 |
| Video review parity | 16 |
| Custom meals, photos, and user tags | 17 |
| Portion and compatibility analysis | 18 |
| Multi-week meal programs | 19 |
| Pantry inventory | 20 |
| Multi-image fridge recognition | 21 |
| Receipt analysis and shopping gaps | 22 |
| AI sharing and Contributor verification | 23 |
| Restaurants and maps | 24 |
| Notifications | 25 |
| AI governance | 26 |
| Cross-cutting hardening and release gate | 27 |

## 9. Post-MVP roadmap

All deferred requirements, including wearable integration, automatic video summarization, broader religious traditions, certificate verification, payments, formal DMCA operations, advanced moderation, and mature AI evaluation, are retained in `docs/ROADMAP_PHASE_2.md`.
