import { MealType } from '@/common/enums';
import { BaseMapper, pickField, safeArray, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type {
  MealAnalysisDto,
  MealAnalysisRequestDto,
  MealAnalysisResponseDto,
  MealWarningAffectedItemDto,
  MealWarningDto,
} from '../types/meal-analysis.dto';
import type {
  MealAnalysis,
  MealAnalysisStatus,
  MealAnalysisSummary,
  MealAnalysisWarning,
  MealWarningAffectedItem,
  MealWarningScope,
  MealWarningSeverity,
} from '../types/meal-analysis.model';

/** Chỉ là cảnh báo tham khảo — không dùng ngôn ngữ cấm đoán cho mức nghiêm trọng. */
const SEVERITY_LABELS: Record<MealWarningSeverity, string> = {
  INFO: 'Thông tin',
  CAUTION: 'Nên lưu ý',
  HIGH: 'Nên lưu ý',
};

const SCOPE_LABELS: Record<MealWarningScope, string> = {
  DISH: 'Trong món',
  MEAL: 'Trong bữa',
  DAILY: 'Trong ngày',
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Sáng',
  [MealType.LUNCH]: 'Trưa',
  [MealType.DINNER]: 'Tối',
};

const EVIDENCE_LABELS: Record<string, string> = {
  HIGH: 'Bằng chứng mạnh',
  GRADE_A: 'Bằng chứng mạnh',
  MODERATE: 'Bằng chứng trung bình',
  GRADE_B: 'Bằng chứng trung bình',
  LOW: 'Bằng chứng hạn chế',
  GRADE_C: 'Bằng chứng hạn chế',
  INSUFFICIENT: 'Chưa đủ bằng chứng',
  GRADE_D: 'Chưa đủ bằng chứng',
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

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDateTime(date: Date | null): string {
  if (!date) return 'Chưa có thời gian phân tích';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}/${date.getFullYear()}`;
}

function stringList(value: unknown): string[] {
  return safeArray<string | null, string>(value as (string | null)[] | null | undefined, (item) => safeString(item)).filter(
    (item) => item.length > 0
  );
}

export class MealAnalysisMapper extends BaseMapper<MealAnalysisDto, MealAnalysis> {
  toModel(dto: MealAnalysisDto | null | undefined): MealAnalysis {
    const statusRaw = safeString(pickField(dto, ['status'], 'CURRENT')).toUpperCase();
    const status: MealAnalysisStatus = statusRaw === 'STALE' ? 'STALE' : 'CURRENT';
    const warnings = this.toWarnings(pickField(dto, ['warnings'], null));
    const createdAt = safeDate(pickField(dto, ['createdAt'], null));
    const confidence = safeNumber(pickField(dto, ['confidence'], 0), 0);

    return {
      id: safeString(pickField(dto, ['id'], '')),
      mealPlanId: safeString(pickField(dto, ['mealPlanId'], '')),
      version: safeNumber(pickField(dto, ['version'], 1)),
      status,
      isStale: status === 'STALE',
      algorithmVersion: safeString(pickField(dto, ['algorithmVersion'], '')),
      planVersion: safeNumber(pickField(dto, ['planVersion'], 0)),
      analyzedItemIds: stringList(pickField(dto, ['analyzedItemIds'], null)),
      warnings,
      summary: this.toSummary(pickField(dto, ['summary'], null), warnings),
      confidence,
      confidencePercent: Math.round(confidence * 100),
      incompleteData: stringList(pickField(dto, ['incompleteData'], null)),
      ruleVersions: stringList(pickField(dto, ['ruleVersions'], null)),
      disclaimer: safeString(
        pickField(dto, ['disclaimer'], 'Kết quả chỉ hỗ trợ tham khảo dinh dưỡng, không thay thế tư vấn y tế.')
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
    return safeArray<MealWarningDto | null, MealAnalysisWarning>(
      value as (MealWarningDto | null)[] | null | undefined,
      (warning, index) => {
        const severity = normalizeSeverity(pickField(warning, ['severity'], 'INFO'));
        const scope = normalizeScope(pickField(warning, ['scope'], 'DAILY'));
        const measured = pickField(warning, ['measured'], null);
        const limit = pickField(warning, ['limit'], null);
        const source = pickField(warning, ['source'], null);
        const evidenceGrade = safeString(pickField(warning, ['evidenceGrade'], '')).toUpperCase();
        const comparison = safeString(pickField(warning, ['targetComparison'], '')).toUpperCase();
        const affectedItems = this.toAffectedItems(pickField(warning, ['affectedItems'], null));
        const detail = safeString(pickField(warning, ['detail'], ''));

        return {
          id: safeString(pickField(warning, ['id'], `warning-${index}`)),
          code: safeString(pickField(warning, ['code'], 'MEAL_ANALYSIS_WARNING')),
          title: safeString(pickField(warning, ['title'], 'Lưu ý dinh dưỡng')),
          detail,
          severity,
          severityLabel: safeString(pickField(warning, ['severityLabel'], '')) || SEVERITY_LABELS[severity],
          scope,
          scopeLabel: safeString(pickField(warning, ['scopeLabel'], '')) || SCOPE_LABELS[scope],
          targetDate: safeString(pickField(warning, ['targetDate'], '')),
          mealType: safeString(pickField(warning, ['mealType'], '')) || null,
          targetComparison: comparison === 'ABOVE' || comparison === 'BELOW' ? comparison : null,
          evidenceGrade,
          evidenceGradeLabel: EVIDENCE_LABELS[evidenceGrade] ?? '',
          evidenceSource: safeString(pickField(source, ['name'], '')),
          evidenceSourceVersion: safeString(pickField(source, ['version'], '')),
          confidence: safeNumber(pickField(warning, ['confidence'], 0), 0),
          measuredValue: nullableNumber(pickField(measured, ['value'], null)),
          limitValue: nullableNumber(pickField(limit, ['value'], null)),
          unit: safeString(pickField(measured, ['unit'], pickField(limit, ['unit'], ''))) || null,
          explanation:
            safeString(pickField(warning, ['explanation'], '')) ||
            detail ||
            'Cần xem lại khẩu phần hoặc cách kết hợp món.',
          suggestedAdjustment:
            safeString(pickField(warning, ['suggestedAdjustment'], pickField(warning, ['suggestion'], ''))) || null,
          affectedItems,
          affectedItemNames: affectedItems.map((item) => item.name).filter((name) => name.length > 0),
          affectedIngredients: safeArray<{ ingredientId?: string; name?: string } | null, string>(
            pickField(warning, ['affectedIngredients'], null),
            (item) => safeString(pickField(item, ['name'], ''))
          ).filter((name) => name.length > 0),
          incompleteDataNotes: stringList(pickField(warning, ['incompleteDataNotes'], null)),
        };
      }
    );
  }

  private toAffectedItems(value: unknown): MealWarningAffectedItem[] {
    return safeArray<MealWarningAffectedItemDto | null, MealWarningAffectedItem>(
      value as (MealWarningAffectedItemDto | null)[] | null | undefined,
      (item) => {
        const mealType = safeEnum(pickField(item, ['mealType'], 'BREAKFAST'), MealType, MealType.BREAKFAST);
        return {
          itemId: safeString(pickField(item, ['itemId'], '')),
          name: safeString(pickField(item, ['name'], '')),
          date: safeString(pickField(item, ['date'], '')),
          mealTypeLabel: MEAL_TYPE_LABELS[mealType],
          servings: nullableNumber(pickField(item, ['servings'], null)),
        };
      }
    ).filter((item) => item.itemId.length > 0 || item.name.length > 0);
  }

  private toSummary(value: unknown, warnings: MealAnalysisWarning[]): MealAnalysisSummary {
    const highCountFallback = warnings.filter((warning) => warning.severity === 'HIGH').length;
    const cautionCountFallback = warnings.filter((warning) => warning.severity === 'CAUTION').length;
    const infoCountFallback = warnings.filter((warning) => warning.severity === 'INFO').length;

    return {
      warningCount: safeNumber(pickField(value, ['warningCount'], warnings.length)),
      highCount: safeNumber(pickField(value, ['highCount'], highCountFallback)),
      cautionCount: safeNumber(pickField(value, ['cautionCount'], cautionCountFallback)),
      infoCount: safeNumber(pickField(value, ['infoCount'], infoCountFallback)),
      selectedItemCount: safeNumber(pickField(value, ['selectedItemCount'], 0)),
      statusTitle: safeString(pickField(value, ['title'], '')),
      statusDetail: safeString(pickField(value, ['detail'], '')),
      hardConstraintViolationCount: safeNumber(pickField(value, ['hardConstraintViolationCount'], 0)),
    };
  }
}

export const mealAnalysisMapper = new MealAnalysisMapper();
