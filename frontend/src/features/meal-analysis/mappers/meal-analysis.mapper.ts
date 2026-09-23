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
    const planItemId = safeString(pickField(dto, ['planItemId', 'plan_item_id'], ''), '');
    const dishId = safeString(pickField(dto, ['dishId', 'dish_id'], ''), '');
    const rawDishType = safeString(
      pickField(dto, ['dishType', 'dish_type'], 'RECIPE'),
      'RECIPE'
    ).toUpperCase();
    const dishType: DishSourceType = rawDishType === 'CUSTOM_MEAL' ? 'CUSTOM_MEAL' : 'RECIPE';
    const dishName = safeString(
      pickField(dto, ['dishName', 'dish_name'], 'Món ăn không tên'),
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
    const title = safeString(dto.title, 'Cảnh báo dinh dưỡng');

    const rawSeverity = safeString(dto.severity, 'WARNING').toUpperCase();
    const severity: MealWarningSeverity = rawSeverity === 'DANGER' ? 'DANGER' : 'WARNING';

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

    const evidenceSource = safeString(
      pickField(dto, ['evidenceSource', 'evidence_source'], 'Khuyến nghị Dinh dưỡng Chuẩn hóa'),
      'Khuyến nghị Dinh dưỡng Chuẩn hóa'
    );
    const ruleVersion = safeString(pickField(dto, ['ruleVersion', 'rule_version'], '1.0'), '1.0');
    const confidenceVal = pickField(dto, ['confidence'], null);
    const confidence =
      confidenceVal !== null && confidenceVal !== undefined ? safeNumber(confidenceVal, 0.9) : 0.9;

    const measuredVal = pickField(dto, ['measuredValue', 'measured_value'], null);
    const measuredValue =
      measuredVal !== null && measuredVal !== undefined ? safeNumber(measuredVal, 0) : null;

    const limitVal = pickField(dto, ['limitValue', 'limit_value'], null);
    const limitValue = limitVal !== null && limitVal !== undefined ? safeNumber(limitVal, 0) : null;

    const unit = safeString(pickField(dto, ['unit'], ''), '') || null;

    const excessVal = pickField(dto, ['excessPercent', 'excess_percent'], null);
    const excessPercent =
      excessVal !== null && excessVal !== undefined ? safeNumber(excessVal, 0) : null;

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
      dto && pickField(dto, ['dangerCount', 'danger_count'], null) !== null
        ? safeNumber(pickField(dto, ['dangerCount', 'danger_count'], 0), 0)
        : warnings.filter((w) => w.severity === 'DANGER').length;

    const warningCount =
      dto && pickField(dto, ['warningCount', 'warning_count'], null) !== null
        ? safeNumber(pickField(dto, ['warningCount', 'warning_count'], 0), 0)
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
      pickField(source, ['planLockVersion', 'plan_lock_version'], 1),
      1
    );
    const analysisVersion = safeNumber(
      pickField(source, ['analysisVersion', 'analysis_version'], 1),
      1
    );
    const analyzedAt = safeString(
      pickField(source, ['analyzedAt', 'analyzed_at'], new Date().toISOString()),
      new Date().toISOString()
    );
    const formattedAnalyzedAt = formatAnalysisDate(analyzedAt);

    const isStale =
      currentPlanLockVersion !== undefined && currentPlanLockVersion !== null
        ? currentPlanLockVersion !== planLockVersion
        : false;

    const confVal = pickField(source, ['overallConfidence', 'overall_confidence'], null);
    const overallConfidence =
      confVal !== null && confVal !== undefined ? safeNumber(confVal, 0.9) : 0.9;

    const hasIncompleteData = safeBoolean(
      pickField(source, ['hasIncompleteData', 'has_incomplete_data'], false),
      false
    );
    const incompleteDataNotes =
      safeString(pickField(source, ['incompleteDataNotes', 'incomplete_data_notes'], ''), '') ||
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
