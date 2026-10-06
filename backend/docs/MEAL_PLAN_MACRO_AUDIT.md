# MAINTAIN Meal Plan macro audit

Audited: 2026-10-05

## Scope and evidence

This is a read-only audit of the latest generated MAINTAIN plan for the profile
with TDEE 2956.63 kcal/day (plan ID e1df4a21-3fde-42f3-98a9-21cc82e1988a).
It contains all 21 filled slots for 2026-10-05 through 2026-10-11. No product
source, seed/reference data, migration, or frontend file was changed.

The persisted constraint snapshot has no allergies, exclusions, diet pattern,
or enabled traditions. The hard-compatible, planner-eligible pool contained 30
published recipes with resolved ingredients and complete values for all four
selected macros.

## Target derivation

MAINTAIN uses a factor of 1.0, so the daily target is
round(2956.63 x 1.0) = 2957 kcal.

| Metric | Formula | Target | 15% range |
| --- | --- | ---: | ---: |
| Protein | 2957 x 20% / 4 | 147.85 g | 125.67-170.03 g |
| Fiber | 2957 / 1000 x 14 | 41.40 g | 35.19-47.61 g |
| Fat | 2957 x 30% / 9 | 98.57 g | 83.78-113.36 g |
| Carbohydrates | 2957 x 50% / 4 | 369.63 g | 314.19-425.07 g |

Deviation is (actual - target) / target. OUT means outside the 15% band.
Meal contributions are protein/fiber/fat/carbohydrates in grams, including
the persisted serving multiplier.

## Seven-day results

| Day | Protein target / actual / dev. | Fiber target / actual / dev. | Fat target / actual / dev. | Carbs target / actual / dev. | Outside tolerance | Breakfast / lunch / dinner (P/Fib/Fat/Carbs) | Better hard-compatible three-meal combination? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mon 05 Oct | 147.85 / 99.00 / -33.0% | 41.40 / 48.00 / +15.9% | 98.57 / 86.75 / -12.0% | 369.63 / 321.75 / -13.0% | protein below; fiber above | 35/15/28.75/113.75; 36/17/27/96; 28/16/31/112 | Yes |
| Tue 06 Oct | 147.85 / 92.00 / -37.8% | 41.40 / 42.50 / +2.7% | 98.57 / 82.00 / -16.8% | 369.63 / 253.75 / -31.4% | protein, fat, carbs below | 35/16/29/87; 27/14/28/88; 30/12.5/25/78.75 | Yes |
| Wed 07 Oct | 147.85 / 81.25 / -45.0% | 41.40 / 50.00 / +20.8% | 98.57 / 73.75 / -25.2% | 369.63 / 290.00 / -21.5% | all four | 30/15/20/81.25; 20/10/23.75/77.5; 31.25/25/30/131.25 | Yes |
| Thu 08 Oct | 147.85 / 67.75 / -54.2% | 41.40 / 46.75 / +12.9% | 98.57 / 59.00 / -40.1% | 369.63 / 297.25 / -19.6% | protein, fat, carbs below | 18.75/15/20/90; 20/8.75/20/81.25; 29/23/19/126 | Yes |
| Fri 09 Oct | 147.85 / 71.25 / -51.8% | 41.40 / 41.25 / -0.4% | 98.57 / 45.00 / -54.3% | 369.63 / 283.75 / -23.2% | protein, fat, carbs below | 22.5/13.75/15/90; 23.75/18.75/15/113.75; 25/8.75/15/80 | Yes |
| Sat 10 Oct | 147.85 / 72.50 / -51.0% | 41.40 / 47.75 / +15.3% | 98.57 / 52.75 / -46.5% | 369.63 / 226.75 / -38.7% | all four | 17.5/13.75/16.25/83.75; 30/10/22.5/35; 25/24/14/108 | Yes |
| Sun 11 Oct | 147.85 / 56.25 / -62.0% | 41.40 / 33.75 / -18.5% | 98.57 / 51.25 / -48.0% | 369.63 / 177.50 / -52.0% | all four below | 13.75/13.75/22.5/45; 20/10/13.75/72.5; 22.5/10/15/60 | Yes |

For every day, the same hard-compatible pool had a lower aggregate
four-macro score. The lowest observed distinct-recipe combination at the
configured 1.25-serving ceiling was Cơm Lứt Đậu Hũ Cải Bó Xôi Buổi Sáng,
Phở Xào Nấm Đậu Hũ Cải Thìa, and Cơm Tempeh Măng Tây Nấm Áp Chảo:
108.75 g protein, 47.50 g fiber, 90.00 g fat, 301.25 g carbohydrates, score
0.2520. The generated days score, in date order, 0.3196, 0.5422, 0.8097,
0.8793, 1.0385, 1.1483, and 1.4748.

That comparator preserves hard compatibility; it does not apply the generator's
soft weekly-reuse preference. The three highest-protein candidates at 1.25
servings only reach 125 g, just below the 125.67 g lower bound. A protein-below
warning is therefore unavoidable under the current pool and serving ceiling,
but the much larger deficits and most fat/carbohydrate deficits are avoidable.

## Why the analysis reports 40 warnings

The persisted analysis has exactly 40 warnings:

| Code | Count |
| --- | ---: |
| MACRO_TARGET_BELOW_RANGE | 20 |
| MACRO_TARGET_EXCEEDED | 3 |
| INGREDIENT_GUIDELINE_EXCEEDED | 5 |
| INGREDIENT_INTERACTION | 12 |

There are 23 macro-target warnings, not 28. The reported 28 daily
maximum/target warnings is consistent with adding the five distinct daily
tofu-guideline warnings to the 23 macro warnings. No duplicate macro warning
was found: the existing key keeps records distinct by code, scope, source
record, affected items, and affected ingredients.

## Generator audit

| Check | Finding |
| --- | --- |
| Four macros used | Yes. macroTargetDeviationScore includes protein, fiber, fat, and carbohydrates with bounded relative deviation. Calories are only a later tie-breaker. |
| Final daily combination optimized | No. Breakfast, lunch, and dinner are selected greedily. Each candidate is compared only to a 1/3, 2/3, or 3/3 progress target, not to completed daily combinations. |
| Remaining-slot compensation | Only partial. remainingMealSlots scales the target, but no candidate-pool capacity or feasible completion is evaluated. A late meal cannot reliably repair earlier deficits. |
| Serving scaling | Correct for known values: every 0.75/1.0/1.25 option is scored and persisted with scaled macros. It cannot overcome the pool's protein ceiling. |
| Incomplete data in this result | No. All 21 selected meals and all observed pool candidates have all four values. Separately, the generic macro-addition helper can turn a missing later metric into zero after the day has a known value; that is a risk, not the cause of this run. |
| Scoring vs warning tolerance | No material threshold difference: both use 15%. The temporal model differs: partial-progress scoring versus final-day warning evaluation. |
| 21/21 versus quality | Yes, in practice. Unused recipes/repeat handling and greedy slot scoring permit complete slots despite six severely under-target days. |

## Requirement assessment and minimal backend fix

The generator does not satisfy the intended requirement to optimize the four
estimated daily metrics as a daily combination. It has a four-macro formula but
applies it independently per slot.

1. For each day, evaluate a bounded set of complete hard-compatible
   breakfast/lunch/dinner combinations, including safe serving options, against
   final daily targets using the existing four-macro score.
2. Keep hard constraints as pre-filters. Use weekly reuse, ingredient coverage,
   and behavioral ranking as penalties/tie-breakers after macro feasibility.
3. If infeasible, select the lowest final score, retain all slots, and keep the
   advisory warning; use pool bounds to distinguish unavoidable shortfalls.
4. Preserve an unknown macro as unknown during aggregation/scoring rather than
   implicitly converting it to zero.

This needs no API, migration, seed, or frontend change.

## Implementation results

Implemented on 2026-10-05. Generation now evaluates a bounded complete-day
combination rather than selecting breakfast, lunch, and dinner independently.
The hard-compatible recipe pool remains the only input to this search, so
allergy, exclusion, diet-pattern, and tradition filtering remains blocking.

### Bounded deterministic search

- At most 24 hard-compatible recipes are shortlisted per day using their
  best one-meal macro fit, uncertainty penalty, existing-use penalty, ranking,
  and a seed-derived deterministic tie-break.
- The existing serving options (0.75, 1.0, and 1.25) produce at most 72
  options per meal position and 72 cubed complete-day evaluations.
- The winning score is: bounded normalized four-macro deviation + missing-data
  uncertainty penalty + soft weekly reuse penalty + soft same-day repetition
  penalty. Ingredient coverage, behavioral ranking, calorie closeness, and the
  deterministic hash are tie-breakers, in that order.
- Calories therefore remain contextual/secondary. No hard reuse cap was added;
  a repeated recipe remains available when it materially improves a feasible
  plan or is the only candidate.

For incomplete macro fields, a daily total remains unknown for that metric and
receives an uncertainty penalty. It is not converted to zero. Existing
incomplete-data reporting is unchanged.

### Non-persisting deterministic replay

The same 30-candidate, unconstrained audit pool was replayed in memory with
the same 2957 kcal target and seed. No meal-plan row or user-created data was
written. Values below are old actual -> new selected daily totals in
protein/fiber/fat/carbohydrates grams; macro-warning counts use the unchanged
15% warning thresholds.

| Day | Old totals -> new totals (P/Fib/Fat/Carbs) | Macro warnings old -> new |
| --- | --- | ---: |
| Mon 05 Oct | 99/48/86.75/321.75 -> 108.75/47.5/90/301.25 | 2 -> 2 |
| Tue 06 Oct | 92/42.5/82/253.75 -> 103.75/47.5/83.75/310 | 3 -> 3 |
| Wed 07 Oct | 81.25/50/73.75/290 -> 85/45/82.5/298.75 | 4 -> 3 |
| Thu 08 Oct | 67.75/46.75/59/297.25 -> 86.25/47.5/66.25/273.75 | 3 -> 3 |
| Fri 09 Oct | 71.25/41.25/45/283.75 -> 72.5/47.5/58.75/306.25 | 3 -> 3 |
| Sat 10 Oct | 72.5/47.75/52.75/226.75 -> 75/47.5/70/313.75 | 4 -> 3 |
| Sun 11 Oct | 56.25/33.75/51.25/177.5 -> 97.5/47.5/85/291.25 | 4 -> 2 |

The replay reduces macro warnings from 23 to 19 by improving actual day
selection, not by suppressing warnings. The full 40-warning persisted Meal
Analysis total was not recomputed in the replay because doing so would require
persisting a replacement user plan; interaction and guideline warnings remain
intentionally unchanged by this generation-only change.

Acceptance coverage now verifies daily-combination selection, fiber overshoot
avoidance, protein compensation, incomplete macro penalization, hard-compatible
candidate use, 21/21 filling, and variety across 21 comparable alternatives.

