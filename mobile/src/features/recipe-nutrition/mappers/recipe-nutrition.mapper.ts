import { BaseMapper, pickField, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  NutrientValueDto,
  NutritionAssumptionDto,
  NutritionSourceVersionDto,
  RecipeNutritionEstimateDto,
  RecipeNutritionEstimateResponseDto,
  RecipeNutritionHistoryResponseDto,
  RecipeNutritionPreviewRequestDto,
  RecipeNutritionRecalculateRequestDto,
  RecipeNutritionStatusResponseDto,
  UncoveredIngredientDto,
} from '../types/recipe-nutrition.dto';
import type {
  MacroSplit,
  NutrientLine,
  NutritionAssumption,
  NutritionEstimateStatus,
  NutritionOrigin,
  RecipeNutritionEstimate,
  RecipeNutritionHistoryItem,
  RecipeNutritionHistoryResult,
  RecipeNutritionStatus,
  UncoveredIngredient,
} from '../types/recipe-nutrition.model';

const AI_JOB_LABELS: Record<string, string> = {
  IN_PROGRESS: 'AI đang ước lượng bổ sung',
  SUCCESS: 'AI đã bổ sung ước lượng',
  FALLBACK: 'Dùng dữ liệu dự phòng (không có AI)',
  BLOCKED: 'AI bị chặn bởi kiểm duyệt an toàn',
  FAILED: 'AI ước lượng thất bại',
  ABORTED: 'AI ước lượng đã dừng',
};

/** Thứ tự ưu tiên hiển thị các chỉ số chính, các vi chất khác nằm sau. */
const PRIMARY_ORDER = ['ENERGY_KCAL', 'PROTEIN', 'CARBS', 'FAT', 'FIBER'];

const ORIGINS: NutritionOrigin[] = ['CANONICAL_CALCULATED', 'AI_ESTIMATED', 'USER_PROVIDED', 'VERIFIED_OVERRIDE'];

function toOrigin(value: unknown): NutritionOrigin {
  const raw = safeString(value).toUpperCase();
  return (ORIGINS as string[]).includes(raw) ? (raw as NutritionOrigin) : 'CANONICAL_CALCULATED';
}

function toStatus(value: unknown): NutritionEstimateStatus {
  const raw = safeString(value).toUpperCase();
  return raw === 'CURRENT' || raw === 'HISTORICAL' || raw === 'STALE' ? raw : 'NONE';
}

/** Độ tin cậy backend trả 0–1 (đôi khi 0–100); chuẩn hóa về phần trăm nguyên. */
function toPercent(value: unknown): number {
  const raw = safeNumber(value, 0);
  const percent = raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  return String(rounded).replace('.', ',');
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

export class RecipeNutritionMapper extends BaseMapper<RecipeNutritionEstimateDto, RecipeNutritionEstimate> {
  toModel(dto: RecipeNutritionEstimateDto | null | undefined): RecipeNutritionEstimate {
    const nutrients = this.toNutrientLines(pickField(dto, ['perServingNutrients'], null));
    const status = toStatus(pickField(dto, ['status'], null));
    const ai = pickField(dto, ['ai'], null);
    const sources = safeArray<NutritionSourceVersionDto | null, string>(
      pickField(dto, ['sourceVersions'], null),
      (source) => {
        const code = safeString(pickField(source, ['sourceCode'], ''));
        const version = safeString(pickField(source, ['sourceVersion'], ''));
        return [code, version].filter(Boolean).join(' v');
      }
    ).filter((label) => label.length > 0);

    return {
      id: safeString(pickField(dto, ['id'], '')) || null,
      postId: safeString(pickField(dto, ['postId'], '')),
      postVersion: safeNumber(pickField(dto, ['postVersion'], 0)),
      estimateVersion: nullableNumber(pickField(dto, ['estimateVersion'], null)),
      status,
      isStale: safeBoolean(pickField(dto, ['stale'], false)) || status === 'STALE',
      isPreview: false,
      servings: Math.max(1, safeNumber(pickField(dto, ['servings'], 1), 1)),
      totalRawGrams: safeNumber(pickField(dto, ['totalRawGrams'], 0)),
      totalCookedGrams: safeNumber(pickField(dto, ['totalCookedGrams'], 0)),
      confidencePercent: toPercent(pickField(dto, ['confidence'], 0)),
      nutrients,
      macroSplit: this.toMacroSplit(nutrients),
      uncoveredIngredients: this.toUncovered(pickField(dto, ['uncoveredIngredients'], null)),
      assumptions: this.toAssumptions(pickField(dto, ['assumptions'], null)),
      sourceLabels: Array.from(new Set(sources)),
      aiUsed: safeBoolean(pickField(ai, ['used'], false)),
      aiProviderDown: safeBoolean(pickField(ai, ['providerDown'], false)),
      disclaimer: safeString(
        pickField(dto, ['disclaimer'], 'Số liệu dinh dưỡng chỉ là ước tính tham khảo, không thay thế tư vấn chuyên môn.')
      ),
      formattedCreatedAt: this.formatDate(safeDate(pickField(dto, ['createdAt'], null))),
    };
  }

  toEstimateResponse(dto: RecipeNutritionEstimateResponseDto | null | undefined): RecipeNutritionEstimate {
    return this.toModel(pickField(dto, ['data'], null));
  }

  toStatusResponse(dto: RecipeNutritionStatusResponseDto | null | undefined): RecipeNutritionStatus {
    const data = pickField(dto, ['data'], null);
    const job = pickField(data, ['latestAiJob'], null);
    const jobStatus = safeString(pickField(job, ['status'], '')).toUpperCase() || null;
    return {
      isStale: safeBoolean(pickField(data, ['stale'], false)),
      currentStatus: toStatus(pickField(data, ['currentStatus'], null)),
      aiJobStatus: jobStatus,
      aiJobStatusLabel: jobStatus ? (AI_JOB_LABELS[jobStatus] ?? null) : null,
    };
  }

  toHistoryResponse(dto: RecipeNutritionHistoryResponseDto | null | undefined): RecipeNutritionHistoryResult {
    const rawItems = safeArray<RecipeNutritionEstimateDto | null, RecipeNutritionEstimateDto | null>(
      pickField(dto, ['data'], null),
      (item) => item
    );
    const items: RecipeNutritionHistoryItem[] = rawItems.map((item) => {
      const model = this.toModel(item);
      const energy = model.nutrients.find((nutrient) => nutrient.code === 'ENERGY_KCAL');
      return {
        estimateVersion: model.estimateVersion,
        formattedDate: model.formattedCreatedAt,
        servings: model.servings,
        caloriesPerServing: energy ? energy.amount : null,
        confidencePercent: model.confidencePercent,
        isStale: model.isStale,
        aiUsed: model.aiUsed,
        status: model.status,
      };
    });
    const meta = pickField(dto, ['meta'], null);
    return {
      items,
      total: safeNumber(pickField(meta, ['total'], items.length), items.length),
      totalPages: safeNumber(pickField(meta, ['totalPages'], 1), 1),
    };
  }

  toPreviewDto(useAiFallback: boolean): RecipeNutritionPreviewRequestDto {
    return { useAiFallback };
  }

  toRecalculateDto(useAiFallback: boolean, expectedPostVersion?: number): RecipeNutritionRecalculateRequestDto {
    return { useAiFallback, ...(expectedPostVersion ? { expectedPostVersion } : {}) };
  }

  private formatDate(date: Date | null): string {
    if (!date) return 'Chưa lưu';
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  private toNutrientLines(value: unknown): NutrientLine[] {
    const lines = safeArray<NutrientValueDto | null, NutrientLine>(
      value as (NutrientValueDto | null)[] | null | undefined,
      (item) => {
        const origin = toOrigin(pickField(item, ['origin'], 'CANONICAL_CALCULATED'));
        const amount = safeNumber(pickField(item, ['amount'], 0));
        const min = nullableNumber(pickField(item, ['min'], null));
        const max = nullableNumber(pickField(item, ['max'], null));
        const rangeValid = min !== null && max !== null && min <= amount && amount <= max && min !== max;
        return {
          code: safeString(pickField(item, ['nutrientCode'], '')),
          name: safeString(pickField(item, ['nutrientName'], '')) || 'Dưỡng chất',
          unit: safeString(pickField(item, ['unit'], '')),
          amount,
          formattedAmount: formatAmount(amount),
          origin,
          isAiEstimated: origin === 'AI_ESTIMATED',
          confidencePercent: toPercent(pickField(item, ['confidence'], 0)),
          rangeLabel: rangeValid ? `${formatAmount(min as number)} – ${formatAmount(max as number)}` : null,
        };
      }
    ).filter((line) => line.code.length > 0);

    return lines.sort((a, b) => {
      const ai = PRIMARY_ORDER.indexOf(a.code);
      const bi = PRIMARY_ORDER.indexOf(b.code);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  private toMacroSplit(nutrients: NutrientLine[]): MacroSplit | null {
    const amountOf = (code: string) => nutrients.find((nutrient) => nutrient.code === code)?.amount ?? null;
    const protein = amountOf('PROTEIN');
    const carbs = amountOf('CARBS');
    const fat = amountOf('FAT');
    if (protein === null || carbs === null || fat === null) return null;
    const kcal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
    const total = kcal.protein + kcal.carbs + kcal.fat;
    if (total <= 0) return null;
    const proteinPercent = Math.round((kcal.protein / total) * 100);
    const carbsPercent = Math.round((kcal.carbs / total) * 100);
    return { proteinPercent, carbsPercent, fatPercent: Math.max(0, 100 - proteinPercent - carbsPercent) };
  }

  private toUncovered(value: unknown): UncoveredIngredient[] {
    return safeArray<UncoveredIngredientDto | null, UncoveredIngredient>(
      value as (UncoveredIngredientDto | null)[] | null | undefined,
      (item) => ({
        position: safeNumber(pickField(item, ['position'], 0)),
        displayName: safeString(pickField(item, ['displayName'], '')) || 'Nguyên liệu',
        reason: safeString(pickField(item, ['reason'], '')) || 'Chưa có dữ liệu thành phần chuẩn',
      })
    );
  }

  private toAssumptions(value: unknown): NutritionAssumption[] {
    return safeArray<NutritionAssumptionDto | null, NutritionAssumption>(
      value as (NutritionAssumptionDto | null)[] | null | undefined,
      (item) => ({
        code: safeString(pickField(item, ['code'], '')),
        message: safeString(pickField(item, ['message'], '')),
        isAiEstimated: toOrigin(pickField(item, ['origin'], 'CANONICAL_CALCULATED')) === 'AI_ESTIMATED',
      })
    ).filter((item) => item.message.length > 0);
  }
}

export const recipeNutritionMapper = new RecipeNutritionMapper();
