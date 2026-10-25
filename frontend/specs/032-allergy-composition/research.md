# Research decisions

- Named catalog: active `AllergenDefinition` already exists. Add public read endpoint with search terms from approved aliases; explicit selection avoids guessed allergy mappings.
- Composition: canonical ingredient IDs form a directed graph. Use normalized component edges, reviewed parent assessment and append-only snapshots. Serialize graph writes through one transaction lock to prevent cross-parent write skew.
- Evaluation: a fresh graph per request provides consistent descendant checks without stale denormalized metadata. Memoize within a request; bound depth and fail closed on corrupt graph data.
- Data: normalize curated demo records with honest local-demo provenance, keep unspecified branded/generic formulations unknown. No AI promotion or external-data import is required.
- Consumers: search pipeline also supplies recommendation/planner candidates. Manual-add and analysis are separate paths and must explicitly share the resolver. Program confirmation must always recheck selected weeks.
- Research agents inspected frontend and backend read-only; no indexed GitNexus repository is available.
