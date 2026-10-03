# Meal Plan / Meal Analysis Warning Changes

**Updated:** 2026-10-02  
**Scope:** Backend-only user-facing warning copy and additive response metadata

## What changed

- Meal Analysis warnings now include simple Vietnamese `title`, `detail`, `suggestion`, `severityLabel`, `scopeLabel`, `targetDate`, `mealType`, and `targetComparison` fields.
- Existing `explanation` and `suggestedAdjustment` fields now carry the same user-friendly meaning so current consumers receive clearer text without changing field names.
- Daily macro analysis now gives advisory warnings for values estimated above or below the configured range. A low warning is created only when every selected meal in that day has data for that macro; incomplete data is never treated as zero.
- Meal Plan summaries now add `warningDetails` and `userSummary`. Legacy `warnings` and item `warningCodes` arrays remain present.
- User-facing weekly nutrition warnings are limited to estimated protein, fiber, fat, and carbohydrate results from Meal Analysis.
- Technical micronutrient-completeness, calorie-tolerance, and internal target-tolerance codes remain available in stored backend data but are omitted from the primary Meal Plan warning arrays returned to normal users.
- Missing-data notes no longer expose item UUIDs or terms such as `cooking-aware`, canonical data, provenance, nutrient coverage, or internal rule terminology.
- Same-dish, same-meal, and same-day ingredient notices explain the likely consequence, identify the affected time/location, and provide a practical next step.
- Hard allergy, explicit-exclusion, diet-pattern, and enabled-tradition enforcement is unchanged. A rejected manual choice now has a plain Vietnamese error message; advisory macro warnings remain non-blocking.

## Before → after examples

| Before                                                                          | After                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Estimated daily fat is above the approximate configured target and tolerance.` | **Chất béo ước tính đang cao hơn mục tiêu.** Cả ngày Thứ Tư (30/09) có lượng chất béo ước tính cao hơn khoảng mục tiêu của bạn. Bạn có thể giảm khẩu phần hoặc đổi sang món ít dầu hơn.                             |
| No low-macro message                                                            | **Chất xơ ước tính còn thấp.** The affected day is identified in Vietnamese; the suggestion is to add leafy vegetables, legumes, or whole grains.                                                                   |
| `Recipe item <UUID> chưa có cooking-aware nutrition estimate hiện hành.`        | **Bún rau củ: chưa có đủ dữ liệu để ước tính đầy đủ chất đạm, chất xơ, chất béo và tinh bột.** The response explains that values are estimates and suggests adding information or choosing a meal with fuller data. |
| `Tương tác thành phần thực phẩm` / raw rule explanation                         | **Kết hợp đậu hũ và bông cải xanh có thể hỗ trợ dinh dưỡng.** The detail states the affected dish/meal/day, a cautious practical consequence, and what the user may do.                                             |
| `Kế hoạch MAINTAIN deterministic ... hard constraints ... scoring.`             | **Thực đơn đã xếp ... bữa cho mục tiêu giữ cân...** The explanation says dietary requirements were checked before selecting meals.                                                                                  |
| `Món đã chọn vi phạm allergy, explicit exclusion, diet pattern...`              | **Món này không phù hợp với ít nhất một yêu cầu ăn uống bắt buộc của bạn... Vui lòng chọn món khác.**                                                                                                               |

## User-facing warning categories

- Estimated macro range: protein, fiber, fat, carbohydrate (`ABOVE` or `BELOW`), always advisory.
- Portion: selected serving count may be unusually large, always advisory.
- Ingredient amount guideline: estimated amount is above a reviewed reference, with cautious language.
- Ingredient combination: possible beneficial or adverse consequence within the same dish, meal, or day.
- Meal-plan availability: repeated dishes, unfilled slots, or shopping-list units that cannot be combined safely.
- Weekly summary:
  - `NO_SERIOUS_ISSUE`: no user-facing planning warning.
  - `ADVISORY_ADJUSTMENTS`: optional adjustments are available.
  - `HARD_CONSTRAINT_BLOCKED`: a slot was left empty instead of inserting a meal that could conflict with mandatory dietary requirements.
- Meal Analysis summary separately exposes a Vietnamese title/detail and confirms that mandatory constraints remain preserved. Successful analyses report either no serious issue or advisory adjustments; an actual hard-constraint violation is rejected before persistence.

## Technical/internal information kept hidden from primary messages

- Warning/error codes, evidence grade, source record/version, applicability payload, confidence, algorithm version, and rule metadata remain available for audit and debugging.
- Stored Meal Plan warning codes for micronutrient completeness and calorie-target tolerance are retained internally but are filtered from normal user-facing warning arrays.
- Existing micronutrient summary data remains in the response for backward compatibility, but it does not create a user-facing completeness warning.
- Source rule explanations remain in the food-data records. Meal Analysis returns a separate plain-language consequence instead of exposing rule terminology as the primary message.

## Additive response fields

Meal Analysis warning objects add:

- `title`, `detail`, `suggestion`
- `severityLabel`, `scopeLabel`
- `targetDate`, `mealType`
- `targetComparison` (`ABOVE`, `BELOW`, or `null`)

Meal Analysis `summary` adds:

- `userStatus`, `title`, `detail`
- `advisoryCount`, `hardConstraintViolationCount`
- `hardConstraintsPreserved`

Meal Plan summaries add:

- `warningDetails[]` with message/detail/suggestion, understandable severity, and affected slots
- `userSummary` with a user-facing status, title, detail, optional suggestion, and hard-constraint preservation flag

`MACRO_TARGET_BELOW_RANGE` is added to the Meal Analysis warning-code enum. Existing `MACRO_TARGET_EXCEEDED` remains unchanged for above-range values.

## Compatibility notes

- API paths, HTTP methods, existing field names, existing field types, and response nesting are unchanged.
- New response fields are additive.
- Existing technical codes and source metadata are retained for consumers that need audit/debug data.
- The Meal Analysis algorithm version is advanced to `meal-analysis-v3-user-facing-warnings`, so older saved analyses become stale and must be recalculated rather than returning outdated copy.
- Nutrition calculations and configured targets are unchanged. Only warning classification/copy changes; below-range warnings are advisory and require complete daily data for the relevant macro.
- Allergy, exclusion, diet, and tradition checks remain blocking. Macro, portion, guideline, and interaction notices do not become new hard constraints.
- No database migration or seed change is required.
- Frontend source and frontend documentation are intentionally untouched.

## Validation results

Results are recorded after the final verification run:

- Lint: passed (`npm run lint`)
- Typecheck: passed (`npm run typecheck`)
- Build: passed (`npm run build`)
- Meal Plan acceptance: passed (`npm run meal-plans:acceptance`)
- Meal Analysis acceptance: passed (`npm run meal-analysis:acceptance`)
- OpenAPI generation/validation: passed (`npm run openapi:generate`; generated JSON parsed successfully and additive warning fields were present)
- `git diff --check`: passed
