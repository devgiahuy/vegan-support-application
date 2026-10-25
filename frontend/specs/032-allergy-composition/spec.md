# Named allergies and ingredient composition

Date: 2026-10-25. Status: approved by the user's implementation request and direct normalization instruction.

## User scenarios and acceptance

### US1 (P1): Choose allergies by familiar names
Members search an active named catalog using Vietnamese names, approved synonyms and explicit typo suggestions. Selecting a result adds the allergy with severity. No code or display-name entry is required. Unselected text is never saved as an allergy; confirmation is blocked until it is selected or cleared. Loading, failure/retry and no-match states are visible.

### US2 (P1): Exclude indirect and uncertain ingredients
Discovery, related recipes, recommendations, generated plans and manual recipe/custom-meal insertion evaluate nested ingredient components. A known forbidden descendant blocks its parent. Missing, inactive, cyclic, excessively deep or incompletely reviewed composition cannot pass an active hard dietary constraint. Existing recipe snapshot allergens remain a conservative additional signal. A meal without ingredient information cannot pass a constrained profile.

### US3 (P1): Maintain reviewed composition
Only administrators may save a composition assessment with kind, completeness, exact formulation/product scope, source/version/record and components. Complete simple ingredients have no components; complete compound ingredients have components. Cycles and concurrent cycle creation are rejected. Every assessment retains the actor/time/version/evidence in an audit record. AI cannot publish assessments.

### US4 (P1): Keep stored plans honest
Changing composition or a dietary profile invalidates analysis. Analysis reports actual hard violations; confirming a multi-week program rechecks its selected plans. No stored safe-looking summary can bypass current constraints.

## Functional requirements

- The named catalog is public and contains active allergy definitions plus approved ingredient search names. Membership is enforced on preference writes; canonical labels come from the catalog.
- Ingredient resolution remains exact/alias-based; fuzzy search is suggestion-only and needs selection.
- Composition data defaults to UNKNOWN and requires reviewed source evidence to become COMPLETE.
- Compound ingredient amounts do not invent nutrient quantities; composition affects safety matching only.
- Restaurant directory behavior remains profile-independent.
- Normalize existing demo catalog and seed directly, with a targeted idempotent command; no legacy manual-code UI or automatic scientific claims.

## Success criteria

1. Users save allergies without typing internal identifiers.
2. All named, alias, typo-selection, unknown and compound acceptance scenarios pass.
3. Two or more composition levels cannot bypass allergy/exclusion filtering or manual-add.
4. Cycles are rejected, current-plan analysis detects changed metadata, and confirmation blocks violations.
5. Backend gates, OpenAPI/schema sync, frontend mapper/search tests and production build pass.

## Assumptions and boundaries

The curated local dataset is educational demo data with explicit provenance, not a food-safety certification. Generic packaged sauces remain UNKNOWN without exact formulation evidence. This work does not import external branded product data, alter canonical nutrition, add backend test infrastructure or change Contributor permissions.
