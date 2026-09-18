# Product Roadmap — Phase 2 (Post-MVP)

**Version:** 1.0

**Updated:** 2026-09-18

**Status:** Retained backlog; not committed MVP scope

## 1. Meaning of “Phase 2”

This file preserves post-MVP product directions so they are not lost while backend implementation Phases 12–27 are delivered. A roadmap item is not an approved API contract, sprint commitment, or claim of current capability. Each item requires discovery, privacy/security review, acceptance criteria, and an implementation phase before development.

## 2. Prioritization principles

1. Dietary safety and user control before automation depth.
2. Evidence, provenance, and human review before authoritative claims.
3. Provider adapters and portable data models before vendor-specific features.
4. Consent, deletion, retention, and audit policies before collecting new health or behavioral data.
5. Evaluate value and accuracy with real datasets before expanding AI scope.

## 3. Roadmap themes

### R2-01 Advanced personalized recommendation

- Combine explicit preferences with search, chat, save, vote, meal, and skip history.
- Use embeddings or learned ranking only after hard allergy/diet filters.
- Explain recommendations, expose preference controls, and support history reset/opt-out.
- Add exploration/diversity logic without violating hard constraints.
- Establish offline evaluation datasets, online quality metrics, drift detection, and rollback thresholds.

### R2-02 Advanced generative meal planning

- Optimize plans across longer horizons, budget, preparation time, leftovers, ingredient reuse, macro/micronutrient targets, and variety.
- Adapt plans after users record actual meals or substitutions.
- Support household/member profiles and shared pantry constraints.
- Add calibrated uncertainty and expert review workflows for high-risk nutrition suggestions.

### R2-03 Wearable and health-platform integration

- Investigate Apple HealthKit, Android Health Connect, Google Fit migration considerations, and supported wearables.
- Import only consented metrics such as weight, activity, and energy expenditure using platform-approved APIs.
- Use phone sensors only for measurements they can reasonably provide; do not claim that a generic phone sensor can directly determine BMI without height and weight inputs.
- Provide revocation, data-source priority, sync conflict resolution, retention, deletion, and audit controls.
- Never adjust a medically sensitive recommendation in real time without appropriate safety constraints.

### R2-04 Video intelligence

- Speech-to-Text transcription for cooking videos.
- Chapter detection and concise step-by-step recipe summaries.
- Extract candidate ingredients, amounts, timing, and cooking methods for user correction.
- Caption quality controls, language support, job status, retries, and provenance.
- Consider cost controls and user consent before sending media to an AI provider.

### R2-05 Advanced ingredient vision and freshness

- Improve multi-image deduplication, packaging/barcode recognition, quantity estimation, and pantry reconciliation.
- Train/evaluate against regional foods and household conditions.
- Represent freshness as an uncertain observation, not a food-safety verdict.
- Escalate ambiguous or risky cases to safe guidance instead of declaring food safe to eat.

### R2-06 Seasonal, regional, and climate suitability

- Suggest meals using seasonal availability, region, climate, price, and local food culture.
- Store source/version for seasonality calendars and permit location granularity controls.
- Make regional relevance a ranking signal after dietary/allergy constraints.

### R2-07 Expanded dietary traditions and rule catalog

- Add traditions beyond MVP Buddhist and Christian support after domain review.
- Model fasting periods, allowed times, denominations/sects, personal observance, and regional variations without stereotyping.
- Research Buddhist subtraditions often described as Northern/Mahayana and Southern/Theravada, including optional pungent-spice rules, instead of assuming one universal Buddhist diet.
- Research Christian denomination/fasting variations and possible future Islamic dietary/fasting support with qualified domain reviewers.
- Version rule sets and require user confirmation; never infer religion from behavior.
- Retain a generic custom-rule option where appropriate.

### R2-08 Contributor evidence and organization trust

- Optional professional certificate/evidence upload, expiry, issuer, and manual verification.
- Organization directory and affiliation verification.
- Evidence badges and audit history must not create hidden permission tiers unless a later approved RBAC decision explicitly changes the model.
- Support renewal, revocation, appeals, and privacy-safe public presentation.

### R2-09 Storage plans, billing, and commercial controls

- Paid storage tiers, payment provider integration, invoices, subscription state, grace periods, refunds, and quota transitions.
- Bandwidth/transcoding cost controls for video.
- Never delete user media immediately after payment failure; define retention and recovery policy first.

### R2-10 Copyright and formal DMCA operations

- Legal review of applicable jurisdictions before adopting a named DMCA process.
- Notice, counter-notice, evidence retention, repeat-infringer policy, designated-agent operations, deadlines, and appeals.
- Copyright fingerprinting or perceptual matching for re-uploads when technically and legally justified.
- Keep this separate from ordinary content-quality approval and community moderation.

### R2-11 Advanced video/content moderation

- Sampled frame analysis, speech/audio moderation, OCR, link inspection, malware scanning, and perceptual hashes.
- Risk scoring routes content to humans; automated signals do not hard-delete content.
- Maintain model/version, threshold, evidence, false-positive metrics, and appeal outcomes.

### R2-12 Commerce and external-service integrations

- Optional merchant, grocery-delivery, or marketplace links after provider and affiliate-policy review.
- Current labels such as `shopee` remain user-created tags only; they do not imply a Shopee integration.
- Any future integration must clearly distinguish sponsored results and preserve dietary filters.

### R2-13 Clinical-grade interaction knowledge

- Expand beyond evidence-graded food/ingredient compatibility warnings only with qualified clinical governance.
- Medication–food, disease-specific, pregnancy, pediatric, and therapeutic-diet advice requires authoritative sources, contraindication review, localized disclaimers, escalation paths, and versioned clinical approval.
- The system must avoid diagnostic or treatment claims without an explicitly approved regulated scope.

### R2-14 AI operations maturity

- Curated evaluation sets for chatbot, recognition, extraction, moderation, nutrition estimates, and recommendations.
- Per-model accuracy/quality, calibration, latency, cost, safety, and subgroup monitoring.
- Shadow evaluation, canary releases, prompt/model versioning, rollback, incident response, and human override.
- Data labeling and retraining pipelines with consent and de-identification requirements.

### R2-15 Notification channels and native experience

- Email, push, and real-time notifications after preference/consent management.
- Native mobile or PWA features, offline pantry/plan access, background upload/sync, and device permission UX.
- Digesting, quiet hours, deduplication, and channel-specific delivery observability.

### R2-16 Trust, appeals, and account recovery

- User-facing appeals for moderation, contributor rejection/revocation, copyright actions, and AI-related decisions.
- Stronger recovery and identity assurance for sensitive administrator/contributor actions.
- Transparent case timelines and immutable audit records.

### R2-17 Privacy, portability, and analytics

- Self-service export and deletion of profile, pantry, meal, chat, recognition, receipt, and recommendation-history data.
- Retention policies by data class and region.
- Consent receipts, purpose-limited analytics, de-identification, and privacy-safe product metrics.
- Organization/admin reporting without exposing unnecessary health or behavioral details.

### R2-18 Internationalization and accessibility maturity

- Additional languages, locale-aware ingredients/units, regional nutrition references, and translation review.
- Formal WCAG audits, captions/transcripts, reduced-motion support, and assistive-technology regression checks.

## 4. Discovery deliverables required before promotion to implementation

Every roadmap item promoted to MVP+1 implementation must define:

- user problem and measurable success criteria;
- legal/privacy/security risks and data retention;
- authoritative data/provider options and licensing;
- domain model and migration strategy;
- API contract and frontend states;
- human-review and failure/fallback behavior;
- cost/quota assumptions;
- evaluation dataset and acceptance thresholds for AI features;
- rollout, observability, rollback, and support plan.

## 5. Explicitly retained original ideas

The following original requirements remain retained above: AI-personalized meal planning; ingredient/fridge recognition; nutrition chatbot evolution; video-to-recipe summarization; Apple Health/Health Connect/wearable sync; seasonal/regional meal suitability; additional vegetarian/religious traditions; organization/certificate trust; storage monetization; DMCA research; advanced moderation; location/maps improvements; behavioral recommendation; AI quality monitoring; and manual intervention.
