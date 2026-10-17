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
  EstimatedNutritionAnalysisDto,
  MealPlanAnalysisResponseDto,
  MealWarningDto,
  SwapSuggestionDto,
} from '../types/meal-analysis.dto';
import type {
  AffectedPlanItem,
  AnalysisSummary,
  DayEstimatedNutrition,
  DishSourceType,
  EstimatedNutritionAnalysis,
  EvidenceGrade,
  MacroTargets,
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

    const detail = safeString(pickField(dto, ['detail'], ''));
    const suggestion = pickField(dto, ['suggestion'], null)
      ? safeString(pickField(dto, ['suggestion'], ''))
      : null;
    const severityLabel = safeString(
      pickField(
        dto,
        ['severityLabel', 'severity_label'],
        severity === 'DANGER' ? 'Nguy hiểm' : 'Cảnh báo'
      )
    );
    const scopeLabel = safeString(pickField(dto, ['scopeLabel', 'scope_label'], ''));
    const rawTargetComparison = pickField(dto, ['targetComparison', 'target_comparison'], null);
    const targetComparison =
      rawTargetComparison === 'ABOVE' || rawTargetComparison === 'BELOW'
        ? rawTargetComparison
        : null;

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
      detail,
      suggestion,
      severity,
      severityLabel,
      scope,
      scopeLabel,
      targetDate,
      mealType,
      targetComparison,
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

    const userStatus = safeString(
      pickField(dto, ['userStatus', 'user_status'], 'NO_SERIOUS_ISSUE')
    );
    const title = safeString(pickField(dto, ['title'], ''));
    const detail = safeString(pickField(dto, ['detail'], ''));
    const advisoryCount = safeNumber(pickField(dto, ['advisoryCount', 'advisory_count'], 0), 0);
    const hardConstraintViolationCount = safeNumber(
      pickField(dto, ['hardConstraintViolationCount', 'hard_constraint_violation_count'], 0),
      0
    );
    const hardConstraintsPreserved = Boolean(
      pickField(dto, ['hardConstraintsPreserved', 'hard_constraints_preserved'], true)
    );

    return {
      totalWarnings,
      dangerCount,
      warningCount,
      userStatus,
      title,
      detail,
      advisoryCount,
      hardConstraintViolationCount,
      hardConstraintsPreserved,
      dailyLimitViolations,
      compatibilityViolations,
      sameDishCount,
      sameMealCount,
      sameDayCount,
    };
  }

  public mapEstimatedNutrition(
    dto: EstimatedNutritionAnalysisDto | null | undefined
  ): EstimatedNutritionAnalysis | null {
    if (!dto || typeof dto !== 'object') return null;
    const rawTargets = pickField<EstimatedNutritionAnalysisDto['targets'] | null>(
      dto,
      ['targets'],
      null
    );
    const rawDays = pickField(dto, ['days'], []) as EstimatedNutritionAnalysisDto['days'];

    const targets: MacroTargets = {
      proteinGrams: safeNumber(pickField(rawTargets, ['proteinGrams', 'protein_grams'], 0), 0),
      fiberGrams: safeNumber(pickField(rawTargets, ['fiberGrams', 'fiber_grams'], 0), 0),
      fatGrams: safeNumber(pickField(rawTargets, ['fatGrams', 'fat_grams'], 0), 0),
      carbohydrateGrams: safeNumber(
        pickField(rawTargets, ['carbohydrateGrams', 'carbohydrate_grams'], 0),
        0
      ),
    };

    const days: DayEstimatedNutrition[] = safeArray(rawDays, (day) => {
      const totalsObj = pickField(day, ['totals'], null);
      const p = pickField(totalsObj, ['proteinGrams', 'protein_grams'], null);
      const fb = pickField(totalsObj, ['fiberGrams', 'fiber_grams'], null);
      const ft = pickField(totalsObj, ['fatGrams', 'fat_grams'], null);
      const c = pickField(totalsObj, ['carbohydrateGrams', 'carbohydrate_grams'], null);

      return {
        date: safeString(pickField(day, ['date'], ''), ''),
        totals: {
          proteinGrams: p !== null && p !== undefined ? safeNumber(p) : null,
          fiberGrams: fb !== null && fb !== undefined ? safeNumber(fb) : null,
          fatGrams: ft !== null && ft !== undefined ? safeNumber(ft) : null,
          carbohydrateGrams: c !== null && c !== undefined ? safeNumber(c) : null,
        },
        confidence: safeNumber(pickField(day, ['confidence'], 1), 1),
        uncertaintyNotes: safeArray<string, string>(
          pickField(day, ['uncertaintyNotes', 'uncertainty_notes'], []) as string[],
          (note) => safeString(note)
        ),
      };
    });

    return {
      estimated: Boolean(pickField(dto, ['estimated'], true)),
      targetSource: safeString(
        pickField(dto, ['targetSource', 'target_source'], 'HEALTH_PROFILE_TDEE_GOAL_CONFIG')
      ),
      targetSourceDetail: safeString(
        pickField(dto, ['targetSourceDetail', 'target_source_detail'], '')
      ),
      tolerancePercent: safeNumber(
        pickField(dto, ['tolerancePercent', 'tolerance_percent'], 15),
        15
      ),
      targets,
      days,
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

    const rawNotesVal = pickField(source, ['incompleteDataNotes', 'incomplete_data_notes'], '');
    const rawIncompleteNotes = Array.isArray(rawNotesVal)
      ? rawNotesVal.join('; ')
      : safeString(
          rawNotesVal || (incompleteList.length > 0 ? incompleteList.join('; ') : ''),
          ''
        ) || null;
    const incompleteDataNotes = rawIncompleteNotes
      ? rawIncompleteNotes
          .replace(/cooking-aware/gi, 'ước tính đa lượng')
          .replace(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
            (uuid) => `#${uuid.slice(0, 6)}`
          )
      : null;

    const rawWarnings = safeArray(source?.warnings);
    // FR-009 & US4: Loại bỏ các cảnh báo kỹ thuật về thiếu vi chất gây hoang mang
    const warnings = rawWarnings
      .filter((w) => {
        const item = w as MealWarningDto;
        const code = safeString(item?.code, '').toUpperCase();
        if (
          code === 'MICRONUTRIENT_COMPLETENESS' ||
          code === 'MICRONUTRIENT_INCOMPLETE' ||
          code === 'MICRONUTRIENT_MISSING'
        ) {
          return false;
        }
        return true;
      })
      .map((w) => this.mapWarning(w as MealWarningDto));

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
      estimatedNutrition: this.mapEstimatedNutrition(source?.estimatedNutrition),
    };
  }
}

export const mealAnalysisMapper = new MealAnalysisMapper();
