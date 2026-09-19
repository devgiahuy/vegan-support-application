# Food, Nutrition, and Cooking Data Source Assessment

**Version:** 1.0

**Updated:** 2026-09-18

**Status:** Architecture research for Backend Phase 12; provider/legal validation still required before bulk import

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
