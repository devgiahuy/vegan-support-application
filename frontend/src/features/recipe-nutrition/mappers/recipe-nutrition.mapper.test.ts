import { describe, it, expect } from 'vitest';
import { recipeNutritionMapper } from './recipe-nutrition.mapper';
import type {
  RecipeNutritionEstimateDto,
  RecipeNutritionStatusDto,
} from '../types/recipe-nutrition.dto';

describe('RecipeNutritionMapper', () => {
  const mockValidEstimateDto: RecipeNutritionEstimateDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    revisionId: '223e4567-e89b-12d3-a456-426614174001',
    postId: '323e4567-e89b-12d3-a456-426614174002',
    postVersion: 1,
    estimateVersion: 1,
    status: 'CURRENT',
    stale: false,
    calculationVersion: 'recipe-nutrition-v1',
    recipeFingerprint: 'abc123hash',
    servings: 2,
    totalRawGrams: 500,
    totalCookedGrams: 450,
    totalNutrients: [
      {
        nutrientCode: 'ENERC_KCAL',
        nutrientName: 'Năng lượng',
        unit: 'kcal',
        amount: 800,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.95,
        min: null,
        max: null,
      },
      {
        nutrientCode: 'PROCNT',
        nutrientName: 'Chất đạm',
        unit: 'g',
        amount: 40,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.9,
        min: null,
        max: null,
      },
      {
        nutrientCode: 'CHOCDF',
        nutrientName: 'Tinh bột',
        unit: 'g',
        amount: 100,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.9,
        min: null,
        max: null,
      },
      {
        nutrientCode: 'FAT',
        nutrientName: 'Chất béo',
        unit: 'g',
        amount: 20,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.9,
        min: null,
        max: null,
      },
    ],
    perServingNutrients: [
      {
        nutrientCode: 'ENERC_KCAL',
        nutrientName: 'Năng lượng',
        unit: 'kcal',
        amount: 400,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.95,
        min: null,
        max: null,
      },
      {
        nutrientCode: 'PROCNT',
        nutrientName: 'Chất đạm',
        unit: 'g',
        amount: 20,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.9,
        min: null,
        max: null,
      },
      {
        nutrientCode: 'CHOCDF',
        nutrientName: 'Tinh bột',
        unit: 'g',
        amount: 50,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.9,
        min: null,
        max: null,
      },
      {
        nutrientCode: 'FAT',
        nutrientName: 'Chất béo',
        unit: 'g',
        amount: 10,
        origin: 'CANONICAL_CALCULATED',
        confidence: 0.9,
        min: null,
        max: null,
      },
      {
        nutrientCode: 'FE',
        nutrientName: 'Sắt',
        unit: 'mg',
        amount: 3.5,
        origin: 'AI_ESTIMATED',
        confidence: 0.7,
        min: 2.0,
        max: 5.0,
      },
    ],
    lines: [],
    uncoveredIngredients: [
      {
        recipeIngredientId: null,
        position: 1,
        displayName: 'Lá chúc tươi',
        reason: 'Chưa có trong cơ sở dữ liệu USDA/Viện Dinh Dưỡng',
      },
    ],
    sourceVersions: [],
    assumptions: [],
    confidence: 0.85,
    uncertainty: {},
    ai: {
      used: true,
      provider: 'openai',
      modelId: 'gpt-4o-mini',
      status: 'COMPLETED',
      providerDown: false,
    },
    disclaimer: 'Nutrition estimates are educational guidance only.',
    createdAt: '2026-09-23T12:00:00.000Z',
  };

  it('1. maps complete valid DTO to RecipeNutritionEstimateModel accurately', () => {
    const model = recipeNutritionMapper.toModel(mockValidEstimateDto);

    expect(model.id).toBe(mockValidEstimateDto.id);
    expect(model.servings).toBe(2);
    expect(model.totalRawGrams).toBe(500);
    expect(model.totalCookedGrams).toBe(450);
    expect(model.status).toBe('CURRENT');
    expect(model.isStale).toBe(false);
    expect(model.confidenceScore).toBe(85);
    expect(model.aiAssisted).toBe(true);
    expect(model.aiProviderDown).toBe(false);
  });

  it('2. handles null and undefined DTO gracefully without throwing errors', () => {
    const modelFromNull = recipeNutritionMapper.toModel(null);
    expect(modelFromNull.id).toBeNull();
    expect(modelFromNull.servings).toBe(1);
    expect(modelFromNull.confidenceScore).toBe(0);
    expect(modelFromNull.macros.calories).toBe(0);

    const modelFromUndefined = recipeNutritionMapper.toModel(undefined);
    expect(modelFromUndefined.id).toBeNull();
    expect(modelFromUndefined.servings).toBe(1);
  });

  it('3. calculates macro calories percentages correctly per serving', () => {
    const model = recipeNutritionMapper.toModel(mockValidEstimateDto);
    // 400 kcal total:
    // Protein: 20g * 4 = 80 kcal -> 80 / 400 = 20%
    // Carbs: 50g * 4 = 200 kcal -> 200 / 400 = 50%
    // Fat: 10g * 9 = 90 kcal -> 90 / 400 = 22.5% -> rounded 23%
    expect(model.macros.calories).toBe(400);
    expect(model.macros.proteinGrams).toBe(20);
    expect(model.macros.carbsGrams).toBe(50);
    expect(model.macros.fatGrams).toBe(10);
    expect(model.macros.proteinCaloriesPercent).toBe(20);
    expect(model.macros.carbsCaloriesPercent).toBe(50);
    expect(model.macros.fatCaloriesPercent).toBe(23);
  });

  it('4. prevents division by zero when calories is 0', () => {
    const zeroCalDto: RecipeNutritionEstimateDto = {
      ...mockValidEstimateDto,
      perServingNutrients: [
        {
          nutrientCode: 'ENERC_KCAL',
          nutrientName: 'Năng lượng',
          unit: 'kcal',
          amount: 0,
          origin: 'CANONICAL_CALCULATED',
          confidence: 1,
          min: null,
          max: null,
        },
      ],
    };
    const model = recipeNutritionMapper.toModel(zeroCalDto);
    expect(model.macros.calories).toBe(0);
    expect(model.macros.proteinCaloriesPercent).toBe(0);
    expect(model.macros.carbsCaloriesPercent).toBe(0);
    expect(model.macros.fatCaloriesPercent).toBe(0);
  });

  it('5. distinguishes canonical vs AI estimated nutrient origins correctly', () => {
    const model = recipeNutritionMapper.toModel(mockValidEstimateDto);
    const ironNutrient = model.perServingNutrients.find((n) => n.code === 'FE');
    const proteinNutrient = model.perServingNutrients.find((n) => n.code === 'PROCNT');

    expect(ironNutrient).toBeDefined();
    expect(ironNutrient?.isAiEstimated).toBe(true);
    expect(ironNutrient?.origin).toBe('AI_ESTIMATED');
    expect(ironNutrient?.rangeDisplay).toBe('2 - 5 mg');

    expect(proteinNutrient).toBeDefined();
    expect(proteinNutrient?.isAiEstimated).toBe(false);
    expect(proteinNutrient?.origin).toBe('CANONICAL_CALCULATED');
    expect(proteinNutrient?.rangeDisplay).toBeNull();
  });

  it('6. maps uncovered ingredients and sets hasUncoveredIngredients flag', () => {
    const model = recipeNutritionMapper.toModel(mockValidEstimateDto);
    expect(model.hasUncoveredIngredients).toBe(true);
    expect(model.uncoveredIngredients).toHaveLength(1);
    expect(model.uncoveredIngredients[0].displayName).toBe('Lá chúc tươi');
  });

  it('7. sets hasUncoveredIngredients false when list is empty', () => {
    const noUncoveredDto: RecipeNutritionEstimateDto = {
      ...mockValidEstimateDto,
      uncoveredIngredients: [],
    };
    const model = recipeNutritionMapper.toModel(noUncoveredDto);
    expect(model.hasUncoveredIngredients).toBe(false);
    expect(model.uncoveredIngredients).toHaveLength(0);
  });

  it('8. maps status and stale flag correctly', () => {
    const staleDto: RecipeNutritionEstimateDto = {
      ...mockValidEstimateDto,
      status: 'STALE',
      stale: true,
    };
    const model = recipeNutritionMapper.toModel(staleDto);
    expect(model.status).toBe('STALE');
    expect(model.isStale).toBe(true);
  });

  it('9. maps RecipeNutritionStatusDto to UI model with active AI job', () => {
    const statusDto: RecipeNutritionStatusDto = {
      postId: '323e4567-e89b-12d3-a456-426614174002',
      revisionId: '223e4567-e89b-12d3-a456-426614174001',
      currentEstimateId: '123e4567-e89b-12d3-a456-426614174000',
      currentStatus: 'CURRENT',
      stale: false,
      latestAiJob: {
        id: 'job-1',
        provider: 'openai',
        modelId: 'gpt-4o',
        status: 'PROCESSING',
        errorCode: null,
        startedAt: '2026-09-23T12:00:00Z',
        completedAt: null,
      },
    };

    const statusModel = recipeNutritionMapper.toStatusModel(statusDto);
    expect(statusModel.postId).toBe('323e4567-e89b-12d3-a456-426614174002');
    expect(statusModel.isStale).toBe(false);
    expect(statusModel.currentStatus).toBe('CURRENT');
    expect(statusModel.hasCurrentEstimate).toBe(true);
    expect(statusModel.aiJobInProgress).toBe(true);
    expect(statusModel.aiJobFailed).toBe(false);
  });

  it('10. maps RecipeNutritionStatusDto with failed AI job', () => {
    const statusDto: RecipeNutritionStatusDto = {
      postId: '323e4567-e89b-12d3-a456-426614174002',
      revisionId: '223e4567-e89b-12d3-a456-426614174001',
      currentEstimateId: null,
      currentStatus: null,
      stale: false,
      latestAiJob: {
        id: 'job-2',
        provider: 'openai',
        modelId: 'gpt-4o',
        status: 'FAILED',
        errorCode: 'PROVIDER_TIMEOUT',
        startedAt: '2026-09-23T12:00:00Z',
        completedAt: '2026-09-23T12:01:00Z',
      },
    };

    const statusModel = recipeNutritionMapper.toStatusModel(statusDto);
    expect(statusModel.hasCurrentEstimate).toBe(false);
    expect(statusModel.currentStatus).toBe('NONE');
    expect(statusModel.aiJobInProgress).toBe(false);
    expect(statusModel.aiJobFailed).toBe(true);
  });

  it('11. maps history list to RecipeNutritionHistoryItemModel array', () => {
    const historyList = recipeNutritionMapper.toHistoryList([mockValidEstimateDto]);
    expect(historyList).toHaveLength(1);
    expect(historyList[0].estimateVersion).toBe(1);
    expect(historyList[0].servings).toBe(2);
    expect(historyList[0].caloriesPerServing).toBe(400);
    expect(historyList[0].confidenceScore).toBe(85);
    expect(historyList[0].aiAssisted).toBe(true);
  });

  it('12. formats nutrient amounts with unit correctly', () => {
    const model = recipeNutritionMapper.toModel(mockValidEstimateDto);
    const kcalNutrient = model.perServingNutrients.find((n) => n.code === 'ENERC_KCAL');
    expect(kcalNutrient?.formattedAmount).toBe('400 kcal');
  });
});
