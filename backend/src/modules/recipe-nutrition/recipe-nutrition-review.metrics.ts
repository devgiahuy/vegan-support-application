import { NutritionValueOrigin, type Prisma } from '@prisma/client';
import type { RecipeReviewNutritionMetric } from '../chat/ai-provider.js';

/** The five per-serving values a reviewer must confirm before a recipe revision is published.
 * Vitamin B12 is intentionally excluded (user decision 2026-10-28).
 */
export const REVIEW_NUTRITION_METRICS: ReadonlyArray<{
  metric: RecipeReviewNutritionMetric;
  nutrientCode: string;
  nutrientName: string;
  unit: string;
}> = [
  { metric: 'calories', nutrientCode: 'ENERGY_KCAL', nutrientName: 'Năng lượng', unit: 'kcal' },
  { metric: 'proteinGrams', nutrientCode: 'PROTEIN', nutrientName: 'Protein', unit: 'g' },
  { metric: 'carbsGrams', nutrientCode: 'CARBS', nutrientName: 'Carbohydrate', unit: 'g' },
  { metric: 'fatGrams', nutrientCode: 'FAT', nutrientName: 'Chất béo', unit: 'g' },
  { metric: 'fiberGrams', nutrientCode: 'FIBER', nutrientName: 'Chất xơ', unit: 'g' },
];

export const REVIEW_METRIC_KEYS = REVIEW_NUTRITION_METRICS.map((item) => item.metric) as [
  RecipeReviewNutritionMetric,
  ...RecipeReviewNutritionMetric[],
];

export interface ReviewMetricEstimate {
  metric: RecipeReviewNutritionMetric;
  unit: string;
  /** Per-serving value; null unless every ingredient line supplies the metric. */
  value: number | null;
  /** Per-serving sum of the lines that do supply it, for reviewer reference only. */
  partialValue: number | null;
  origin: NutritionValueOrigin | null;
  confidence: number | null;
}

interface StoredNutrient {
  nutrientCode: string;
  unit: string;
  amount: number;
  origin: string;
  confidence: number;
}

function storedNutrients(value: Prisma.JsonValue): StoredNutrient[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    return typeof record.nutrientCode === 'string' &&
      typeof record.unit === 'string' &&
      typeof record.amount === 'number' &&
      typeof record.origin === 'string' &&
      typeof record.confidence === 'number'
      ? [
          {
            nutrientCode: record.nutrientCode,
            unit: record.unit,
            amount: record.amount,
            origin: record.origin,
            confidence: record.confidence,
          },
        ]
      : [];
  });
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Which review metrics each estimate line is missing (keyed by ingredient position). */
export function missingMetricsByLine(
  lines: Array<{ position: number; nutrients: Array<{ nutrientCode: string; unit: string }> }>,
): Map<number, RecipeReviewNutritionMetric[]> {
  const result = new Map<number, RecipeReviewNutritionMetric[]>();
  for (const line of lines) {
    const missing = REVIEW_NUTRITION_METRICS.filter(
      (definition) =>
        !line.nutrients.some(
          (nutrient) =>
            nutrient.nutrientCode === definition.nutrientCode && nutrient.unit === definition.unit,
        ),
    ).map((definition) => definition.metric);
    if (missing.length) result.set(line.position, missing);
  }
  return result;
}

/** Same as missingMetricsByLine, for persisted estimate lines. */
export function missingMetricsByStoredLine(
  lines: Array<{ position: number; nutrientCoverage: Prisma.JsonValue }>,
): Map<number, RecipeReviewNutritionMetric[]> {
  return missingMetricsByLine(
    lines.map((line) => ({
      position: line.position,
      nutrients: storedNutrients(line.nutrientCoverage),
    })),
  );
}

/** Derives per-serving review metrics from persisted estimate lines.
 * A metric missing on any line yields `value: null`; partial sums are never presented as totals.
 */
export function reviewMetricsFromLines(
  lines: Array<{ nutrientCoverage: Prisma.JsonValue }>,
  servings: number,
): ReviewMetricEstimate[] {
  const parsed = lines.map((line) => storedNutrients(line.nutrientCoverage));
  return REVIEW_NUTRITION_METRICS.map((definition) => {
    const matches = parsed.map((nutrients) =>
      nutrients.find(
        (nutrient) =>
          nutrient.nutrientCode === definition.nutrientCode && nutrient.unit === definition.unit,
      ),
    );
    const present = matches.filter((item): item is StoredNutrient => Boolean(item));
    const complete = present.length === parsed.length;
    const total = present.reduce((sum, item) => sum + item.amount, 0);
    const perServing = servings > 0 ? round(total / servings, 2) : null;
    return {
      metric: definition.metric,
      unit: definition.unit,
      value: complete ? perServing : null,
      partialValue: present.length ? perServing : null,
      origin: present.length
        ? present.some((item) => item.origin === NutritionValueOrigin.AI_ESTIMATED)
          ? NutritionValueOrigin.AI_ESTIMATED
          : NutritionValueOrigin.CANONICAL_CALCULATED
        : null,
      confidence: present.length
        ? round(Math.min(...present.map((item) => item.confidence)), 4)
        : null,
    };
  });
}

/** Fallback for line-less estimates (seeded aggregate estimates): a metric is present only if stored. */
export function reviewMetricsFromPerServing(value: Prisma.JsonValue): ReviewMetricEstimate[] {
  const nutrients = storedNutrients(value);
  return REVIEW_NUTRITION_METRICS.map((definition) => {
    const match = nutrients.find(
      (nutrient) =>
        nutrient.nutrientCode === definition.nutrientCode && nutrient.unit === definition.unit,
    );
    return {
      metric: definition.metric,
      unit: definition.unit,
      value: match ? round(match.amount, 2) : null,
      partialValue: match ? round(match.amount, 2) : null,
      origin: match
        ? match.origin === NutritionValueOrigin.AI_ESTIMATED
          ? NutritionValueOrigin.AI_ESTIMATED
          : NutritionValueOrigin.CANONICAL_CALCULATED
        : null,
      confidence: match ? round(match.confidence, 4) : null,
    };
  });
}
