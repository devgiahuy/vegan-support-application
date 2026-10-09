import {
  AiArtifactStatus,
  AiArtifactType,
  AiArtifactVisibility,
  AiVerificationConclusion,
  AiVerificationStatus,
} from '@/common/enums';
import { BaseMapper, pickField, safeArray, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type {
  AiArtifactContentDto,
  AiArtifactDto,
  AiArtifactResponseDto,
  AiVerificationDto,
  CreateAiArtifactRequestDto,
  NutrientSnapshotDto,
  PublicAiArtifactListResponseDto,
  RecognitionItemDto,
  SubmitAiArtifactRequestDto,
  UpdateAiArtifactVisibilityRequestDto,
} from '../types/ai-artifact.dto';
import type {
  AiArtifact,
  AiArtifactContent,
  AiArtifactListResult,
  AiVerification,
  CreateAiArtifactInput,
  NutrientSnapshot,
  RecognitionItem,
} from '../types/ai-artifact.model';

const TYPE_LABELS: Record<AiArtifactType, string> = {
  [AiArtifactType.CHAT_ANSWER]: 'Trợ lý AI',
  [AiArtifactType.RECIPE_NUTRITION]: 'Dinh dưỡng món ăn',
  [AiArtifactType.FRIDGE_RECOGNITION]: 'Nhận diện tủ lạnh',
  [AiArtifactType.RECEIPT_EXTRACTION]: 'Bóc tách hóa đơn',
};

const CONCLUSION_LABELS: Record<AiVerificationConclusion, string> = {
  [AiVerificationConclusion.VERIFIED]: 'Chính xác',
  [AiVerificationConclusion.CORRECTION_NEEDED]: 'Cần chỉnh lý',
  [AiVerificationConclusion.REJECTED]: 'Không chuẩn xác',
};

const RECOGNITION_STATUS_LABELS: Record<string, string> = {
  DETECTED: 'Đã nhận diện',
  CONFIRMED: 'Đã xác nhận',
  EDITED: 'Đã chỉnh sửa',
  REJECTED: 'Đã loại',
  UNCERTAIN: 'Chưa chắc chắn',
};

export const TITLE_MIN = 3;
export const TITLE_MAX = 160;
export const SUMMARY_MIN = 3;
export const SUMMARY_MAX = 1000;

function formatDateLabel(value: unknown): string {
  const date = safeDate(value);
  return date ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
}

function percent(value: unknown, fallback = 0): number {
  return Math.round(Math.max(0, Math.min(1, safeNumber(value, fallback))) * 100);
}

function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toVerification(dto: AiVerificationDto | null | undefined): AiVerification {
  const conclusion = safeEnum(
    pickField(dto, ['conclusion'], ''),
    AiVerificationConclusion,
    AiVerificationConclusion.VERIFIED
  );
  const role = safeString(pickField(dto, ['reviewer.role'], ''));
  return {
    id: safeString(pickField(dto, ['id'], '')),
    artifactVersion: safeNumber(pickField(dto, ['artifactVersion'], 1), 1),
    conclusion,
    conclusionLabel: CONCLUSION_LABELS[conclusion],
    scope: safeString(pickField(dto, ['scope'], '')),
    evidenceNote: safeString(pickField(dto, ['evidenceNote'], '')),
    correction: safeString(pickField(dto, ['correction'], '')) || null,
    status: safeEnum(pickField(dto, ['status'], ''), AiVerificationStatus, AiVerificationStatus.ACTIVE),
    reviewerName: safeString(pickField(dto, ['reviewer.name'], '')) || 'Người thẩm định',
    reviewerRoleLabel: role.toUpperCase() === 'ADMIN' ? 'Quản trị viên' : 'Người đóng góp',
    createdAtLabel: formatDateLabel(pickField(dto, ['createdAt'], null)),
  };
}

function toNutrients(items: NutrientSnapshotDto[] | undefined): NutrientSnapshot[] {
  return safeArray<NutrientSnapshotDto | null, NutrientSnapshot>(items, (item) => {
    const unit = safeString(item?.unit);
    const min = optionalNumber(item?.range?.min);
    const max = optionalNumber(item?.range?.max);
    return {
      code: safeString(item?.code),
      name: safeString(item?.name) || 'Chỉ số',
      amount: safeNumber(item?.amount, 0),
      unit,
      confidencePercent: percent(item?.confidence, 0),
      rangeLabel: min !== null && max !== null ? `${min} - ${max} ${unit}`.trim() : null,
    };
  });
}

function toRecognitionItems(items: RecognitionItemDto[] | undefined): RecognitionItem[] {
  return safeArray<RecognitionItemDto | null, RecognitionItem>(items, (item) => {
    const value = optionalNumber(item?.quantity?.value);
    const unit = safeString(item?.quantity?.unit);
    const status = safeString(item?.status).toUpperCase();
    return {
      name: safeString(item?.name) || 'Nguyên liệu',
      quantityLabel: value !== null ? `${value} ${unit}`.trim() : 'Không rõ số lượng',
      statusLabel: RECOGNITION_STATUS_LABELS[status] ?? status,
      confidencePercent: percent(item?.confidence, 0),
    };
  });
}

function toContent(type: AiArtifactType, dto: AiArtifactContentDto | undefined): AiArtifactContent {
  if (type === AiArtifactType.RECIPE_NUTRITION) {
    return {
      type,
      recipeTitle: safeString(dto?.recipe?.title) || 'Công thức chay',
      servings: safeNumber(dto?.recipe?.servings, 1),
      rawGrams: safeNumber(dto?.totals?.rawGrams, 0),
      cookedGrams: safeNumber(dto?.totals?.cookedGrams, 0),
      nutrients: toNutrients(dto?.perServingNutrients),
      confidencePercent: percent(dto?.confidence, 0),
      disclaimer: safeString(dto?.disclaimer),
    };
  }
  if (type === AiArtifactType.FRIDGE_RECOGNITION) {
    return { type, items: toRecognitionItems(dto?.items) };
  }
  if (type === AiArtifactType.RECEIPT_EXTRACTION) {
    return { type, items: toRecognitionItems(dto?.items) };
  }
  return { type: AiArtifactType.CHAT_ANSWER, answer: safeString(dto?.answer) };
}

/** Chuyển DTO AI Artifact của backend sang model giao diện (không có dữ liệu riêng tư ngoài allowlist). */
export class AiArtifactMapper extends BaseMapper<AiArtifactDto, AiArtifact> {
  toModel(dto: AiArtifactDto | null | undefined): AiArtifact {
    const type = safeEnum(pickField(dto, ['type'], ''), AiArtifactType, AiArtifactType.CHAT_ANSWER);
    const visibility = safeEnum(
      pickField(dto, ['lifecycle.visibility'], ''),
      AiArtifactVisibility,
      AiArtifactVisibility.PRIVATE
    );
    const status = safeEnum(pickField(dto, ['lifecycle.status'], ''), AiArtifactStatus, AiArtifactStatus.DRAFT);
    const anonymous = pickField<boolean>(dto, ['author.anonymous'], true);
    const activeRaw = pickField<AiVerificationDto | null>(dto, ['activeVerification'], null);

    return {
      id: safeString(pickField(dto, ['id'], '')),
      type,
      typeLabel: TYPE_LABELS[type],
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      title: safeString(pickField(dto, ['title'], '')) || 'Tri thức AI VeggieConnect',
      summary: safeString(pickField(dto, ['summary'], '')),
      content: toContent(type, pickField<AiArtifactContentDto | undefined>(dto, ['content'], undefined)),
      authorName:
        safeString(pickField(dto, ['author.name'], '')) || (anonymous ? 'Thành viên ẩn danh' : 'Thành viên VeggieConnect'),
      status,
      visibility,
      lifecycleVersion: safeNumber(pickField(dto, ['lifecycle.version'], 1), 1),
      isPublic: visibility === AiArtifactVisibility.PUBLIC,
      isSubmitted: status === AiArtifactStatus.SUBMITTED,
      activeVerification: activeRaw ? toVerification(activeRaw) : null,
      verificationHistory: safeArray<AiVerificationDto | null, AiVerification>(
        pickField(dto, ['verificationHistory'], null),
        toVerification
      ),
      createdAtLabel: formatDateLabel(pickField(dto, ['createdAt'], null)),
    };
  }

  toSingle(dto: AiArtifactResponseDto | null | undefined): AiArtifact {
    return this.toModel(pickField(dto, ['data'], null));
  }

  toListResult(dto: PublicAiArtifactListResponseDto | null | undefined): AiArtifactListResult {
    const items = this.toModelList(pickField(dto, ['data'], null)).filter((item) => item.id.length > 0);
    return {
      items,
      page: safeNumber(pickField(dto, ['meta.page'], 1), 1),
      total: safeNumber(pickField(dto, ['meta.total'], items.length), items.length),
      totalPages: safeNumber(pickField(dto, ['meta.totalPages'], 1), 1),
    };
  }

  toCreateDto(input: CreateAiArtifactInput): CreateAiArtifactRequestDto {
    return {
      type: input.type,
      sourceId: input.sourceId,
      title: input.title.trim(),
      summary: input.summary.trim(),
      authorAnonymous: input.authorAnonymous,
    };
  }

  toVisibilityDto(visibility: 'PRIVATE' | 'PUBLIC', expectedLifecycleVersion: number): UpdateAiArtifactVisibilityRequestDto {
    return { visibility, expectedLifecycleVersion };
  }

  toSubmitDto(expectedLifecycleVersion: number): SubmitAiArtifactRequestDto {
    return { expectedLifecycleVersion };
  }
}

export const aiArtifactMapper = new AiArtifactMapper();
