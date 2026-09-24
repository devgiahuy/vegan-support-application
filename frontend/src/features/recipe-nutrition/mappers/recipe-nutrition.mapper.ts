import { BaseMapper } from '@/lib/mapper/base-mapper';
import {
  pickField,
  safeNumber,
  safeString,
  safeBoolean,
  safeArray,
} from '@/lib/mapper/field-helpers';
import type {
  RecipeNutritionEstimateDto,
  RecipeNutritionStatusDto,
  NutrientAmountDto,
  UncoveredIngredientDto,
  NutritionValueOriginDto,
} from '../types/recipe-nutrition.dto';
import type {
  RecipeNutritionEstimateModel,
  RecipeNutritionStatusModel,
  RecipeNutritionHistoryItemModel,
  NutrientItemModel,
  MacroDistributionModel,
  UncoveredIngredientModel,
  NutritionOriginType,
} from '../types/recipe-nutrition.model';

export class RecipeNutritionMapper extends BaseMapper<
  RecipeNutritionEstimateDto,
  RecipeNutritionEstimateModel
> {
  toModel(dto: RecipeNutritionEstimateDto | null | undefined): RecipeNutritionEstimateModel {
    if (!dto || typeof dto !== 'object') {
      return this.createFallbackModel();
    }

    const id = pickField<string | null>(dto, ['id'], null);
    const revisionId = safeString(dto.revisionId, '');
    const postId = safeString(dto.postId, '');
    const postVersion = safeNumber(dto.postVersion, 1);
    const estimateVersion = safeNumber(dto.estimateVersion, 1);
    const statusRaw = pickField<string>(dto, ['status'], 'CURRENT');
    const status = (
      ['CURRENT', 'HISTORICAL', 'STALE'].includes(statusRaw) ? statusRaw : 'CURRENT'
    ) as 'CURRENT' | 'HISTORICAL' | 'STALE';
    const isStale = safeBoolean(dto.stale, false);
    const servings = Math.max(1, safeNumber(dto.servings, 1));
    const totalRawGrams = Math.max(0, safeNumber(dto.totalRawGrams, 0));
    const totalCookedGrams = Math.max(0, safeNumber(dto.totalCookedGrams, 0));

    // Confidence: normalized 0-1 from backend, convert to percentage 0-100
    const rawConfidence = safeNumber(dto.confidence, 0);
    const confidenceScore = Math.min(100, Math.max(0, Math.round(rawConfidence * 100)));

    // Nutrients mapping
    const perServingNutrients = safeArray<NutrientAmountDto, NutrientItemModel>(
      dto.perServingNutrients,
      (item) => this.toNutrientItemModel(item)
    );
    const totalNutrients = safeArray<NutrientAmountDto, NutrientItemModel>(
      dto.totalNutrients,
      (item) => this.toNutrientItemModel(item)
    );

    // Calculate Macro distribution per serving
    const macros = this.calculateMacroDistribution(perServingNutrients);

    // Uncovered ingredients
    const uncoveredIngredients = safeArray<UncoveredIngredientDto, UncoveredIngredientModel>(
      dto.uncoveredIngredients,
      (item) => this.toUncoveredIngredientModel(item)
    );
    const hasUncoveredIngredients = uncoveredIngredients.length > 0;

    // AI Info
    const aiAssisted = safeBoolean(dto.ai?.used, false);
    const aiProviderDown = safeBoolean(dto.ai?.providerDown, false);

    // Disclaimer & Date
    const disclaimerText = safeString(
      dto.disclaimer,
      'Số liệu dinh dưỡng mang tính hướng dẫn giáo dục, không thay thế chẩn đoán y khoa.'
    );
    const createdAtStr = safeString(dto.createdAt, '');
    let formattedCreatedAt = '';
    if (createdAtStr) {
      try {
        const date = new Date(createdAtStr);
        formattedCreatedAt = date.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        formattedCreatedAt = createdAtStr;
      }
    }

    return {
      id,
      revisionId,
      postId,
      postVersion,
      estimateVersion,
      status,
      isStale,
      servings,
      totalRawGrams,
      totalCookedGrams,
      confidenceScore,
      hasUncoveredIngredients,
      uncoveredIngredients,
      macros,
      perServingNutrients,
      totalNutrients,
      aiAssisted,
      aiProviderDown,
      disclaimerText,
      formattedCreatedAt,
    };
  }

  toStatusModel(dto: RecipeNutritionStatusDto | null | undefined): RecipeNutritionStatusModel {
    if (!dto || typeof dto !== 'object') {
      return {
        postId: '',
        revisionId: '',
        isStale: false,
        currentStatus: 'NONE',
        hasCurrentEstimate: false,
        aiJobInProgress: false,
        aiJobFailed: false,
      };
    }

    const postId = safeString(dto.postId, '');
    const revisionId = safeString(dto.revisionId, '');
    const isStale = safeBoolean(dto.stale, false);
    const currentEstimateId = pickField<string | null>(dto, ['currentEstimateId'], null);
    const hasCurrentEstimate = Boolean(currentEstimateId);

    const statusRaw = pickField<string | null>(dto, ['currentStatus'], null);
    let currentStatus: 'CURRENT' | 'HISTORICAL' | 'STALE' | 'NONE' = 'NONE';
    if (statusRaw && ['CURRENT', 'HISTORICAL', 'STALE'].includes(statusRaw)) {
      currentStatus = statusRaw as 'CURRENT' | 'HISTORICAL' | 'STALE';
    }

    const aiStatus = dto.latestAiJob?.status;
    const aiJobInProgress = aiStatus === 'QUEUED' || aiStatus === 'PROCESSING';
    const aiJobFailed = aiStatus === 'FAILED';

    return {
      postId,
      revisionId,
      isStale,
      currentStatus,
      hasCurrentEstimate,
      aiJobInProgress,
      aiJobFailed,
    };
  }

  toHistoryList(
    dtos: (RecipeNutritionEstimateDto | null | undefined)[] | null | undefined
  ): RecipeNutritionHistoryItemModel[] {
    const list = safeArray<
      RecipeNutritionEstimateDto | null | undefined,
      RecipeNutritionHistoryItemModel | null
    >(dtos, (item) => {
      if (!item) return null;
      const model = this.toModel(item);
      return {
        estimateVersion: model.estimateVersion,
        createdAt: safeString(item.createdAt, ''),
        formattedDate: model.formattedCreatedAt,
        servings: model.servings,
        caloriesPerServing: model.macros.calories,
        confidenceScore: model.confidenceScore,
        isStale: model.isStale,
        aiAssisted: model.aiAssisted,
      };
    });
    return list.filter((x): x is RecipeNutritionHistoryItemModel => x !== null);
  }

  private toNutrientItemModel(dto: NutrientAmountDto | null | undefined): NutrientItemModel {
    if (!dto) {
      return {
        code: '',
        name: '',
        unit: '',
        amount: 0,
        formattedAmount: '0',
        origin: 'CANONICAL_CALCULATED',
        isAiEstimated: false,
        confidencePercent: 0,
        rangeDisplay: null,
      };
    }

    const code = safeString(dto.nutrientCode, '');
    const name = safeString(dto.nutrientName, code);
    const unit = safeString(dto.unit, '');
    const amount = Math.round(safeNumber(dto.amount, 0) * 10) / 10;
    const formattedAmount = `${amount} ${unit}`.trim();

    const originRaw = pickField<NutritionValueOriginDto>(dto, ['origin'], 'CANONICAL_CALCULATED');
    const origin: NutritionOriginType = [
      'CANONICAL_CALCULATED',
      'AI_ESTIMATED',
      'USER_PROVIDED',
      'VERIFIED_OVERRIDE',
    ].includes(originRaw)
      ? originRaw
      : 'CANONICAL_CALCULATED';

    const isAiEstimated = origin === 'AI_ESTIMATED';
    const confidencePercent = Math.min(
      100,
      Math.max(0, Math.round(safeNumber(dto.confidence, 0) * 100))
    );

    let rangeDisplay: string | null = null;
    if (dto.min !== null && dto.max !== null && dto.min !== undefined && dto.max !== undefined) {
      rangeDisplay = `${dto.min} - ${dto.max} ${unit}`.trim();
    }

    return {
      code,
      name,
      unit,
      amount,
      formattedAmount,
      origin,
      isAiEstimated,
      confidencePercent,
      rangeDisplay,
    };
  }

  private toUncoveredIngredientModel(
    dto: UncoveredIngredientDto | null | undefined
  ): UncoveredIngredientModel {
    if (!dto) {
      return {
        position: 0,
        displayName: 'Nguyên liệu không xác định',
        reason: 'Chưa có dữ liệu thành phần',
      };
    }

    return {
      position: safeNumber(dto.position, 0),
      displayName: safeString(dto.displayName, 'Nguyên liệu không xác định'),
      reason: safeString(dto.reason, 'Chưa có trong cơ sở dữ liệu dinh dưỡng'),
    };
  }

  private calculateMacroDistribution(
    perServingNutrients: NutrientItemModel[]
  ): MacroDistributionModel {
    const calNutrient = perServingNutrients.find(
      (n) => n.code.toUpperCase() === 'ENERC_KCAL' || n.code.toUpperCase() === 'CALORIES'
    );
    const proNutrient = perServingNutrients.find(
      (n) => n.code.toUpperCase() === 'PROCNT' || n.code.toUpperCase() === 'PROTEIN'
    );
    const carbNutrient = perServingNutrients.find(
      (n) => n.code.toUpperCase() === 'CHOCDF' || n.code.toUpperCase() === 'CARBS'
    );
    const fatNutrient = perServingNutrients.find(
      (n) => n.code.toUpperCase() === 'FAT' || n.code.toUpperCase() === 'LIPID'
    );

    const calories = calNutrient ? calNutrient.amount : 0;
    const proteinGrams = proNutrient ? proNutrient.amount : 0;
    const carbsGrams = carbNutrient ? carbNutrient.amount : 0;
    const fatGrams = fatNutrient ? fatNutrient.amount : 0;

    if (calories <= 0) {
      return {
        calories: 0,
        proteinGrams,
        carbsGrams,
        fatGrams,
        proteinCaloriesPercent: 0,
        carbsCaloriesPercent: 0,
        fatCaloriesPercent: 0,
      };
    }

    // 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
    const proteinCaloriesPercent = Math.round(((proteinGrams * 4) / calories) * 100);
    const carbsCaloriesPercent = Math.round(((carbsGrams * 4) / calories) * 100);
    const fatCaloriesPercent = Math.round(((fatGrams * 9) / calories) * 100);

    return {
      calories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      proteinCaloriesPercent,
      carbsCaloriesPercent,
      fatCaloriesPercent,
    };
  }

  private createFallbackModel(): RecipeNutritionEstimateModel {
    return {
      id: null,
      revisionId: '',
      postId: '',
      postVersion: 1,
      estimateVersion: 1,
      status: 'CURRENT',
      isStale: false,
      servings: 1,
      totalRawGrams: 0,
      totalCookedGrams: 0,
      confidenceScore: 0,
      hasUncoveredIngredients: false,
      uncoveredIngredients: [],
      macros: {
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        proteinCaloriesPercent: 0,
        carbsCaloriesPercent: 0,
        fatCaloriesPercent: 0,
      },
      perServingNutrients: [],
      totalNutrients: [],
      aiAssisted: false,
      aiProviderDown: false,
      disclaimerText:
        'Số liệu dinh dưỡng mang tính hướng dẫn giáo dục, không thay thế chẩn đoán y khoa.',
      formattedCreatedAt: '',
    };
  }
}

export const recipeNutritionMapper = new RecipeNutritionMapper();
