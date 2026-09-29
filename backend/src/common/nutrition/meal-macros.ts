export const MEAL_MACRO_CODES = ['PROTEIN', 'FIBER', 'FAT', 'CARBS'] as const;

export type MealMacroCode = (typeof MEAL_MACRO_CODES)[number];

export interface MealMacroValues {
  proteinGrams: number | null;
  fiberGrams: number | null;
  fatGrams: number | null;
  carbohydrateGrams: number | null;
}

export interface MealMacroTargetConfig {
  proteinEnergyPercent: number;
  fatEnergyPercent: number;
  carbohydrateEnergyPercent: number;
  fiberGramsPer1000Kcal: number;
  tolerancePercent: number;
}

export interface EstimatedMealMacroTargets extends MealMacroValues {
  estimated: true;
  source: 'HEALTH_PROFILE_TDEE_GOAL_CONFIG';
  sourceDetail: string;
  tolerancePercent: number;
}

function rounded(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function estimateMealMacroTargets(
  targetCalories: number,
  config: MealMacroTargetConfig,
): EstimatedMealMacroTargets {
  return {
    proteinGrams: rounded((targetCalories * config.proteinEnergyPercent) / 100 / 4),
    fiberGrams: rounded((targetCalories / 1000) * config.fiberGramsPer1000Kcal),
    fatGrams: rounded((targetCalories * config.fatEnergyPercent) / 100 / 9),
    carbohydrateGrams: rounded(
      (targetCalories * config.carbohydrateEnergyPercent) / 100 / 4,
    ),
    estimated: true,
    source: 'HEALTH_PROFILE_TDEE_GOAL_CONFIG',
    sourceDetail:
      'Estimated from the stored health-profile TDEE, the selected goal factor, and configured macro distribution; values are approximate targets, not measurements.',
    tolerancePercent: config.tolerancePercent,
  };
}

export function emptyMealMacroValues(): MealMacroValues {
  return {
    proteinGrams: null,
    fiberGrams: null,
    fatGrams: null,
    carbohydrateGrams: null,
  };
}

export function addMealMacroValues(
  left: MealMacroValues,
  right: MealMacroValues,
): MealMacroValues {
  const add = (a: number | null, b: number | null) =>
    a === null && b === null ? null : rounded((a ?? 0) + (b ?? 0));
  return {
    proteinGrams: add(left.proteinGrams, right.proteinGrams),
    fiberGrams: add(left.fiberGrams, right.fiberGrams),
    fatGrams: add(left.fatGrams, right.fatGrams),
    carbohydrateGrams: add(left.carbohydrateGrams, right.carbohydrateGrams),
  };
}

export function scaleMealMacroValues(values: MealMacroValues, multiplier: number): MealMacroValues {
  const scale = (value: number | null) => (value === null ? null : rounded(value * multiplier));
  return {
    proteinGrams: scale(values.proteinGrams),
    fiberGrams: scale(values.fiberGrams),
    fatGrams: scale(values.fatGrams),
    carbohydrateGrams: scale(values.carbohydrateGrams),
  };
}

export function macroDistance(values: MealMacroValues, targets: MealMacroValues): number {
  const pairs = [
    [values.proteinGrams, targets.proteinGrams],
    [values.fiberGrams, targets.fiberGrams],
    [values.fatGrams, targets.fatGrams],
    [values.carbohydrateGrams, targets.carbohydrateGrams],
  ] as const;
  const comparable = pairs.filter(
    (pair): pair is readonly [number, number] => pair[0] !== null && pair[1] !== null && pair[1] > 0,
  );
  if (!comparable.length) return Number.POSITIVE_INFINITY;
  return comparable.reduce((sum, [value, target]) => sum + Math.abs(value - target) / target, 0);
}

export function isMacroOverTarget(
  estimatedValue: number | null,
  targetValue: number | null,
  tolerancePercent: number,
): boolean {
  return (
    estimatedValue !== null &&
    targetValue !== null &&
    estimatedValue > targetValue * (1 + tolerancePercent / 100)
  );
}
