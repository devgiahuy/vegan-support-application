import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  AdminFoodDataRecordDto,
  CookingMethodDto,
  FoodDataImportResultDto,
  FoodDataPageMetaDto,
  HouseholdConversionDto,
  IngredientFoodProfileDto,
  IngredientIntakeGuidelineDto,
  IngredientInteractionRuleDto,
  IngredientNutrientsDataDto,
  IngredientNutrientValueDto,
  NutrientDto,
  NutrientReferenceIntakeDto,
  RetentionFactorDto,
  YieldFactorDto,
} from '../types/food-data.dto';
import {
  POPULATION_LABELS,
  RECORD_KIND_LABELS,
  SCOPE_LABELS,
  SEVERITY_LABELS,
  type AdminRecordItem,
  type CookingMethodItem,
  type EvidenceGrade,
  type FoodDataImportPreviewResult,
  type FoodDataQuality,
  type FoodDataRecordKind,
  type FoodInteractionRuleItem,
  type FoodRuleSeverity,
  type GuidelinePeriod,
  type HouseholdConversion,
  type IngredientGuidelineItem,
  type IngredientNutritionFact,
  type InteractionDirection,
  type InteractionScope,
  type NutrientItem,
  type NutrientReferenceType,
  type ProvenanceInfo,
  type ReferenceIntakeItem,
  type RetentionFactorItem,
  type YieldFactorItem,
} from '../types/food-data.model';

const MACRO_CODES = new Set([
  'PROTEIN',
  'FAT',
  'CARBOHYDRATE',
  'FIBER',
  'SUGAR',
  'FAT_SATURATED',
  'FAT_TRANS',
  'CHOLESTEROL',
]);

const MINERAL_CODES = new Set([
  'CALCIUM',
  'IRON',
  'ZINC',
  'MAGNESIUM',
  'POTASSIUM',
  'SODIUM',
  'PHOSPHORUS',
  'COPPER',
  'MANGANESE',
  'SELENIUM',
  'IODINE',
]);

const VITAMIN_CODES = new Set([
  'VITAMIN_A',
  'VITAMIN_C',
  'VITAMIN_D',
  'VITAMIN_E',
  'VITAMIN_K',
  'VITAMIN_B1',
  'THIAMIN',
  'VITAMIN_B2',
  'RIBOFLAVIN',
  'VITAMIN_B3',
  'NIACIN',
  'VITAMIN_B5',
  'PANTOTHENIC_ACID',
  'VITAMIN_B6',
  'VITAMIN_B7',
  'BIOTIN',
  'VITAMIN_B9',
  'FOLATE',
  'VITAMIN_B12',
]);

export function mapPageMeta(
  meta?: FoodDataPageMetaDto | null
): PaginationResult<unknown>['metadata'] {
  const page = safeNumber(pickField(meta, ['page'], 1), 1);
  const limit = safeNumber(pickField(meta, ['limit'], 20), 20);
  const totalItems = safeNumber(pickField(meta, ['total', 'totalItems'], 0), 0);
  const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1), 1);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export class FoodDataMapper extends BaseMapper<
  IngredientNutrientsDataDto,
  IngredientNutritionFact
> {
  toModel(dto: IngredientNutrientsDataDto | null | undefined): IngredientNutritionFact {
    const rawProfiles = safeArray<IngredientFoodProfileDto | null>(
      pickField(dto, ['foodProfiles', 'food_profiles'], null)
    ).filter((p): p is IngredientFoodProfileDto => p !== null);

    const profile: IngredientFoodProfileDto | undefined = rawProfiles[0];
    const sourceDto = profile ? pickField(profile, ['source'], null) : null;

    const provenance: ProvenanceInfo = {
      sourceId: safeString(pickField(sourceDto, ['id'], '')),
      sourceCode: safeString(pickField(sourceDto, ['code'], 'N/A')),
      sourceName: safeString(pickField(sourceDto, ['name'], 'Nguồn chưa xác định')),
      provider: safeString(pickField(sourceDto, ['provider'], 'Chưa xác định')),
      sourceRecordId: safeString(pickField(profile, ['sourceRecordId', 'source_record_id'], '')),
      sourceVersion: safeString(pickField(profile, ['sourceVersion', 'source_version'], '1.0')),
      sourceUrl: pickField(sourceDto, ['sourceUrl', 'source_url'], null),
      licenseName: safeString(pickField(sourceDto, ['licenseName', 'license_name'], 'N/A')),
      licenseUrl: pickField(sourceDto, ['licenseUrl', 'license_url'], null),
      attribution: safeString(pickField(sourceDto, ['attribution'], '')),
      effectiveFrom: safeString(pickField(profile, ['effectiveFrom', 'effective_from'], '')),
      locale: safeString(pickField(sourceDto, ['defaultLocale', 'default_locale'], 'vi-VN')),
    };

    const rawConversions = profile
      ? safeArray<HouseholdConversionDto | null>(
          pickField(profile, ['householdConversions', 'household_conversions'], null)
        ).filter((c): c is HouseholdConversionDto => c !== null)
      : [];

    const householdConversions: HouseholdConversion[] = rawConversions.map((c) => ({
      id: safeString(pickField(c, ['id'], '')),
      unitName: safeString(pickField(c, ['unitName', 'unit_name'], 'đơn vị')),
      unitSymbol: pickField(c, ['unitSymbol', 'unit_symbol'], null),
      quantity: safeNumber(pickField(c, ['quantity'], 1), 1),
      unitDimension: safeString(pickField(c, ['unitDimension', 'unit_dimension'], 'COUNT')),
      grams: safeNumber(pickField(c, ['grams'], 0), 0),
    }));

    const rawNutrients = profile
      ? safeArray<IngredientNutrientValueDto | null>(
          pickField(profile, ['nutrientValues', 'nutrient_values'], null)
        ).filter((nv): nv is IngredientNutrientValueDto => nv !== null)
      : [];

    let energyKcal: number | null = null;
    const macronutrients: NutrientItem[] = [];
    const vitamins: NutrientItem[] = [];
    const minerals: NutrientItem[] = [];
    const otherNutrients: NutrientItem[] = [];

    for (const nv of rawNutrients) {
      const nutrientDto: NutrientDto | null = pickField(nv, ['nutrient'], null);
      const code = safeString(pickField(nutrientDto, ['code'], '')).toUpperCase();
      const name = safeString(pickField(nutrientDto, ['name'], code || 'Dưỡng chất'));
      const unit = safeString(
        pickField(nv, ['unit'], pickField(nutrientDto, ['defaultUnit', 'default_unit'], 'g'))
      );
      const unitDimension = safeString(
        pickField(nutrientDto, ['unitDimension', 'unit_dimension'], 'MASS')
      );

      const rawAmount = pickField(nv, ['valuePer100g', 'value_per_100g'], null);
      const isMissing = rawAmount === null || rawAmount === undefined || rawAmount === '';
      const amount = isMissing ? null : safeNumber(rawAmount, 0);

      const rawMin = pickField(nv, ['minValue', 'min_value'], null);
      const minValue = rawMin !== null && rawMin !== undefined ? safeNumber(rawMin, 0) : null;
      const rawMax = pickField(nv, ['maxValue', 'max_value'], null);
      const maxValue = rawMax !== null && rawMax !== undefined ? safeNumber(rawMax, 0) : null;

      const item: NutrientItem = {
        id: safeString(pickField(nv, ['id'], code)),
        code,
        name,
        amount,
        unit,
        unitDimension,
        minValue,
        maxValue,
        isMissing,
      };

      if (code === 'ENERGY' || code === 'CALORIES') {
        energyKcal = amount;
      } else if (MACRO_CODES.has(code)) {
        macronutrients.push(item);
      } else if (MINERAL_CODES.has(code)) {
        minerals.push(item);
      } else if (VITAMIN_CODES.has(code)) {
        vitamins.push(item);
      } else {
        otherNutrients.push(item);
      }
    }

    const servingGramsRaw = profile
      ? pickField(profile, ['servingGrams', 'serving_grams'], null)
      : null;
    const servingGrams =
      servingGramsRaw !== null && servingGramsRaw !== undefined
        ? safeNumber(servingGramsRaw, 100)
        : null;

    return {
      ingredientId: safeString(pickField(dto, ['id'], '')),
      canonicalName: safeString(pickField(dto, ['canonicalName', 'canonical_name'], 'Nguyên liệu')),
      normalizedName: safeString(pickField(dto, ['normalizedName', 'normalized_name'], '')),
      foodGroup: safeString(pickField(dto, ['foodGroup', 'food_group'], 'OTHER')),
      preparation: safeString(pickField(profile, ['preparation'], 'raw')),
      ediblePortionPercent: safeNumber(
        pickField(profile, ['ediblePortionPercent', 'edible_portion_percent'], 100),
        100
      ),
      servingGrams,
      quality: safeEnum(
        pickField(profile, ['quality'], 'REVIEWED') as string,
        {
          UNVERIFIED: 'UNVERIFIED',
          COMMUNITY: 'COMMUNITY',
          REVIEWED: 'REVIEWED',
          LAB_CERTIFIED: 'LAB_CERTIFIED',
        },
        'REVIEWED'
      ) as FoodDataQuality,
      provenance,
      householdConversions,
      energyKcal,
      macronutrients,
      vitamins,
      minerals,
      otherNutrients,
    };
  }

  toReferenceIntakeModel(dto: NutrientReferenceIntakeDto | null | undefined): ReferenceIntakeItem {
    const nutrientDto: NutrientDto | null = pickField(dto, ['nutrient'], null);
    const sourceDto = pickField(dto, ['source'], null);
    const populationCode = safeString(
      pickField(dto, ['populationCode', 'population_code'], 'GENERAL_ADULT')
    );

    return {
      id: safeString(pickField(dto, ['id'], '')),
      nutrientCode: safeString(pickField(nutrientDto, ['code'], '')).toUpperCase(),
      nutrientName: safeString(pickField(nutrientDto, ['name'], 'Dưỡng chất')),
      populationCode,
      populationName: POPULATION_LABELS[populationCode] || populationCode,
      referenceType: safeEnum(
        pickField(dto, ['referenceType', 'reference_type'], 'RDA') as string,
        {
          RDA: 'RDA',
          AI: 'AI',
          UL: 'UL',
        },
        'RDA'
      ) as NutrientReferenceType,
      value: safeNumber(pickField(dto, ['value'], 0), 0),
      unit: safeString(
        pickField(dto, ['unit'], pickField(nutrientDto, ['defaultUnit', 'default_unit'], 'g'))
      ),
      warningEligible: safeBoolean(pickField(dto, ['warningEligible', 'warning_eligible'], false)),
      sourceName: safeString(pickField(sourceDto, ['name'], 'Nguồn chuẩn')),
    };
  }

  toReferenceIntakeList(
    dtos: (NutrientReferenceIntakeDto | null | undefined)[] | null | undefined
  ): ReferenceIntakeItem[] {
    return safeArray<NutrientReferenceIntakeDto | null | undefined, ReferenceIntakeItem>(
      dtos,
      (item) => this.toReferenceIntakeModel(item)
    );
  }

  toGuidelineModel(dto: IngredientIntakeGuidelineDto | null | undefined): IngredientGuidelineItem {
    const ingredient = pickField(dto, ['ingredient'], null);
    const source = pickField(dto, ['source'], null);
    const severity = safeEnum(
      pickField(dto, ['severity'], 'NOTICE') as string,
      {
        WARNING: 'WARNING',
        NOTICE: 'NOTICE',
        COMPATIBLE: 'COMPATIBLE',
      },
      'NOTICE'
    ) as FoodRuleSeverity;

    const period = safeEnum(
      pickField(dto, ['period'], 'DAY') as string,
      {
        DAY: 'DAY',
        WEEK: 'WEEK',
        MONTH: 'MONTH',
      },
      'DAY'
    ) as GuidelinePeriod;

    const periodLabels: Record<GuidelinePeriod, string> = {
      DAY: 'mỗi ngày',
      WEEK: 'mỗi tuần',
      MONTH: 'mỗi tháng',
    };

    return {
      id: safeString(pickField(dto, ['id'], '')),
      ingredientId: safeString(pickField(dto, ['ingredientId', 'ingredient_id'], '')),
      ingredientName: safeString(
        pickField(ingredient, ['canonicalName', 'canonical_name'], 'Nguyên liệu')
      ),
      populationCode: safeString(
        pickField(dto, ['populationCode', 'population_code'], 'GENERAL_ADULT')
      ),
      amount: safeNumber(pickField(dto, ['amount'], 0), 0),
      unit: safeString(pickField(dto, ['unit'], 'g')),
      frequency: safeNumber(pickField(dto, ['frequency'], 1), 1),
      period,
      periodLabel: periodLabels[period] || 'mỗi ngày',
      advisoryOnly: safeBoolean(pickField(dto, ['advisoryOnly', 'advisory_only'], true)),
      evidenceGrade: safeEnum(
        pickField(dto, ['evidenceGrade', 'evidence_grade'], 'MODERATE') as string,
        {
          STRONG: 'STRONG',
          MODERATE: 'MODERATE',
          PRELIMINARY: 'PRELIMINARY',
          INSUFFICIENT: 'INSUFFICIENT',
        },
        'MODERATE'
      ) as EvidenceGrade,
      severity,
      severityLabel: SEVERITY_LABELS[severity] || 'Lưu ý',
      explanation: safeString(pickField(dto, ['explanation'], '')),
      sourceName: safeString(pickField(source, ['name'], 'Tài liệu tham chiếu')),
    };
  }

  toGuidelineList(
    dtos: (IngredientIntakeGuidelineDto | null | undefined)[] | null | undefined
  ): IngredientGuidelineItem[] {
    return safeArray<IngredientIntakeGuidelineDto | null | undefined, IngredientGuidelineItem>(
      dtos,
      (item) => this.toGuidelineModel(item)
    );
  }

  toCookingMethodModel(dto: CookingMethodDto | null | undefined): CookingMethodItem {
    const rawRetention = safeArray<RetentionFactorDto | null>(
      pickField(dto, ['retentionFactors', 'retention_factors'], null)
    ).filter((r): r is RetentionFactorDto => r !== null);

    const retentionFactors: RetentionFactorItem[] = rawRetention.map((r) => {
      const nutrientDto: NutrientDto | null = pickField(r, ['nutrient'], null);
      const factor = safeNumber(pickField(r, ['factor'], 1), 1);
      return {
        nutrientCode: safeString(pickField(nutrientDto, ['code'], '')).toUpperCase(),
        nutrientName: safeString(pickField(nutrientDto, ['name'], 'Dưỡng chất')),
        factor,
        retentionPercent: Math.round(factor * 100),
      };
    });

    const rawYield = safeArray<YieldFactorDto | null>(
      pickField(dto, ['yieldFactors', 'yield_factors'], null)
    ).filter((y): y is YieldFactorDto => y !== null);

    const yieldFactors: YieldFactorItem[] = rawYield.map((y) => {
      const factor = safeNumber(pickField(y, ['factor'], 1), 1);
      return {
        ingredientId: pickField(y, ['ingredientId', 'ingredient_id'], null),
        factor,
        yieldPercent: Math.round(factor * 100),
      };
    });

    return {
      id: safeString(pickField(dto, ['id'], '')),
      code: safeString(pickField(dto, ['code'], '')).toUpperCase(),
      name: safeString(pickField(dto, ['name'], 'Phương pháp nấu')),
      description: pickField(dto, ['description'], null),
      active: safeBoolean(pickField(dto, ['active'], true)),
      retentionFactors,
      yieldFactors,
    };
  }

  toCookingMethodList(
    dtos: (CookingMethodDto | null | undefined)[] | null | undefined
  ): CookingMethodItem[] {
    return safeArray<CookingMethodDto | null | undefined, CookingMethodItem>(dtos, (item) =>
      this.toCookingMethodModel(item)
    );
  }

  toInteractionRuleModel(
    dto: IngredientInteractionRuleDto | null | undefined
  ): FoodInteractionRuleItem {
    const ingredientA = pickField(dto, ['ingredientA', 'ingredient_a'], null);
    const ingredientB = pickField(dto, ['ingredientB', 'ingredient_b'], null);
    const source = pickField(dto, ['source'], null);

    const scope = safeEnum(
      pickField(dto, ['scope'], 'SAME_DISH') as string,
      {
        SAME_DISH: 'SAME_DISH',
        SAME_MEAL: 'SAME_MEAL',
        SAME_DAY: 'SAME_DAY',
      },
      'SAME_DISH'
    ) as InteractionScope;

    const severity = safeEnum(
      pickField(dto, ['severity'], 'NOTICE') as string,
      {
        WARNING: 'WARNING',
        NOTICE: 'NOTICE',
        COMPATIBLE: 'COMPATIBLE',
      },
      'NOTICE'
    ) as FoodRuleSeverity;

    const direction = safeEnum(
      pickField(dto, ['direction'], 'BIDIRECTIONAL') as string,
      {
        BIDIRECTIONAL: 'BIDIRECTIONAL',
        A_AFFECTS_B: 'A_AFFECTS_B',
        B_AFFECTS_A: 'B_AFFECTS_A',
      },
      'BIDIRECTIONAL'
    ) as InteractionDirection;

    const evidenceGrade = safeEnum(
      pickField(dto, ['evidenceGrade', 'evidence_grade'], 'MODERATE') as string,
      {
        STRONG: 'STRONG',
        MODERATE: 'MODERATE',
        PRELIMINARY: 'PRELIMINARY',
        INSUFFICIENT: 'INSUFFICIENT',
      },
      'MODERATE'
    ) as EvidenceGrade;

    return {
      id: safeString(pickField(dto, ['id'], '')),
      ingredientA: {
        id: safeString(pickField(dto, ['ingredientAId', 'ingredient_a_id'], '')),
        name: safeString(
          pickField(ingredientA, ['canonicalName', 'canonical_name'], 'Nguyên liệu A')
        ),
      },
      ingredientB: {
        id: safeString(pickField(dto, ['ingredientBId', 'ingredient_b_id'], '')),
        name: safeString(
          pickField(ingredientB, ['canonicalName', 'canonical_name'], 'Nguyên liệu B')
        ),
      },
      scope,
      scopeLabel: SCOPE_LABELS[scope] || 'Cùng món',
      direction,
      severity,
      severityLabel: SEVERITY_LABELS[severity] || 'Lưu ý',
      evidenceGrade,
      explanation: safeString(pickField(dto, ['explanation'], '')),
      suggestedAction: pickField(dto, ['suggestedAction', 'suggested_action'], null),
      isHardRule: safeBoolean(pickField(dto, ['hardRule', 'hard_rule'], false)),
      sourceName: safeString(pickField(source, ['name'], 'Tài liệu khoa học')),
    };
  }

  toInteractionRuleList(
    dtos: (IngredientInteractionRuleDto | null | undefined)[] | null | undefined
  ): FoodInteractionRuleItem[] {
    return safeArray<IngredientInteractionRuleDto | null | undefined, FoodInteractionRuleItem>(
      dtos,
      (item) => this.toInteractionRuleModel(item)
    );
  }

  toAdminRecordModel(dto: AdminFoodDataRecordDto | null | undefined): AdminRecordItem {
    const kind = safeEnum(
      pickField(dto, ['kind'], 'NUTRIENT') as string,
      {
        SOURCE: 'SOURCE',
        NUTRIENT: 'NUTRIENT',
        INGREDIENT_PROFILE: 'INGREDIENT_PROFILE',
        HOUSEHOLD_CONVERSION: 'HOUSEHOLD_CONVERSION',
        NUTRIENT_VALUE: 'NUTRIENT_VALUE',
        REFERENCE_INTAKE: 'REFERENCE_INTAKE',
        INGREDIENT_GUIDELINE: 'INGREDIENT_GUIDELINE',
        COOKING_METHOD: 'COOKING_METHOD',
        RETENTION_FACTOR: 'RETENTION_FACTOR',
        YIELD_FACTOR: 'YIELD_FACTOR',
        INTERACTION_RULE: 'INTERACTION_RULE',
        AI_SUGGESTION: 'AI_SUGGESTION',
      },
      'NUTRIENT'
    ) as FoodDataRecordKind;

    const codeOrId = safeString(pickField(dto, ['code', 'id'], ''));
    const displayName = safeString(
      pickField(dto, ['name', 'canonicalName', 'canonical_name', 'code', 'id'], 'Bản ghi không tên')
    );

    return {
      id: safeString(pickField(dto, ['id'], '')),
      kind,
      displayName,
      codeOrId,
      status: safeString(pickField(dto, ['status', 'reviewStatus', 'review_status'], 'ACTIVE')),
      effectiveFrom: safeString(pickField(dto, ['effectiveFrom', 'effective_from'], '')),
      updatedAt: safeString(pickField(dto, ['updatedAt', 'updated_at'], '')),
      rawDetails: pickField(dto, ['data'], {}) || {},
    };
  }

  toAdminRecordList(
    dtos: (AdminFoodDataRecordDto | null | undefined)[] | null | undefined
  ): AdminRecordItem[] {
    return safeArray<AdminFoodDataRecordDto | null | undefined, AdminRecordItem>(dtos, (item) =>
      this.toAdminRecordModel(item)
    );
  }

  toImportPreviewResult(
    dto: FoodDataImportResultDto | null | undefined
  ): FoodDataImportPreviewResult {
    const summary = pickField(dto, ['summary'], null);
    return {
      importId: safeString(pickField(dto, ['importId'], '')),
      status: safeString(pickField(dto, ['status'], 'PREVIEWED')) as 'PREVIEWED' | 'COMMITTED',
      idempotentReplay: safeBoolean(
        pickField(dto, ['idempotentReplay', 'idempotent_replay'], false)
      ),
      summary: {
        totalRecords: safeNumber(pickField(summary, ['totalRecords'], 0), 0),
        validRecords: safeNumber(pickField(summary, ['validRecords'], 0), 0),
        errorCount: safeNumber(pickField(summary, ['errorCount'], 0), 0),
        newIngredientsCount: safeNumber(pickField(summary, ['newIngredientsCount'], 0), 0),
        mappedNutrientsCount: safeNumber(pickField(summary, ['mappedNutrientsCount'], 0), 0),
        committedIngredients: pickField(summary, ['committedIngredients'], undefined),
        committedNutrientValues: pickField(summary, ['committedNutrientValues'], undefined),
        errors: safeArray(pickField(summary, ['errors'], []), (err) => ({
          line: safeNumber(pickField(err, ['line'], 1), 1),
          message: safeString(pickField(err, ['message'], 'Lỗi dữ liệu')),
          path: pickField(err, ['path'], undefined),
        })),
      },
    };
  }
}

export const foodDataMapper = new FoodDataMapper();
