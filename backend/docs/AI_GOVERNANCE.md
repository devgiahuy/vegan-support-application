# Phase 26 AI governance operations

**Updated:** 2026-09-27

The Admin-only `/api/v1/admin/ai/*` routes expose operational metadata. Every route requires an active authenticated Administrator. Responses use `Cache-Control: private, no-store`. No route returns a prompt, chat message, health profile, image URL, receipt line, provider payload, feedback reason, verification evidence note, or API credential.

## Event catalog

`ai_governance_events` contains only capability, provider/model, template version, request correlation ID, start/end time, latency, status, a bounded error class, token usage and cost when supplied by an adapter, confidence/coverage when calculable, and a safety outcome. Non-UUID client request IDs are hashed before storage. The current adapters supply chat token counts, recognition confidence and image coverage, and receipt image coverage. They do not supply cost; `costMicros` remains `null`. Rule moderation, local chat responses, and human verification write events in the same transaction as their source audit record. Chat, chat moderation, nutrition fallback, fridge recognition and receipt extraction are measured at the provider boundary. Local health/topic blocks are labeled as local events, not provider calls.

The request page is ordered newest first and capped at 100 rows. Date windows are at most 90 days. Filters are capability, provider, status, and time range. The metrics page aggregates event status/count/mean latency/token/cost by capability and provider. It also reads existing domain records for chat feedback counts; open/reviewed moderation flags and `NO_VIOLATION` actions linked to AI flags (false-positive signals); recognition and receipt candidate correction rates (`editedByUser`, which survives confirmation and excludes automatic rejection); nutrition estimate mean confidence and resolved-line coverage; and verification conclusion/status. A missing sample is `null`, not zero. The health route summarizes failures, fallbacks, and provider-unavailable events over 24 hours.

## Controls and fallbacks

`AI_CHAT_ENABLED`, `VISION_ENABLED`, and `RECEIPT_ENABLED` in the environment are upper bounds. The Admin control table can turn a configured capability/provider off, but cannot override a disabled environment setting or select a provider that is not configured. Each invocation reads the authoritative database control; a database read failure prevents the provider call. A PATCH requires the current version (zero before the first change) and one allowlisted reason: `PROVIDER_INCIDENT`, `QUALITY_INVESTIGATION`, `SAFETY_HOLD`, `PLANNED_MAINTENANCE`, or `RESTORE_SERVICE`. This prevents an audit reason from carrying raw sensitive text. Updates and immutable actor/reason/version audit rows commit together. Admins can page through them at `GET /api/v1/admin/ai/features/audit`. In-flight requests may finish after a toggle; new calls see the new state.

`AI_FALLBACK_MODEL`, `AI_CHAT_TEMPLATE_VERSION`, `AI_NUTRITION_TEMPLATE_VERSION`, and `AI_TOPIC_RULE_VERSION` are deployment configuration, alongside existing provider/model and quota variables. The fallback and topic-rule identifiers are audit labels for local responses; no provider is invoked for those responses.

| Capability | Disabled or unavailable behavior |
|---|---|
| CHAT | Existing static advisory response; no successful-call quota charge |
| MODERATION | Suppress generated chat and return the static unavailable advisory; never issue a sanction |
| NUTRITION | Deterministic or partial calculation, marked provider unavailable |
| VISION | Job fails with an explicit provider-unavailable state; user may enter pantry items manually |
| RECEIPT | Job fails with an explicit provider-unavailable state; user may enter pantry items manually |

Verification is a human workflow with outcome metrics, not a model capability or a toggle target.

Rule-based publication moderation is a local safety rule and remains active independently of the optional chat moderation provider. Neither a flag nor a user report changes a content or account state without the existing manual review flow. Toggle APIs contain no training or retraining action.

## Retention and access

Run `npm run ai-governance:cleanup` daily from `backend/`. It deletes governance events and legacy redacted chat request metadata older than 90 days in batches. The event store deliberately contains no user ID, source ID, prompt hash, image ID, receipt ID, or arbitrary JSON metadata. Control audit rows are retained for accountability and are not deleted by this job. Domain records such as user-owned chat content, recognition/receipt candidates, nutrition estimates, flags, and verification evidence retain their existing product lifecycle and access rules. Only Admins can inspect governance data; provider credentials remain server-side environment configuration.
