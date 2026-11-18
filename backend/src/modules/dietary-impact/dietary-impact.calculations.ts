import { NutritionDataQuality, type Prisma } from '@prisma/client';
import { normalizeAggregationUnit } from '../../common/units/unit-normalization.js';
import type { PublishedPostRecord } from '../content/content.repository.js';
import type { MealPlanRecord } from '../meal-plans/meal-plan.repository.js';
import type { z } from '../../common/validation/zod.js';
import type { repairNutritionSchema, repairShoppingItemSchema } from './dietary-impact.schemas.js';

type Nutrition = z.infer<typeof repairNutritionSchema>;
type Shopping = z.infer<typeof repairShoppingItemSchema>;
type Item = MealPlanRecord['items'][number];
const metrics = [
  'calories',
  'proteinGrams',
  'fiberGrams',
  'fatGrams',
  'carbohydrateGrams',
] as const;
export function itemName(item: Item): string {
  return item.recipeRevision?.title ?? item.customMeal?.name ?? 'Món ăn đã lưu';
}
export function sumNutrition(
  plan: MealPlanRecord,
  replacements: Map<string, PublishedPostRecord> = new Map(),
): Nutrition {
  const totals: Nutrition = {
    calories: 0,
    proteinGrams: 0,
    fiberGrams: 0,
    fatGrams: 0,
    carbohydrateGrams: 0,
  };
  for (const item of plan.items) {
    if (item.status !== 'FILLED') continue;
    const replacement = replacements.get(item.id);
    const detail =
      replacement?.publishedRevision?.recipeDetail ?? item.recipeRevision?.recipeDetail;
    const custom = replacement ? null : item.customMeal;
    const values: Nutrition = {
      calories: replacement ? (detail?.calories ?? null) : item.calories,
      proteinGrams: detail?.proteinGrams ?? custom?.userProteinGrams ?? null,
      fiberGrams: detail?.fiberGrams ?? custom?.userFiberGrams ?? null,
      fatGrams: detail?.fatGrams ?? custom?.userFatGrams ?? null,
      carbohydrateGrams: detail?.carbsGrams ?? custom?.userCarbsGrams ?? null,
    };
    for (const metric of metrics) {
      const value = values[metric];
      if (value === null) totals[metric] = null;
      else if (totals[metric] !== null) {
        const factor =
          metric === 'calories' && !replacement
            ? 1
            : item.servings / Math.max(1, custom?.servings ?? 1);
        totals[metric] = Math.round((totals[metric] + Number(value) * factor) * 100) / 100;
      }
    }
  }
  return totals;
}
export function aggregateRepair(
  plan: MealPlanRecord,
  replacements: Map<string, PublishedPostRecord>,
) {
  const groups = new Map<string, Shopping>();
  const units = new Map<string, Set<string>>();
  let b12 = 0,
    withData = 0,
    filled = 0;
  const warnings = new Set<string>();
  for (const item of plan.items) {
    const replacement = replacements.get(item.id);
    if (item.status !== 'FILLED') {
      if (Array.isArray(item.warningCodes))
        for (const code of item.warningCodes) if (typeof code === 'string') warnings.add(code);
      continue;
    }
    filled++;
    const revision = replacement?.publishedRevision ?? item.recipeRevision;
    const custom = replacement ? null : item.customMeal;
    const b12value = revision?.recipeDetail?.vitaminB12Mcg;
    if (b12value != null) {
      withData++;
      b12 += Number(b12value) * item.servings;
    }
    const ingredients = revision?.ingredients ?? custom?.ingredients ?? [];
    const recipeServings = revision?.recipeDetail?.servings ?? custom?.servings ?? 1;
    for (const ingredient of ingredients) {
      if (!ingredient.ingredientId || !ingredient.ingredient) continue;
      const conversion = normalizeAggregationUnit(ingredient.unit);
      const key = ingredient.ingredientId + ':' + conversion.unit;
      const current = groups.get(key);
      const amount =
        (Number(ingredient.amount) * item.servings * conversion.factor) /
        Math.max(1, recipeServings);
      if (amount <= 0) continue;
      groups.set(key, {
        ingredientId: ingredient.ingredientId,
        canonicalName: ingredient.ingredient.canonicalName,
        amount: Math.round(((current?.amount ?? 0) + amount) * 1000) / 1000,
        unit: conversion.unit,
        sourceItemCount: (current?.sourceItemCount ?? 0) + 1,
      });
      const list = units.get(ingredient.ingredientId) ?? new Set<string>();
      list.add(conversion.unit);
      units.set(ingredient.ingredientId, list);
    }
    if (!replacement && Array.isArray(item.warningCodes))
      for (const code of item.warningCodes) if (typeof code === 'string') warnings.add(code);
    if (replacement) {
      const calories = revision?.recipeDetail?.calories;
      if (
        calories == null ||
        Math.abs(Number(calories) * item.servings - item.targetCalories) / item.targetCalories > 0.2
      )
        warnings.add('NUTRITION_TARGET_OUTSIDE_TOLERANCE');
    }
  }
  if ([...units.values()].some((values) => values.size > 1))
    warnings.add('SHOPPING_UNIT_NOT_COMBINED');
  return {
    shopping: [...groups.values()]
      .filter((item) => item.amount > 0)
      .sort(
        (a, b) => a.canonicalName.localeCompare(b.canonicalName) || a.unit.localeCompare(b.unit),
      ),
    warnings: [...warnings].sort(),
    nutritionDataQuality:
      withData === 0
        ? NutritionDataQuality.UNAVAILABLE
        : withData === filled
          ? NutritionDataQuality.COMPLETE
          : NutritionDataQuality.PARTIAL,
    micronutrientSummary: {
      vitaminB12Mcg: withData ? Math.round(b12 * 100) / 100 : null,
      recipesWithData: withData,
      filledRecipeCount: filled,
    },
  };
}
export function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
