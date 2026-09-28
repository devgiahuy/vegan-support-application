import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type {
  AffectedPlanItemDto,
  AnalysisSummaryDto,
  MealPlanAnalysisResponseDto,
  MealWarningDto,
  SwapSuggestionDto,
} from '../types/meal-analysis.dto';
import type {
  AffectedPlanItem,
  AnalysisSummary,
  DishSourceType,
  EvidenceGrade,
  MealPlanAnalysis,
  MealWarning,
  MealWarningScope,
  MealWarningSeverity,
  SwapSuggestion,
} from '../types/meal-analysis.model';

export const EVIDENCE_GRADE_LABELS: Record<EvidenceGrade, string> = {
  GRADE_A: 'Bằng chứng Cấp A (Rất cao)',
  GRADE_B: 'Bằng chứng Cấp B (Tin cậy)',
  GRADE_C: 'Bằng chứng Cấp C (Tham khảo)',
  GRADE_D: 'Bằng chứng Cấp D (Sơ bộ)',
};

function formatAnalysisDate(dateString: string): string {
  if (!dateString) return 'Chưa có thông tin';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export class MealAnalysisMapper extends BaseMapper<MealPlanAnalysisResponseDto, MealPlanAnalysis> {
  public mapAffectedItem(dto: AffectedPlanItemDto): AffectedPlanItem {
    const planItemId = safeString(
      pickField(dto, ['planItemId', 'plan_item_id', 'itemId', 'item_id'], ''),
      ''
    );
    const dishId = safeString(pickField(dto, ['dishId', 'dish_id', 'itemId', 'item_id'], ''), '');
    const rawDishType = safeString(
      pickField(dto, ['dishType', 'dish_type', 'sourceType', 'source_type'], 'RECIPE'),
      'RECIPE'
    ).toUpperCase();
    const dishType: DishSourceType = rawDishType === 'CUSTOM_MEAL' ? 'CUSTOM_MEAL' : 'RECIPE';
    const dishName = safeString(
      pickField(dto, ['dishName', 'dish_name', 'name'], 'Món ăn không tên'),
      'Món ăn không tên'
    );
    const ingredientId =
      safeString(pickField(dto, ['ingredientId', 'ingredient_id'], ''), '') || null;
    const ingredientName =
      safeString(pickField(dto, ['ingredientName', 'ingredient_name'], ''), '') || null;
    const amountVal = pickField(dto, ['amount'], null);
    const amount = amountVal !== null && amountVal !== undefined ? safeNumber(amountVal, 0) : null;
    const unit = safeString(pickField(dto, ['unit'], ''), '') || null;

    return {
      planItemId,
      dishId,
      dishType,
      dishName,
      ingredientId,
      ingredientName,
      amount,
      unit,
    };
  }

  public mapSwapSuggestion(dto: SwapSuggestionDto): SwapSuggestion {
    const suggestedDishId = safeString(
      pickField(dto, ['suggestedDishId', 'suggested_dish_id'], ''),
      ''
    );
    const rawDishType = safeString(
      pickField(dto, ['dishType', 'dish_type'], 'RECIPE'),
      'RECIPE'
    ).toUpperCase();
    const dishType: DishSourceType = rawDishType === 'CUSTOM_MEAL' ? 'CUSTOM_MEAL' : 'RECIPE';
    const dishName = safeString(
      pickField(dto, ['dishName', 'dish_name'], 'Món đề xuất'),
      'Món đề xuất'
    );
    const coverImageUrl =
      safeString(pickField(dto, ['coverImageUrl', 'cover_image_url'], ''), '') || null;
    const calories = safeNumber(pickField(dto, ['calories'], 0), 0);
    const matchReason = safeString(
      pickField(
        dto,
        ['matchReason', 'match_reason'],
        'Phù hợp tiêu chí dinh dưỡng và không gây xung đột'
      ),
      'Phù hợp tiêu chí dinh dưỡng và không gây xung đột'
    );
    const rawCodes = safeArray(
      pickField(dto, ['resolvesWarningCodes', 'resolves_warning_codes'], [])
    );
    const resolvesWarningCodes = rawCodes.map((c) => safeString(c, '')).filter(Boolean);

    return {
      suggestedDishId,
      dishType,
      dishName,
      coverImageUrl,
      calories,
      matchReason,
      resolvesWarningCodes,
    };
  }

  public mapWarning(dto: MealWarningDto): MealWarning {
    const id = safeString(dto.id, `warn-${Math.random().toString(36).slice(2, 9)}`);
    const code = safeString(dto.code, 'GENERAL_WARNING');

    let title = safeString(dto.title, '');
    if (!title) {
      if (code === 'NUTRIENT_LIMIT_EXCEEDED') {
        title = 'Vượt ngưỡng khuyến nghị trong ngày';
      } else if (code === 'INGREDIENT_GUIDELINE_EXCEEDED') {
        title = 'Vượt khuyến nghị tiêu thụ nguyên liệu';
      } else if (code === 'INGREDIENT_INTERACTION') {
        title = 'Tương tác thành phần thực phẩm';
      } else if (code === 'PORTION_MULTIPLIER_HIGH') {
        title = 'Khẩu phần món ăn vượt mức thông thường';
      } else {
        title = 'Lưu ý dinh dưỡng';
      }
    }

    const rawSeverity = safeString(dto.severity, 'WARNING').toUpperCase();
    const severity: MealWarningSeverity =
      rawSeverity === 'DANGER' || rawSeverity === 'HIGH' ? 'DANGER' : 'WARNING';

    const rawScope = safeString(dto.scope, 'SAME_MEAL').toUpperCase();
    const scope: MealWarningScope =
      rawScope === 'SAME_DISH' ? 'SAME_DISH' : rawScope === 'SAME_DAY' ? 'SAME_DAY' : 'SAME_MEAL';

    const targetDate = safeString(pickField(dto, ['targetDate', 'target_date'], ''), '');
    const mealType = safeString(pickField(dto, ['mealType', 'meal_type'], ''), '') || null;

    const rawGrade = safeString(
      pickField(dto, ['evidenceGrade', 'evidence_grade'], 'GRADE_B'),
      'GRADE_B'
    ).toUpperCase();
    const evidenceGrade: EvidenceGrade =
      rawGrade === 'GRADE_A' ||
      rawGrade === 'GRADE_B' ||
      rawGrade === 'GRADE_C' ||
      rawGrade === 'GRADE_D'
        ? rawGrade
        : 'GRADE_B';
    const evidenceGradeLabel = EVIDENCE_GRADE_LABELS[evidenceGrade];

    let evidenceSource = safeString(pickField(dto, ['evidenceSource', 'evidence_source'], ''), '');
    if (!evidenceSource && dto.source && typeof dto.source === 'object') {
      evidenceSource = safeString(dto.source.name || dto.source.code, '');
    }
    if (!evidenceSource) {
      evidenceSource = 'Khuyến nghị Dinh dưỡng Chuẩn hóa';
    }

    const ruleVersion = safeString(
      pickField(dto, ['ruleVersion', 'rule_version'], dto.source?.version || '1.0'),
      '1.0'
    );
    const confidenceVal = pickField(dto, ['confidence'], null);
    const confidence =
      confidenceVal !== null && confidenceVal !== undefined ? safeNumber(confidenceVal, 0.9) : 0.9;

    let measuredValue: number | null = null;
    let limitValue: number | null = null;
    let unit: string | null = safeString(pickField(dto, ['unit'], ''), '') || null;

    if (dto.measured && typeof dto.measured === 'object') {
      measuredValue = safeNumber(dto.measured.value, 0);
      if (!unit && dto.measured.unit) unit = safeString(dto.measured.unit, '');
    } else {
      const measuredVal = pickField(dto, ['measuredValue', 'measured_value'], null);
      if (measuredVal !== null && measuredVal !== undefined) {
        measuredValue = safeNumber(measuredVal, 0);
      }
    }

    if (dto.limit && typeof dto.limit === 'object') {
      limitValue = safeNumber(dto.limit.value, 0);
      if (!unit && dto.limit.unit) unit = safeString(dto.limit.unit, '');
    } else {
      const limitVal = pickField(dto, ['limitValue', 'limit_value'], null);
      if (limitVal !== null && limitVal !== undefined) {
        limitValue = safeNumber(limitVal, 0);
      }
    }

    const excessVal = pickField(dto, ['excessPercent', 'excess_percent'], null);
    let excessPercent =
      excessVal !== null && excessVal !== undefined ? safeNumber(excessVal, 0) : null;
    if (excessPercent === null && measuredValue !== null && limitValue !== null && limitValue > 0) {
      if (measuredValue > limitValue) {
        excessPercent = Math.round(((measuredValue - limitValue) / limitValue) * 100);
      }
    }

    const explanation = safeString(
      dto.explanation,
      'Cần lưu ý định lượng và kết hợp món ăn để bảo đảm cân bằng dinh dưỡng.'
    );
    const suggestedAdjustment =
      safeString(pickField(dto, ['suggestedAdjustment', 'suggested_adjustment'], ''), '') || null;

    const rawAffected = safeArray(pickField(dto, ['affectedItems', 'affected_items'], []));
    const affectedItems = rawAffected.map((item) =>
      this.mapAffectedItem(item as AffectedPlanItemDto)
    );

    const rawSwaps = safeArray(pickField(dto, ['suggestedSwaps', 'suggested_swaps'], []));
    const suggestedSwaps = rawSwaps.map((swap) =>
      this.mapSwapSuggestion(swap as SwapSuggestionDto)
    );

    return {
      id,
      code,
      title,
      severity,
      scope,
      targetDate,
      mealType,
      evidenceGrade,
      evidenceGradeLabel,
      evidenceSource,
      ruleVersion,
      confidence,
      measuredValue,
      limitValue,
      unit,
      excessPercent,
      explanation,
      suggestedAdjustment,
      affectedItems,
      suggestedSwaps,
    };
  }

  public mapSummary(
    dto: AnalysisSummaryDto | null | undefined,
    warnings: MealWarning[]
  ): AnalysisSummary {
    const dangerCount =
      dto &&
      pickField(dto, ['dangerCount', 'danger_count', 'highCount', 'high_count'], null) !== null
        ? safeNumber(
            pickField(dto, ['dangerCount', 'danger_count', 'highCount', 'high_count'], 0),
            0
          )
        : warnings.filter((w) => w.severity === 'DANGER').length;

    const warningCount =
      dto &&
      pickField(dto, ['warningCount', 'warning_count', 'cautionCount', 'caution_count'], null) !==
        null
        ? safeNumber(
            pickField(dto, ['warningCount', 'warning_count', 'cautionCount', 'caution_count'], 0),
            0
          )
        : warnings.filter((w) => w.severity === 'WARNING').length;

    const totalWarnings =
      dto && pickField(dto, ['totalWarnings', 'total_warnings'], null) !== null
        ? safeNumber(pickField(dto, ['totalWarnings', 'total_warnings'], 0), 0)
        : warnings.length;

    const dailyLimitViolations =
      dto && pickField(dto, ['dailyLimitViolations', 'daily_limit_violations'], null) !== null
        ? safeNumber(pickField(dto, ['dailyLimitViolations', 'daily_limit_violations'], 0), 0)
        : warnings.filter((w) => w.limitValue !== null && w.limitValue !== undefined).length;

    const compatibilityViolations =
      dto && pickField(dto, ['compatibilityViolations', 'compatibility_violations'], null) !== null
        ? safeNumber(pickField(dto, ['compatibilityViolations', 'compatibility_violations'], 0), 0)
        : warnings.filter((w) => w.scope === 'SAME_DISH' || w.scope === 'SAME_MEAL').length;

    const sameDishCount =
      dto && pickField(dto, ['sameDishCount', 'same_dish_count'], null) !== null
        ? safeNumber(pickField(dto, ['sameDishCount', 'same_dish_count'], 0), 0)
        : warnings.filter((w) => w.scope === 'SAME_DISH').length;

    const sameMealCount =
      dto && pickField(dto, ['sameMealCount', 'same_meal_count'], null) !== null
        ? safeNumber(pickField(dto, ['sameMealCount', 'same_meal_count'], 0), 0)
        : warnings.filter((w) => w.scope === 'SAME_MEAL').length;

    const sameDayCount =
      dto && pickField(dto, ['sameDayCount', 'same_day_count'], null) !== null
        ? safeNumber(pickField(dto, ['sameDayCount', 'same_day_count'], 0), 0)
        : warnings.filter((w) => w.scope === 'SAME_DAY').length;

    return {
      totalWarnings,
      dangerCount,
      warningCount,
      dailyLimitViolations,
      compatibilityViolations,
      sameDishCount,
      sameMealCount,
      sameDayCount,
    };
  }

  public toModel(
    dto: MealPlanAnalysisResponseDto | { data?: MealPlanAnalysisResponseDto } | null | undefined,
    currentPlanLockVersion?: number
  ): MealPlanAnalysis {
    const source =
      dto && typeof dto === 'object' && 'data' in dto && dto.data
        ? (dto.data as MealPlanAnalysisResponseDto)
        : (dto as MealPlanAnalysisResponseDto | null | undefined);

    const id = safeString(source?.id, '');
    const mealPlanId = safeString(pickField(source, ['mealPlanId', 'meal_plan_id'], ''), '');
    const planLockVersion = safeNumber(
      pickField(source, ['planLockVersion', 'plan_lock_version', 'planVersion', 'plan_version'], 1),
      1
    );
    const analysisVersion = safeNumber(
      pickField(source, ['analysisVersion', 'analysis_version', 'version'], 1),
      1
    );
    const analyzedAt = safeString(
      pickField(
        source,
        ['analyzedAt', 'analyzed_at', 'createdAt', 'created_at'],
        new Date().toISOString()
      ),
      new Date().toISOString()
    );
    const formattedAnalyzedAt = formatAnalysisDate(analyzedAt);

    const isStale =
      source?.status === 'STALE' ||
      (currentPlanLockVersion !== undefined && currentPlanLockVersion !== null
        ? currentPlanLockVersion !== planLockVersion
        : false);

    const confVal = pickField(
      source,
      ['overallConfidence', 'overall_confidence', 'confidence'],
      null
    );
    const overallConfidence =
      confVal !== null && confVal !== undefined ? safeNumber(confVal, 0.9) : 0.9;

    const incompleteList = safeArray<string>(
      pickField(source, ['incompleteData', 'incomplete_data'], [])
    );
    const hasIncompleteData =
      incompleteList.length > 0 ||
      safeBoolean(pickField(source, ['hasIncompleteData', 'has_incomplete_data'], false), false);

    const notesVal = pickField(source, ['incompleteDataNotes', 'incomplete_data_notes'], '');
    const incompleteDataNotes = Array.isArray(notesVal)
      ? notesVal.join('; ')
      : safeString(notesVal || (incompleteList.length > 0 ? incompleteList.join('; ') : ''), '') ||
        null;

    const rawWarnings = safeArray(source?.warnings);
    const warnings = rawWarnings.map((w) => this.mapWarning(w as MealWarningDto));

    const summary = this.mapSummary(source?.summary, warnings);

    return {
      id,
      mealPlanId,
      planLockVersion,
      analysisVersion,
      analyzedAt,
      formattedAnalyzedAt,
      isStale,
      overallConfidence,
      hasIncompleteData,
      incompleteDataNotes,
      summary,
      warnings,
    };
  }
}

export const mealAnalysisMapper = new MealAnalysisMapper();
