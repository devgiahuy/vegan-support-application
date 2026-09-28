import {
  BaseMapper,
  pickField,
  safeNumber,
  safeString,
  safeEnum,
  safeArray,
  safeDate,
} from '@/lib/mapper';

import type {
  RecognitionJobResponseDto,
  RecognitionCandidateDto,
  RecognitionImageDto,
  RecognitionConfirmationResponseDto,
  RecognitionJobStatusDto,
  RecognitionCandidateStatusDto,
  RecognitionInputStatusDto,
  CreateRecognitionJobReqDto,
  UpdateRecognitionCandidateReqDto,
  ConfirmRecognitionJobReqDto,
  RetryRecognitionJobReqDto,
} from '../types/ingredient-recognition.dto';

import type {
  RecognitionJob,
  RecognitionCandidate,
  RecognitionImage,
  RecognitionConfirmationDiff,
  RecognitionPantryChange,
  RecognitionJobStatus,
  RecognitionCandidateStatus,
  RecognitionInputStatus,
  UpdateCandidateInput,
} from '../types/ingredient-recognition.model';

const RecognitionJobStatusEnum: Record<RecognitionJobStatus, RecognitionJobStatus> = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  PARTIAL_FAILED: 'PARTIAL_FAILED',
  FAILED: 'FAILED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
};

const RecognitionCandidateStatusEnum: Record<
  RecognitionCandidateStatus,
  RecognitionCandidateStatus
> = {
  PROPOSED: 'PROPOSED',
  EDITED: 'EDITED',
  REJECTED: 'REJECTED',
  CONFIRMED: 'CONFIRMED',
};

const RecognitionInputStatusEnum: Record<RecognitionInputStatus, RecognitionInputStatus> = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
};

const STATUS_LABELS: Record<RecognitionJobStatus, string> = {
  QUEUED: 'Đang xếp hàng',
  PROCESSING: 'Đang phân tích',
  READY: 'Sẵn sàng duyệt',
  PARTIAL_FAILED: 'Lỗi một số ảnh',
  FAILED: 'Phân tích thất bại',
  CONFIRMED: 'Đã thêm vào tủ bếp',
  CANCELLED: 'Đã hủy tác vụ',
};

const STATUS_BADGE_VARIANTS: Record<
  RecognitionJobStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  QUEUED: 'secondary',
  PROCESSING: 'secondary',
  READY: 'default',
  PARTIAL_FAILED: 'outline',
  FAILED: 'destructive',
  CONFIRMED: 'default',
  CANCELLED: 'outline',
};

export class IngredientRecognitionMapper extends BaseMapper<
  RecognitionJobResponseDto,
  RecognitionJob
> {
  toModel(dto: RecognitionJobResponseDto | null | undefined): RecognitionJob {
    const id = safeString(pickField(dto, ['id'], ''));
    const status = safeEnum(
      pickField(dto, ['status'], 'FAILED'),
      RecognitionJobStatusEnum,
      'FAILED'
    );

    const statusLabel = STATUS_LABELS[status] || 'Không xác định';
    const statusBadgeVariant = STATUS_BADGE_VARIANTS[status] || 'secondary';

    const completedImages = safeNumber(
      pickField(dto, ['progress.completedImages', 'progress.completed_images'], 0)
    );
    const totalImages = safeNumber(
      pickField(dto, ['progress.totalImages', 'progress.total_images'], 0)
    );
    const progressPercent =
      totalImages > 0 ? Math.min(100, Math.round((completedImages / totalImages) * 100)) : 0;

    const rawImages = safeArray<RecognitionImageDto>(pickField(dto, ['images'], []));
    const images = rawImages.map((img) => this.toImageModel(img));

    const rawCandidates = safeArray<RecognitionCandidateDto>(pickField(dto, ['candidates'], []));
    const candidates = rawCandidates.map((c) => this.toCandidateModel(c));

    const proposedCandidatesCount = candidates.filter(
      (c) => c.status === 'PROPOSED' || c.status === 'EDITED'
    ).length;
    const rejectedCandidatesCount = candidates.filter((c) => c.status === 'REJECTED').length;

    const attempt = safeNumber(pickField(dto, ['attempt'], 1));

    const issueRaw = pickField<{ code?: string; message?: string } | null>(dto, ['issue'], null);
    const issue =
      issueRaw && (issueRaw.code || issueRaw.message)
        ? {
            code: safeString(issueRaw.code, 'UNKNOWN_ERROR'),
            message: safeString(issueRaw.message, 'Có lỗi xảy ra trong quá trình nhận diện.'),
          }
        : null;

    const freshnessDisclaimer = safeString(
      pickField(dto, ['freshnessDisclaimer', 'freshness_disclaimer'], ''),
      'Quan sát độ tươi chỉ là ước lượng thị giác sơ bộ từ hình ảnh. Người dùng phải tự kiểm tra chất lượng thực phẩm thực tế trước khi sử dụng; hệ thống không đưa ra quyết định hay chứng nhận về an toàn thực phẩm.'
    );

    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));
    const updatedAt = safeDate(pickField(dto, ['updatedAt', 'updated_at'], null));
    const completedAt = safeDate(pickField(dto, ['completedAt', 'completed_at'], null));
    const confirmedAt = safeDate(pickField(dto, ['confirmedAt', 'confirmed_at'], null));

    const isProcessing = status === 'QUEUED' || status === 'PROCESSING';
    const isReadyForReview = status === 'READY' || status === 'PARTIAL_FAILED';
    const isConfirmed = status === 'CONFIRMED';
    const isCancelled = status === 'CANCELLED';
    const isFailed = status === 'FAILED';
    const canRetry = isFailed || status === 'PARTIAL_FAILED';
    const canConfirm = isReadyForReview && proposedCandidatesCount > 0;

    return {
      id,
      status,
      statusLabel,
      statusBadgeVariant,
      progress: {
        completedImages,
        totalImages,
        percent: progressPercent,
      },
      images,
      candidates,
      proposedCandidatesCount,
      rejectedCandidatesCount,
      attempt,
      issue,
      freshnessDisclaimer,
      createdAt,
      updatedAt,
      completedAt,
      confirmedAt,
      isProcessing,
      isReadyForReview,
      isConfirmed,
      isCancelled,
      isFailed,
      canRetry,
      canConfirm,
    };
  }

  toCandidateModel(dto: RecognitionCandidateDto | null | undefined): RecognitionCandidate {
    const id = safeString(pickField(dto, ['id'], ''));
    const name = safeString(pickField(dto, ['name', 'detectedName'], 'Nguyên liệu'));

    // Gợi ý nguyên liệu chuẩn
    const suggestionDto = pickField<RecognitionCandidateDto['ingredientSuggestion']>(
      dto,
      ['ingredientSuggestion', 'ingredient_suggestion'],
      null
    );

    let ingredientSuggestion = null;
    if (suggestionDto && suggestionDto.id) {
      const sugConfidence = safeNumber(suggestionDto.confidence, 0);
      const sugConfidencePercent = Math.min(100, Math.max(0, Math.round(sugConfidence * 100)));
      ingredientSuggestion = {
        id: safeString(suggestionDto.id, ''),
        name: safeString(suggestionDto.name, ''),
        confidencePercent: sugConfidencePercent,
        isHighConfidence: sugConfidence >= 0.8,
      };
    }

    // Số lượng & đơn vị
    const quantityVal = pickField<number | null>(dto, ['quantity.value', 'quantity_value'], null);
    const quantityNum =
      quantityVal !== null && quantityVal !== undefined ? safeNumber(quantityVal, 0) : null;
    const unitVal = pickField<string | null>(dto, ['quantity.unit', 'quantity_unit', 'unit'], null);
    const unitStr = unitVal ? safeString(unitVal, '') : null;

    let formattedQuantity = 'Chưa xác định';
    if (quantityNum !== null && unitStr) {
      formattedQuantity = `${quantityNum.toLocaleString('vi-VN')} ${unitStr}`.trim();
    } else if (quantityNum !== null) {
      formattedQuantity = `${quantityNum.toLocaleString('vi-VN')}`.trim();
    }

    const freshnessObservationRaw = safeString(
      pickField(dto, ['freshnessObservation', 'freshness_observation'], '')
    );
    const freshnessObservation =
      freshnessObservationRaw.length > 0 ? freshnessObservationRaw : null;

    const confidence = safeNumber(pickField(dto, ['confidence'], 0));
    const confidencePercent = Math.min(100, Math.max(0, Math.round(confidence * 100)));

    let confidenceTier: 'high' | 'medium' | 'low' = 'low';
    if (confidence >= 0.8) {
      confidenceTier = 'high';
    } else if (confidence >= 0.5) {
      confidenceTier = 'medium';
    }

    const uncertaintyNoteRaw = safeString(
      pickField(dto, ['uncertaintyNote', 'uncertainty_note'], '')
    );
    const uncertaintyNote = uncertaintyNoteRaw.length > 0 ? uncertaintyNoteRaw : null;

    const status = safeEnum(
      pickField(dto, ['status'], 'PROPOSED'),
      RecognitionCandidateStatusEnum,
      'PROPOSED'
    );

    const version = safeNumber(pickField(dto, ['version'], 1));

    // Evidence
    const evidenceRaw = safeArray<{
      imageId?: string;
      imagePosition?: number;
      confidence?: number;
    }>(pickField(dto, ['evidence'], []));
    const evidence = evidenceRaw
      .map((ev) => {
        const evConf = safeNumber(ev.confidence, 0);
        return {
          imageId: safeString(ev.imageId, ''),
          imagePosition: safeNumber(ev.imagePosition, 0),
          confidencePercent: Math.min(100, Math.max(0, Math.round(evConf * 100))),
        };
      })
      .sort((a, b) => a.imagePosition - b.imagePosition);

    return {
      id,
      name,
      ingredientSuggestion,
      quantity: {
        value: quantityNum,
        unit: unitStr,
        formatted: formattedQuantity,
      },
      freshnessObservation,
      confidence,
      confidencePercent,
      confidenceTier,
      uncertaintyNote,
      status,
      isRejected: status === 'REJECTED',
      isEdited: status === 'EDITED',
      version,
      evidence,
    };
  }

  toImageModel(dto: RecognitionImageDto | null | undefined): RecognitionImage {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      position: safeNumber(pickField(dto, ['position'], 0)),
      url: safeString(pickField(dto, ['url'], '')),
      status: safeEnum(
        pickField(dto, ['status'], 'PENDING'),
        RecognitionInputStatusEnum,
        'PENDING'
      ),
      issue: safeString(pickField(dto, ['issue', 'errorMessage', 'error_message'], '')) || null,
    };
  }

  toConfirmationModel(
    dto: RecognitionConfirmationResponseDto | null | undefined
  ): RecognitionConfirmationDiff {
    const job = this.toModel(dto?.job);
    const rawChanges = safeArray<any>(pickField(dto, ['pantryChanges', 'pantry_changes'], []));

    const pantryChanges: RecognitionPantryChange[] = rawChanges.map((change) => {
      const candidateId = safeString(pickField(change, ['candidateId', 'candidate_id'], ''));
      const action = pickField<'CREATED' | 'UPDATED'>(change, ['action'], 'CREATED');
      const actionLabel = action === 'CREATED' ? 'Đã thêm mới' : 'Đã cập nhật';

      const pItemRaw = pickField<any>(change, ['pantryItem', 'pantry_item'], {});
      const ingObj = pickField<any>(pItemRaw, ['ingredient'], null);

      return {
        candidateId,
        action,
        actionLabel,
        pantryItem: {
          id: safeString(pickField(pItemRaw, ['id'], '')),
          ingredient:
            ingObj && ingObj.id
              ? { id: safeString(ingObj.id, ''), name: safeString(ingObj.name, '') }
              : null,
          unmatchedText:
            safeString(pickField(pItemRaw, ['unmatchedText', 'unmatched_text'], '')) || null,
          quantity: safeNumber(pickField(pItemRaw, ['quantity'], 0)),
          unit: safeString(pickField(pItemRaw, ['unit'], '')),
          source: safeString(pickField(pItemRaw, ['source'], 'FRIDGE_RECOGNITION')),
          confidence: safeNumber(pickField(pItemRaw, ['confidence'], 0)),
          confirmationStatus: safeString(pickField(pItemRaw, ['confirmationStatus'], 'CONFIRMED')),
          version: safeNumber(pickField(pItemRaw, ['version'], 1)),
        },
      };
    });

    return {
      job,
      pantryChanges,
    };
  }

  toCreateJobDto(input: {
    imageAssetIds: string[];
    idempotencyKey: string;
  }): CreateRecognitionJobReqDto {
    return {
      imageAssetIds: input.imageAssetIds,
      idempotencyKey: input.idempotencyKey,
    };
  }

  toUpdateCandidateDto(input: UpdateCandidateInput): UpdateRecognitionCandidateReqDto {
    const dto: UpdateRecognitionCandidateReqDto = {
      expectedVersion: input.expectedVersion,
    };

    if (input.ingredientId !== undefined) {
      dto.ingredientId = input.ingredientId;
    }
    if (input.detectedName !== undefined) {
      dto.detectedName = input.detectedName.trim();
    }
    if (input.quantity !== undefined) {
      dto.quantity = input.quantity;
    }
    if (input.unit !== undefined) {
      dto.unit = input.unit ? input.unit.trim() : null;
    }
    if (input.freshnessObservation !== undefined) {
      dto.freshnessObservation = input.freshnessObservation
        ? input.freshnessObservation.trim()
        : null;
    }
    if (input.confidence !== undefined) {
      dto.confidence = input.confidence;
    }
    if (input.decision !== undefined) {
      dto.decision = input.decision;
    }

    return dto;
  }

  toConfirmDto(input: {
    candidates: { id: string; expectedVersion: number }[];
    idempotencyKey: string;
  }): ConfirmRecognitionJobReqDto {
    return {
      candidates: input.candidates.map((c) => ({
        id: c.id,
        expectedVersion: c.expectedVersion,
      })),
      idempotencyKey: input.idempotencyKey,
    };
  }

  toRetryDto(input: { idempotencyKey: string }): RetryRecognitionJobReqDto {
    return {
      idempotencyKey: input.idempotencyKey,
    };
  }
}

export const ingredientRecognitionMapper = new IngredientRecognitionMapper();
