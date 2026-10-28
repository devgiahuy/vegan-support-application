# Data model

- Ingredient: compositionStatus UNKNOWN/PARTIAL/COMPLETE; compositionKind UNSPECIFIED/SIMPLE/COMPOUND; compositionEvidence JSON with source ID/code/version/record/license/attribution, scope, reviewer ID/time; compositionVersion integer.
- IngredientComponent: canonical parent and component IDs, unique pair; no self edges, duplicate edges, cycles or paths deeper than 32 edges.
- IngredientCompositionAudit: ingredient ID, version, actor ID, immutable assessment snapshot and timestamp.
- CatalogGraphState: singleton mutation revision for serializing graph writes.
- AllergenDefinition retains its stable internal code; API exposes human labels/descriptions/search terms. UserAllergy keeps a validated catalog code and catalog-provided label.

COMPLETE SIMPLE requires no edges; COMPLETE COMPOUND requires at least one active constituent. Completeness is transitive and source-backed; UNKNOWN/PARTIAL evidence never establishes an allergen-free claim. A complete parent with an incomplete child is incomplete at evaluation time.
