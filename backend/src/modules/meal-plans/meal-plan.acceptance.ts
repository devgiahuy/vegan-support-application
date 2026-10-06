import assert from 'node:assert/strict';
import { PantryConfirmationStatus } from '@prisma/client';
import {
  addMealMacroValues,
  estimateMealMacroTargets,
  isMacroOverTarget,
  macroDistance,
  macroTargetDeviationScore,
} from '../../common/nutrition/meal-macros.js';
import {
  massFactorToGrams,
  normalizeAggregationUnit,
  normalizeDisplayUnit,
} from '../../common/units/unit-normalization.js';
import { classifyPantryExpiry } from '../pantry/pantry.service.js';
import { buildWeeklySlotBlueprint } from './weekly-plan.js';
import { mealPlanWarningCopy, MealPlanService } from './meal-plan.service.js';
import type { MealPlanRepository } from './meal-plan.repository.js';
import type { ContentRepository, PublishedPostRecord } from '../content/content.repository.js';
import type { RecommendationService } from '../recommendations/recommendation.service.js';
import type { MealAnalysisService } from '../meal-analysis/meal-analysis.service.js';
import type { AppConfig } from '../../config/env.js';

const blueprint = buildWeeklySlotBlueprint(new Date('2026-09-28T00:00:00.000Z'));
assert.equal(blueprint.length, 21);
assert.equal(new Set(blueprint.map((slot) => slot.date.toISOString().slice(0, 10))).size, 7);
assert.deepEqual(
  blueprint.slice(0, 3).map((slot) => slot.mealType),
  ['BREAKFAST', 'LUNCH', 'DINNER'],
);

const targets = estimateMealMacroTargets(2_000, {
  proteinEnergyPercent: 20,
  fatEnergyPercent: 30,
  carbohydrateEnergyPercent: 50,
  fiberGramsPer1000Kcal: 14,
  tolerancePercent: 15,
});
assert.deepEqual(
  {
    proteinGrams: targets.proteinGrams,
    fiberGrams: targets.fiberGrams,
    fatGrams: targets.fatGrams,
    carbohydrateGrams: targets.carbohydrateGrams,
  },
  { proteinGrams: 100, fiberGrams: 28, fatGrams: 66.67, carbohydrateGrams: 250 },
);

const nearer = addMealMacroValues(
  { proteinGrams: 70, fiberGrams: 20, fatGrams: 40, carbohydrateGrams: 180 },
  { proteinGrams: 25, fiberGrams: 7, fatGrams: 20, carbohydrateGrams: 60 },
);
const farther = addMealMacroValues(
  { proteinGrams: 70, fiberGrams: 20, fatGrams: 40, carbohydrateGrams: 180 },
  { proteinGrams: 5, fiberGrams: 1, fatGrams: 50, carbohydrateGrams: 10 },
);
assert(macroDistance(nearer, targets) < macroDistance(farther, targets));
assert(
  macroTargetDeviationScore(
    { proteinGrams: 100, fiberGrams: 32, fatGrams: 66, carbohydrateGrams: 250 },
    targets,
    15,
  ) <
    macroTargetDeviationScore(
      { proteinGrams: 100, fiberGrams: 55, fatGrams: 66, carbohydrateGrams: 250 },
      targets,
      15,
    ),
  'a comparable 32 g fibre day must beat a 55 g fibre day for a 28 g target',
);
assert(
  macroTargetDeviationScore(
    { proteinGrams: 96, fiberGrams: 28, fatGrams: 66, carbohydrateGrams: 250 },
    targets,
    15,
  ) <
    macroTargetDeviationScore(
      { proteinGrams: 66, fiberGrams: 28, fatGrams: 66, carbohydrateGrams: 250 },
      targets,
      15,
    ),
  'a later meal that compensates a protein deficit must be preferred',
);
assert.equal(isMacroOverTarget(114, 100, 15), false);
assert.equal(isMacroOverTarget(116, 100, 15), true);

assert.equal(normalizeDisplayUnit('grams'), 'g');
assert.equal(normalizeDisplayUnit('Kilogram'), 'kg');
assert.equal(normalizeDisplayUnit('cai'), 'cái');
assert.deepEqual(normalizeAggregationUnit('kg'), { unit: 'g', factor: 1_000 });
assert.deepEqual(normalizeAggregationUnit('cái'), { unit: 'cái', factor: 1 });
assert.equal(massFactorToGrams('cái'), null);

assert.equal(classifyPantryExpiry(PantryConfirmationStatus.CONFIRMED, 4), 'GOOD');
assert.equal(classifyPantryExpiry(PantryConfirmationStatus.CONFIRMED, 3), 'WARNING');
assert.equal(classifyPantryExpiry(PantryConfirmationStatus.CONFIRMED, 2), 'WARNING');
assert.equal(classifyPantryExpiry(PantryConfirmationStatus.CONFIRMED, 1), 'ALERT');
assert.equal(classifyPantryExpiry(PantryConfirmationStatus.CONFIRMED, 0), 'ALERT');
assert.equal(classifyPantryExpiry(PantryConfirmationStatus.CONFIRMED, -1), 'EXPIRED');
assert.equal(classifyPantryExpiry(PantryConfirmationStatus.PENDING, 1), null);

const repeatedWarning = mealPlanWarningCopy('RECIPE_REPEATED');
assert.equal(repeatedWarning?.severityLabel, 'Thông tin');
assert.equal(mealPlanWarningCopy('MICRONUTRIENT_DATA_PARTIAL'), null);

const utf8FixtureTitle = 'Cơm Lứt Đậu Hũ Cải Bó Xôi Buổi Sáng';
assert.equal(Buffer.from(utf8FixtureTitle, 'utf8').toString('utf8'), utf8FixtureTitle);
assert.doesNotMatch(utf8FixtureTitle, /[ÃÄÆ]/u);

const captureError = new Error('CAPTURE_COMPLETE');
let capturedItems: Array<{ status: string; reasonCodes: unknown; warningCodes: unknown }> = [];
const generatedCandidate = {
  id: '10000000-0000-4000-8000-000000000001',
  publishedRevision: {
    id: '20000000-0000-4000-8000-000000000001',
    recipeDetail: {
      calories: 900,
      proteinGrams: 30,
      fiberGrams: 10,
      fatGrams: 20,
      carbsGrams: 100,
      vitaminB12Mcg: null,
    },
    ingredients: [],
  },
} as unknown as PublishedPostRecord;
const repository = {
  findByIdempotency: () => Promise.resolve(null),
  findHealthProfile: () => Promise.resolve({ tdee: 2_000 }),
  createPlan: (data: { items: typeof capturedItems }) => {
    capturedItems = data.items;
    return Promise.reject(captureError);
  },
  isUniqueConstraintError: () => false,
} as unknown as MealPlanRepository;
const contentRepository = {
  findSearchProfile: () => Promise.resolve(null),
  findMealPlannerCandidates: () => Promise.resolve([generatedCandidate]),
} as unknown as ContentRepository;
const recommendationService = {
  rankPublishedRecipes: () => Promise.resolve(new Map()),
} as unknown as RecommendationService;
const config = {
  mealPlanGoalFactors: { MAINTAIN: 1, LOSE: 0.9, GAIN: 1.1 },
  mealPlanMacroTargets: {
    proteinEnergyPercent: 20,
    fatEnergyPercent: 30,
    carbohydrateEnergyPercent: 50,
    fiberGramsPer1000Kcal: 14,
    tolerancePercent: 15,
  },
} as unknown as AppConfig;
const service = new MealPlanService(
  repository,
  contentRepository,
  recommendationService,
  config,
  {} as MealAnalysisService,
);
try {
  await service.generate('30000000-0000-4000-8000-000000000001', {
    weekStart: '2026-09-28',
    goal: 'MAINTAIN',
    idempotencyKey: 'acceptance-generate-21',
    seed: 'acceptance',
  });
  assert.fail('generate should stop at the capture repository');
} catch (error) {
  assert.equal(error, captureError);
}
assert.equal(capturedItems.length, 21);
assert(capturedItems.every((item) => item.status === 'FILLED'));
assert(
  capturedItems
    .slice(2)
    .some((item) =>
      Array.isArray(item.warningCodes)
        ? item.warningCodes.includes('CALORIE_TOLERANCE_WIDENED')
        : false,
    ),
);

function fixtureCandidate(
  id: string,
  macros: { protein: number | null; fiber: number | null; fat: number | null; carbs: number | null },
) {
  return {
    id,
    publishedRevision: {
      id: `revision-${id}`,
      recipeDetail: {
        calories: 667,
        proteinGrams: macros.protein,
        fiberGrams: macros.fiber,
        fatGrams: macros.fat,
        carbsGrams: macros.carbs,
        vitaminB12Mcg: null,
      },
      ingredients: [],
    },
  } as unknown as PublishedPostRecord;
}

async function captureOptimizedPlan(candidates: PublishedPostRecord[]) {
  let items: Array<{ recipeId?: string; servings: number; status: string }> = [];
  const stop = new Error('OPTIMIZED_CAPTURE_COMPLETE');
  const optimizedRepository = {
    findByIdempotency: () => Promise.resolve(null),
    findHealthProfile: () => Promise.resolve({ tdee: 2_000 }),
    createPlan: (data: { items: typeof items }) => {
      items = data.items;
      return Promise.reject(stop);
    },
    isUniqueConstraintError: () => false,
  } as unknown as MealPlanRepository;
  const optimizedContentRepository = {
    findSearchProfile: () => Promise.resolve(null),
    findMealPlannerCandidates: () => Promise.resolve(candidates),
  } as unknown as ContentRepository;
  const optimizedService = new MealPlanService(
    optimizedRepository,
    optimizedContentRepository,
    recommendationService,
    config,
    {} as MealAnalysisService,
  );
  try {
    await optimizedService.generate('30000000-0000-4000-8000-000000000002', {
      weekStart: '2026-09-28',
      goal: 'MAINTAIN',
      idempotencyKey: `acceptance-optimized-${candidates.map((candidate) => candidate.id).join('-')}`,
      seed: 'optimized-acceptance',
    });
    assert.fail('optimized generation should stop at the capture repository');
  } catch (error) {
    assert.equal(error, stop);
  }
  return items;
}

const proteinCompensation = fixtureCandidate('protein-compensation', {
  protein: 60,
  fiber: 10,
  fat: 22,
  carbs: 84,
});
const lowProteinBreakfast = fixtureCandidate('low-protein-breakfast', {
  protein: 20,
  fiber: 9,
  fat: 22,
  carbs: 83,
});
const lowProteinLunch = fixtureCandidate('low-protein-lunch', {
  protein: 20,
  fiber: 9,
  fat: 22,
  carbs: 83,
});
const fiberOvershoot = fixtureCandidate('fiber-overshoot', {
  protein: 33,
  fiber: 55,
  fat: 22,
  carbs: 83,
});
const incompleteMacros = fixtureCandidate('incomplete-macros', {
  protein: null,
  fiber: null,
  fat: null,
  carbs: null,
});
const hardIncompatibleNeverReturned = fixtureCandidate('hard-incompatible-never-returned', {
  protein: 100,
  fiber: 28,
  fat: 67,
  carbs: 250,
});
const optimizedItems = await captureOptimizedPlan([
  proteinCompensation,
  lowProteinBreakfast,
  lowProteinLunch,
  fiberOvershoot,
  incompleteMacros,
]);
assert.equal(optimizedItems.length, 21);
assert(optimizedItems.every((item) => item.status === 'FILLED'));
const firstDayIds = optimizedItems.slice(0, 3).map((item) => item.recipeId);
assert(firstDayIds.includes('protein-compensation'));
assert(!firstDayIds.includes('fiber-overshoot'));
assert(!firstDayIds.includes('incomplete-macros'));
assert(!optimizedItems.some((item) => item.recipeId === hardIncompatibleNeverReturned.id));

const varietyCandidates = Array.from({ length: 21 }, (_, index) =>
  fixtureCandidate(`variety-${String(index).padStart(2, '0')}`, {
    protein: 100 / 3,
    fiber: 28 / 3,
    fat: 66.67 / 3,
    carbs: 250 / 3,
  }),
);
const varietyItems = await captureOptimizedPlan(varietyCandidates);
assert.equal(new Set(varietyItems.map((item) => item.recipeId)).size, 21);

process.stdout.write(
  'Meal-plan daily-combination, macro, unit normalization, and pantry expiry acceptance checks passed.\n',
);
