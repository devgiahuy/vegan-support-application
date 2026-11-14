# Food, Nutrition, and Cooking Data Source Assessment

**Version:** 1.4

**Updated:** 2026-10-29

**Status:** Architecture research for Backend Phase 12; provider/legal validation still required before bulk import

## Recipe review estimates and AI gap filling — 2026-10-28

Recipe nutrition is calculated on submit from approved canonical records only (USDA_FDC profiles with source, version and record IDs, reviewed household conversions, yield and retention factors). When those records cannot cover an ingredient or one of the five review metrics, an asynchronous AI job may suggest cooking methods, retention factors and whole-line estimates. These suggestions are stored only in that revision's estimate, keep the `AI_ESTIMATED` label with confidence and assumptions, and are never written to `IngredientFoodProfile`, nutrient values, conversions or factor tables; promoting any of them into canonical data still requires the separate reviewed import/record flow. A reviewer edit is stored as `VERIFIED_OVERRIDE` for that revision with an audit trail. Values become official for a recipe only when a reviewer approves the revision. Change record: v1.3 adds this boundary (BL-05.1 in `docs/IMPLEMENTATION_PLAN.md`). v1.4 (2026-10-29, BL-05.2): author-typed recipe values are stored per revision as `USER_PROVIDED` and are compared with, never written into, canonical data; a Contributor/Admin declaration publishes the recipe value only, not an ingredient fact.

## Seed nutrition dataset — 2026-10-26

Seed ingredients now take per-100 g nutrient values verbatim from USDA FoodData Central SR Legacy (April 2018, public domain/CC0) under source `USDA_FDC`, version `SR Legacy 2018-04`, one profile per ingredient keyed by FDC ID, linked to import batch `seed-sr-legacy-2018-04`. Closest-record approximations are marked `PROXY` with ESTIMATED quality; ingredients with no public-domain record have no profile. Reference intakes use NASEM DRIs for adults 19–50 (source `NASEM_DRI`). Previous project-authored `PROJECT_DEMO_V1` v1.0 profiles, reference intakes and interaction rules are marked SUPERSEDED, not deleted. Details and the manual image list: `docs/SEED_NUTRITION_RECIPE_DATA.md`.

## Reviewed ingredient composition — 2026-10-25

Composition is separate from nutrient quantities. Canonical component edges support transitive allergy/exclusion/diet/tradition checks without inventing nutrient proportions. PARTIAL/COMPLETE reviews retain active source ID, version, record reference, exact ingredient/product/formulation scope, license/attribution and authenticated admin reviewer/time, with versioned audit entries. A COMPLETE parent is uncertain if any child/source is incomplete/inactive. AI cannot promote a review.

Targeted `db:normalize-allergies` adds project-authored `COMPOSITION_DEMO_V1`, version `composition-demo-2026-10-25`, CC0-1.0. An explicit whitelist covers 66 simple demo ingredients (22 added 2026-10-26, including extra-virgin olive oil and table salt); two labelled synthetic compounds demonstrate nested peanut matching. These are educational fixtures, not branded-product evidence or food-safety certification. On 2026-10-26 (user-approved) version `composition-demo-2026-10-26` adds 24 prepared foods used by seeded recipes (tofu/tempeh/soy products, rice noodles, bread, canola/sesame oil, tamari/soy/hoisin sauce, coconut milk, sugar, rice vinegar, scenario cow's milk, etc.) as single demo formulations whose scope text states the assumed recipe and that brands differ; existing allergen links (SOY, GLUTEN, PEANUT, SESAME, MILK) are kept. Curry powder is a COMPOUND of reviewed demo spices. `hat nem nam` (mushroom seasoning) stays UNKNOWN because its formulation varies too much. Existing non-demo reviews/provenance and positive allergen links are preserved; unresolved saved selections are reported. Repeated normalization is idempotent.

Production reviews require evidence and usage rights for the exact formulation/label. A name, absent allergen links or nutrient-provider coverage cannot establish completeness. Every active hard dietary constraint excludes uncertain data. Source/graph/profile edits invalidate analysis, and confirmation rechecks current plans. Change record: v1.1 adds composition provenance/demo normalization; external provider/license validation below remains applicable.

## 1. Recommendation

Use a canonical internal database with provider-specific import adapters. No external API and no AI model is the runtime source of truth.

Recommended sequence:

1. Define canonical schema, provenance, license, source version, quality, and review state.
2. Bootstrap broad generic ingredients/nutrients from USDA FoodData Central.
3. Manually curate a small Vietnamese demo dataset while confirming rights for a digital import of the Vietnamese Food Composition Table.
4. Add Open Food Facts only for packaged/barcode enrichment with explicit quality checks and ODbL compliance.
5. Keep commercial APIs optional. Use them only if the project needs their parsing/coverage enough to justify cost and caching restrictions.
6. Use reviewed nutrient-retention/yield factors for deterministic cooking-aware calculations. AI may parse steps or estimate missing factors, always labeled with confidence/assumptions.

## 2. Candidate sources

| Source | Best use | Access/license considerations | Decision |
|---|---|---|---|
| [USDA FoodData Central API](https://fdc.nal.usda.gov/api-guide/) | Broad food/nutrient bootstrap, source IDs, search/import | Data are public domain/CC0; API key and documented rate limit apply | Preferred initial external adapter |
| [Vietnamese Food Composition Table 2017 — FAO catalog](https://www.fao.org/food-composition/tables-and-databases/detail/%28viet-nam--2017%29-vietnamese-food-composition-table/en) | Regional foods and Vietnamese naming | FAO catalog indicates a print source; confirm digitization/import rights before copying data | Important curation source; no unreviewed bulk import |
| [Open Food Facts API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) | Packaged foods, labels, barcodes | ODbL attribution/share-alike considerations; crowd-sourced data have no accuracy guarantee | Optional enrichment, never sole authority |
| [Edamam Food Database API](https://developer.edamam.com/food-database-api-docs) | Commercial ingredient parsing/nutrition lookup | Commercial terms, quotas, attribution/caching constraints need review | Optional adapter |
| [Nutritionix natural-language nutrients API](https://docx.syndigo.com/developers/docs/natural-language-for-nutrients) | Commercial natural-language parsing | Commercial plan and data-caching restrictions need review | Optional adapter |
| [NIH nutrient recommendations](https://ods.od.nih.gov/HealthInformation/nutrientrecommendations/) | DRI/RDA/AI/UL source discovery | Store population, unit, source table, and revision; do not flatten all users into one limit | Reference-intake source |
| [USDA nutrient retention factors](https://www.ars.usda.gov/northeast-area/beltsville-md-bhnrc/beltsville-human-nutrition-research-center/methods-and-application-of-food-composition-laboratory/mafcl-site-pages/nutrient-retention-factors/) | Retention factors by cooking method | Preserve factor table/version and applicability | Preferred deterministic cooking-factor source |
| [FAO/INFOODS recipe guidance](https://www.fao.org/infoods/infoods/recipes/en/) | Recipe calculation method and documentation | Use methodology; record yield/retention assumptions | Calculation design reference |

## 3. Why the internal database is required

- Stable IDs and Vietnamese aliases cannot depend on one vendor.
- Dietary filtering, daily limits, and interaction warnings require reviewed/versioned data, not live AI text.
- Provider values may differ by food form, edible portion, serving basis, geography, and analysis date.
- License/caching rules differ. Raw provider payloads must not be mixed into one untraceable record.
- Importing once and curating internally allows deterministic meal-plan calculations and reproducible audit history.

## 4. Canonical record minimums

### Ingredient and nutrient value

- canonical ingredient ID and locale-aware aliases;
- scientific/common name and food group where available;
- edible portion and preparation/form (`raw`, `boiled`, `dried`, etc.);
- nutrient ID, value, unit, and basis (normally per 100 g edible portion);
- source/provider, external ID, source version/date, import batch;
- license/attribution metadata;
- quality/review status, reviewer, and effective/superseded dates.

### Daily reference/upper limit

- nutrient, value/unit, reference type (`RDA`, `AI`, `UL`, or source-specific);
- age/sex/life-stage or other applicable population;
- source/version/effective date;
- whether the value can drive a warning or is display-only.

### Interaction rule

- ingredient/nutrient pair or predicate;
- scope (`SAME_DISH`, `SAME_MEAL`, `SAME_DAY`);
- severity and evidence grade;
- population/applicability and threshold;
- source citation, review state, and version;
- explanation and cautious suggested adjustment.

AI-proposed interaction rules stay in a staged suggestion table and cannot be active until reviewed.

### Ingredient intake guideline

- canonical ingredient and amount/frequency period (for example grams per day);
- population/applicability and contraindication context;
- unit, severity, evidence grade, and whether the value is advisory or enforceable;
- source citation, reviewer, version, and effective/superseded dates.

An ingredient guideline is not interchangeable with a nutrient RDA/AI/UL and must not be invented from general nutrient values.

## 5. Cooking-aware calculation approach

1. Resolve each input to canonical ingredient/form and convert to edible grams when possible.
2. Calculate raw nutrient values from the canonical basis.
3. Map structured cooking steps to reviewed cooking methods.
4. Apply yield and nutrient-retention factors with explicit versions.
5. Aggregate recipe total and divide by confirmed servings.
6. Return uncovered ingredients, assumptions, value origin, confidence, and uncertainty range.

Cooking calculations are estimates: time, temperature, water/fat transfer, equipment, and household technique vary. AI can help parse free text and propose a missing mapping/factor, but the result remains `AI_ESTIMATED` until reviewed and never overwrites canonical facts.

## 6. Phase 12 discovery checklist

- Confirm target nutrient list and units for MVP.
- Confirm license/attribution with each imported source.
- Decide initial Vietnamese ingredient seed and reviewer.
- Define import idempotency and source supersession.
- Define evidence grading and which rules may be hard constraints versus warnings.
- Define population coverage for reference intake values.
- Record API credentials/rate limits in configuration, never domain constants.
- Add provider fixture files only when redistribution is permitted.
