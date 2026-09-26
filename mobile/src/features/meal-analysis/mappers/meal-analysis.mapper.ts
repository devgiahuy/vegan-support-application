import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type { MealAnalysisDto, MealAnalysisRequestDto, MealAnalysisResponseDto, MealWarningDto } from '../types/meal-analysis.dto';
import type {
  MealAnalysis,
  MealAnalysisStatus,
  MealAnalysisSummary,
  MealAnalysisWarning,
  MealWarningScope,
  MealWarningSeverity,
} from '../types/meal-analysis.model';

const SEVERITY_LABELS: Record<MealWarningSeverity, string> = {
  INFO: 'Thông tin',
  CAUTION: 'Cần chú ý',
  HIGH: 'Nguy cơ cao',
};

const SCOPE_LABELS: Record<MealWarningScope, string> = {
  DISH: 'Trong món',
  MEAL: 'Trong bữa',
  DAILY: 'Trong ngày',
};

function normalizeSeverity(value: unknown): MealWarningSeverity {
  const normalized = safeString(value, 'INFO').toUpperCase();
  if (normalized === 'HIGH' || normalized === 'DANGER') return 'HIGH';
  if (normalized === 'CAUTION' || normalized === 'WARNING') return 'CAUTION';
  return 'INFO';
}

function normalizeScope(value: unknown): MealWarningScope {
  const normalized = safeString(value, 'DAILY').toUpperCase();
  if (normalized === 'DISH' || normalized === 'SAME_DISH') return 'DISH';
  if (normalized === 'MEAL' || normalized === 'SAME_MEAL') return 'MEAL';
  return 'DAILY';
}

function formatDateTime(date: Date | null): string {
  if (!date) return 'Chưa có thời gian phân tích';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}/${date.getFullYear()}`;
}

export class MealAnalysisMapper extends BaseMapper<MealAnalysisDto, MealAnalysis> {
  toModel(dto: MealAnalysisDto | null | undefined): MealAnalysis {
    const statusRaw = safeString(pickField(dto, ['status'], 'CURRENT')).toUpperCase();
    const status: MealAnalysisStatus = statusRaw === 'STALE' ? 'STALE' : 'CURRENT';
    const warnings = this.toWarnings(pickField(dto, ['warnings'], null));
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at', 'analyzedAt', 'analyzed_at'], null));
    const confidence = safeNumber(pickField(dto, ['confidence', 'overallConfidence', 'overall_confidence'], 0), 0);

    return {
      id: safeString(pickField(dto, ['id'], '')),
      mealPlanId: safeString(pickField(dto, ['mealPlanId', 'meal_plan_id'], '')),
      version: safeNumber(pickField(dto, ['version', 'analysisVersion', 'analysis_version'], 1)),
      status,
      isStale: status === 'STALE',
      algorithmVersion: safeString(pickField(dto, ['algorithmVersion', 'algorithm_version'], '')),
      planVersion: safeNumber(pickField(dto, ['planVersion', 'plan_version', 'planLockVersion', 'plan_lock_version'], 0)),
      analyzedItemIds: safeArray<string | null, string>(
        pickField(dto, ['analyzedItemIds', 'analyzed_item_ids'], null),
        (item) => safeString(item)
      ).filter((item) => item.length > 0),
      warnings,
      summary: this.toSummary(pickField(dto, ['summary'], null), warnings),
      confidence,
      confidencePercent: Math.round(confidence * 100),
      incompleteData: safeArray<string | null, string>(
        pickField(dto, ['incompleteData', 'incomplete_data'], null),
        (item) => safeString(item)
      ).filter((item) => item.length > 0),
      ruleVersions: safeArray<string | null, string>(
        pickField(dto, ['ruleVersions', 'rule_versions'], null),
        (item) => safeString(item)
      ).filter((item) => item.length > 0),
      disclaimer: safeString(
        pickField(
          dto,
          ['disclaimer', 'incompleteDataNotes', 'incomplete_data_notes'],
          'Kết quả chỉ hỗ trợ tham khảo dinh dưỡng, không thay thế tư vấn y tế.'
        )
      ),
      createdAt,
      formattedCreatedAt: formatDateTime(createdAt),
    };
  }

  toResponseModel(dto: MealAnalysisResponseDto | null | undefined): MealAnalysis {
    return this.toModel(pickField(dto, ['data'], null) as MealAnalysisDto | null);
  }

  toAnalyzeDto(expectedPlanVersion: number): MealAnalysisRequestDto {
    return { expectedPlanVersion };
  }

  private toWarnings(value: unknown): MealAnalysisWarning[] {
    return safeArray<MealWarningDto, MealAnalysisWarning>(value, (warning, index) => {
      const severity = normalizeSeverity(pickField(warning, ['severity'], 'INFO'));
      const scope = normalizeScope(pickField(warning, ['scope'], 'DAILY'));
      const measuredRaw = pickField(warning, ['measured', 'measuredValue', 'measured_value'], null);
      const limitRaw = pickField(warning, ['limit', 'limitValue', 'limit_value'], null);

      return {
        id: safeString(pickField(warning, ['id'], `warning-${index}`)),
        code: safeString(pickField(warning, ['code'], 'MEAL_ANALYSIS_WARNING')),
        title: safeString(pickField(warning, ['title'], 'Lưu ý dinh dưỡng')),
        severity,
        severityLabel: SEVERITY_LABELS[severity],
        scope,
        scopeLabel: SCOPE_LABELS[scope],
        targetDate: safeString(pickField(warning, ['targetDate', 'target_date'], '')),
        mealType: safeString(pickField(warning, ['mealType', 'meal_type'], '')) || null,
        evidenceGrade: safeString(pickField(warning, ['evidenceGrade', 'evidence_grade'], '')),
        evidenceSource: safeString(pickField(warning, ['evidenceSource', 'evidence_source', 'source'], '')),
        confidence: safeNumber(pickField(warning, ['confidence'], 0), 0),
        measuredValue: measuredRaw === null ? null : safeNumber(measuredRaw, 0),
        limitValue: limitRaw === null ? null : safeNumber(limitRaw, 0),
        unit: safeString(pickField(warning, ['unit'], '')) || null,
        explanation: safeString(pickField(warning, ['explanation', 'advisory'], 'Cần xem lại khẩu phần hoặc cách kết hợp món.')),
        suggestedAdjustment: safeString(pickField(warning, ['suggestedAdjustment', 'suggested_adjustment'], '')) || null,
        affectedItemNames: this.toAffectedItemNames(warning),
        affectedIngredients: safeArray<string | null, string>(
          pickField(warning, ['affectedIngredients', 'affected_ingredients'], null),
          (item) => safeString(item)
        ).filter((item) => item.length > 0),
      };
    });
  }

  private toAffectedItemNames(warning: MealWarningDto): string[] {
    const items = safeArray<
      { planItemId?: string; itemId?: string; dishName?: string; dish_name?: string },
      string
    >(pickField(warning, ['affectedItems', 'affected_items'], null), (item) =>
      safeString(pickField(item, ['dishName', 'dish_name', 'planItemId', 'itemId'], ''))
    );

    return items.filter((item) => item.length > 0);
  }

  private toSummary(value: unknown, warnings: MealAnalysisWarning[]): MealAnalysisSummary {
    const highCountFallback = warnings.filter((warning) => warning.severity === 'HIGH').length;
    const cautionCountFallback = warnings.filter((warning) => warning.severity === 'CAUTION').length;
    const infoCountFallback = warnings.filter((warning) => warning.severity === 'INFO').length;

    return {
      warningCount: safeNumber(pickField(value, ['warningCount', 'warning_count', 'totalWarnings', 'total_warnings'], warnings.length)),
      highCount: safeNumber(pickField(value, ['highCount', 'high_count', 'dangerCount', 'danger_count'], highCountFallback)),
      cautionCount: safeNumber(pickField(value, ['cautionCount', 'caution_count'], cautionCountFallback)),
      infoCount: safeNumber(pickField(value, ['infoCount', 'info_count'], infoCountFallback)),
      selectedItemCount: safeNumber(pickField(value, ['selectedItemCount', 'selected_item_count'], 0)),
    };
  }
}

export const mealAnalysisMapper = new MealAnalysisMapper();
