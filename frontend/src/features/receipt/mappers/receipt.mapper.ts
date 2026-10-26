import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  ReceiptCandidateDto,
  ReceiptConfirmationResponseDto,
  ReceiptConfirmationPantryItemDto,
  ReceiptDuplicateCandidateDto,
  ReceiptExcludedItemDto,
  ReceiptImageDto,
  ReceiptJobResponseDto,
  ReceiptNoticeDto,
  ReceiptPantryChangeDto,
  CreateReceiptJobReqDto,
  UpdateReceiptCandidateReqDto,
  ConfirmReceiptJobReqDto,
  ReceiptCandidateStatusDto,
  ReceiptJobStatusDto,
} from '../types/receipt.dto';
import type {
  ConfidenceTier,
  CreateReceiptJobInput,
  ReceiptCandidate,
  ReceiptCandidatePricing,
  ReceiptCandidateQuantity,
  ReceiptCandidateStatus,
  ReceiptConfirmationDiff,
  ReceiptDuplicateCandidate,
  ReceiptExcludedItem,
  ReceiptConfirmationPantryItem,
  ReceiptImage,
  ReceiptIngredientSuggestion,
  ReceiptJob,
  ReceiptJobIssue,
  ReceiptJobMetadata,
  ReceiptJobProgress,
  ReceiptJobStatus,
  ReceiptNotice,
  ReceiptPantryChange,
  UpdateReceiptCandidateInput,
} from '../types/receipt.model';

const STATUS_LABELS: Record<ReceiptJobStatus, string> = {
  QUEUED: 'Đang chờ xử lý',
  PROCESSING: 'Đang bóc tách',
  READY: 'Sẵn sàng kiểm duyệt',
  PARTIAL_FAILED: 'Thất bại một phần',
  FAILED: 'Thất bại',
  CONFIRMED: 'Đã nhập tủ bếp',
  CANCELLED: 'Đã hủy',
};

const STATUS_BADGE_VARIANTS: Record<
  ReceiptJobStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  QUEUED: 'secondary',
  PROCESSING: 'secondary',
  READY: 'default',
  PARTIAL_FAILED: 'destructive',
  FAILED: 'destructive',
  CONFIRMED: 'outline',
  CANCELLED: 'outline',
};

const CANDIDATE_STATUS_LABELS: Record<ReceiptCandidateStatus, string> = {
  PROPOSED: 'Đề xuất',
  EDITED: 'Đã chỉnh sửa',
  REJECTED: 'Đã loại bỏ',
  CONFIRMED: 'Đã nhập kho',
};

export class ReceiptMapper extends BaseMapper<ReceiptJobResponseDto, ReceiptJob> {
  toModel(dto: ReceiptJobResponseDto | null | undefined): ReceiptJob {
    const id = safeString(pickField(dto, ['id'], ''));
    const rawStatus = safeString(pickField(dto, ['status'], 'QUEUED')) as ReceiptJobStatusDto;
    const status: ReceiptJobStatus = (
      [
        'QUEUED',
        'PROCESSING',
        'READY',
        'PARTIAL_FAILED',
        'FAILED',
        'CONFIRMED',
        'CANCELLED',
      ].includes(rawStatus)
        ? rawStatus
        : 'QUEUED'
    ) as ReceiptJobStatus;

    const statusLabel = STATUS_LABELS[status] || 'Không xác định';
    const statusBadgeVariant = STATUS_BADGE_VARIANTS[status] || 'secondary';

    const rawNotices = pickField<ReceiptNoticeDto[]>(dto, ['notices'], []);
    const notices: ReceiptNotice[] = safeArray(rawNotices, (notice) => ({
      code: 'RECEIPT_NON_FOOD_ITEMS_EXCLUDED',
      message: safeString(pickField(notice, ['message'], '')),
      count: safeNumber(pickField(notice, ['count'], 0)),
    }));
    const rawExcludedItems = pickField<ReceiptExcludedItemDto[]>(dto, ['excludedItems'], []);
    const excludedItems: ReceiptExcludedItem[] = safeArray(rawExcludedItems, (item) => ({
      id: safeString(pickField(item, ['id'], '')),
      imageId: safeString(pickField(item, ['imageId', 'image_id'], '')),
      lineText: safeString(pickField(item, ['lineText', 'line_text'], '')),
      name: safeString(pickField(item, ['name'], '')),
      reason: safeString(pickField(item, ['reason'], 'Mặt hàng được loại khỏi danh sách.')),
      confidencePercent: Math.round(safeNumber(pickField(item, ['confidence'], 0)) * 100),
      version: safeNumber(pickField(item, ['version'], 1), 1),
    }));
    const rawReviewDecision = safeString(pickField(dto, ['receiptReviewDecision'], ''));
    const receiptReviewDecision = ['SAME_RECEIPT', 'SEPARATE_RECEIPTS'].includes(rawReviewDecision)
      ? (rawReviewDecision as ReceiptJob['receiptReviewDecision'])
      : null;

    // Progress
    const completedImages = safeNumber(
      pickField(dto, ['progress.completedImages', 'progress.completed_images'], 0)
    );
    const totalImages = safeNumber(
      pickField(dto, ['progress.totalImages', 'progress.total_images'], 0)
    );
    const progressPercent = totalImages > 0 ? Math.round((completedImages / totalImages) * 100) : 0;
    const progress: ReceiptJobProgress = {
      completedImages,
      totalImages,
      percent: progressPercent,
    };

    // Metadata
    const merchantName = safeString(
      pickField(dto, ['receipt.merchantName', 'receipt.merchant_name'], '')
    );
    const purchasedAtDate = safeDate(
      pickField(dto, ['receipt.purchasedAt', 'receipt.purchased_at'], null)
    );
    const formattedDate = purchasedAtDate
      ? purchasedAtDate.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : 'Không có thông tin';
    const currency = safeString(pickField(dto, ['receipt.currency'], 'VND')) || 'VND';
    const totalAmount = pickField<number | null>(
      dto,
      ['receipt.totalAmount', 'receipt.total_amount'],
      null
    );
    const formattedTotalAmount = this.formatCurrency(totalAmount, currency);
    const metadataConfidence = pickField<number | null>(dto, ['receipt.confidence'], null);
    const metadataConfidencePercent =
      metadataConfidence !== null ? Math.round(metadataConfidence * 100) : null;

    const receiptMetadata: ReceiptJobMetadata = {
      merchantName: merchantName || 'Hóa đơn mua sắm',
      purchasedAt: purchasedAtDate,
      formattedDate,
      currency,
      totalAmount,
      formattedTotalAmount,
      confidence: metadataConfidence,
      confidencePercent: metadataConfidencePercent,
    };

    // Images
    const rawImages = pickField<ReceiptImageDto[]>(dto, ['images'], []);
    const images: ReceiptImage[] = safeArray<ReceiptImageDto, ReceiptImage>(rawImages, (img) =>
      this.toImageModel(img)
    );

    // Candidates
    const rawCandidates = pickField<ReceiptCandidateDto[]>(dto, ['candidates'], []);
    const candidates: ReceiptCandidate[] = safeArray<ReceiptCandidateDto, ReceiptCandidate>(
      rawCandidates,
      (cand) => this.toCandidateModel(cand, currency)
    );

    const activeCandidates = candidates.filter((c) => !c.isRejected);
    const rejectedCandidates = candidates.filter((c) => c.isRejected);

    // Attempt & Issue
    const attempt = safeNumber(pickField(dto, ['attempt'], 0));
    const issueObj = pickField<ReceiptJobIssue | null>(dto, ['issue'], null);
    const issue: ReceiptJobIssue | null = issueObj
      ? {
          code: safeString(issueObj.code, 'UNKNOWN_ERROR'),
          message: safeString(issueObj.message, 'Đã xảy ra lỗi khi xử lý hóa đơn'),
        }
      : null;

    // Timestamps
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));
    const updatedAt = safeDate(pickField(dto, ['updatedAt', 'updated_at'], null));
    const completedAt = safeDate(pickField(dto, ['completedAt', 'completed_at'], null));
    const confirmedAt = safeDate(pickField(dto, ['confirmedAt', 'confirmed_at'], null));

    // Helper flags
    const isProcessing = status === 'QUEUED' || status === 'PROCESSING';
    const isReadyForReview = status === 'READY' || status === 'PARTIAL_FAILED';
    const isConfirmed = status === 'CONFIRMED';
    const isCancelled = status === 'CANCELLED';
    const isFailed = status === 'FAILED';
    const canConfirm = isReadyForReview && activeCandidates.length > 0;
    const canRetry = status === 'FAILED' || status === 'PARTIAL_FAILED';
    const canCancel = !isConfirmed && !isCancelled;
    const canAddImages =
      (status === 'READY' || status === 'PARTIAL_FAILED' || status === 'FAILED') &&
      !isProcessing &&
      images.length < 4;

    return {
      id,
      status,
      statusLabel,
      statusBadgeVariant,
      reviewRequired: Boolean(pickField(dto, ['reviewRequired'], false)),
      identityDecisionRequired: Boolean(pickField(dto, ['identityDecisionRequired'], false)),
      receiptReviewDecision,
      notices,
      excludedItems,
      progress,
      receiptMetadata,
      images,
      candidates,
      activeCandidates,
      rejectedCandidates,
      attempt,
      issue,
      createdAt,
      updatedAt,
      completedAt,
      confirmedAt,
      isProcessing,
      isReadyForReview,
      isConfirmed,
      isCancelled,
      isFailed,
      canConfirm,
      canRetry,
      canCancel,
      canAddImages,
    };
  }

  toImageModel(dto: ReceiptImageDto | null | undefined): ReceiptImage {
    const id = safeString(pickField(dto, ['id'], ''));
    const position = safeNumber(pickField(dto, ['position'], 0));
    const url = safeString(pickField(dto, ['url'], ''));
    const rawStatus = safeString(pickField(dto, ['status'], 'PENDING'));
    const status = ['PENDING', 'PROCESSED', 'FAILED'].includes(rawStatus)
      ? (rawStatus as ReceiptImage['status'])
      : 'PENDING';

    const statusLabels: Record<ReceiptImage['status'], string> = {
      PENDING: 'Đang chờ',
      PROCESSED: 'Đã xử lý',
      FAILED: 'Lỗi xử lý',
    };

    const issue = pickField<string | null>(dto, ['issue'], null);
    const receiptNumber = pickField<string | null>(dto, ['receiptNumber'], null);
    const merchantName = pickField<string | null>(dto, ['merchantName'], null);
    const purchasedAt = safeDate(pickField(dto, ['purchasedAt'], null));
    const currency = pickField<string | null>(dto, ['currency'], null);
    const totalAmount = pickField<number | null>(dto, ['totalAmount'], null);

    return {
      id,
      position,
      url,
      status,
      statusLabel: statusLabels[status] || 'Không xác định',
      receiptNumber,
      merchantName,
      purchasedAt,
      currency,
      totalAmount,
      issue,
    };
  }

  toCandidateModel(
    dto: ReceiptCandidateDto | null | undefined,
    fallbackCurrency: string = 'VND'
  ): ReceiptCandidate {
    const id = safeString(pickField(dto, ['id'], ''));
    const imageId = safeString(pickField(dto, ['imageId', 'image_id'], ''));
    const lineText = safeString(pickField(dto, ['lineText', 'line_text'], ''));
    const name = safeString(pickField(dto, ['name'], ''));

    // Suggestion
    const suggestionDto = pickField<ReceiptCandidateDto['ingredientSuggestion']>(
      dto,
      ['ingredientSuggestion', 'ingredient_suggestion'],
      null
    );
    let ingredientSuggestion: ReceiptIngredientSuggestion | null = null;
    if (suggestionDto && suggestionDto.id) {
      const conf = safeNumber(suggestionDto.confidence, 0);
      ingredientSuggestion = {
        id: safeString(suggestionDto.id),
        name: safeString(suggestionDto.name),
        confidence: conf,
        confidencePercent: Math.round(conf * 100),
        isHighConfidence: conf >= 0.75,
      };
    }

    // Quantity
    const qtyValue = pickField<number | null>(dto, ['quantity.value'], null);
    const qtyUnit = pickField<string | null>(dto, ['quantity.unit'], null);
    const formattedQuantity =
      qtyValue !== null && qtyUnit
        ? `${qtyValue.toLocaleString('vi-VN')} ${qtyUnit}`.trim()
        : qtyUnit
          ? qtyUnit
          : '';

    const quantity: ReceiptCandidateQuantity = {
      value: qtyValue,
      unit: qtyUnit,
      formatted: formattedQuantity,
    };

    // Pricing
    const unitPrice = pickField<number | null>(
      dto,
      ['pricing.unitPrice', 'pricing.unit_price'],
      null
    );
    const lineTotal = pickField<number | null>(
      dto,
      ['pricing.lineTotal', 'pricing.line_total'],
      null
    );
    const currency =
      safeString(pickField(dto, ['pricing.currency'], fallbackCurrency)) || fallbackCurrency;

    const pricing: ReceiptCandidatePricing = {
      unitPrice,
      lineTotal,
      currency,
      formattedUnitPrice: this.formatCurrency(unitPrice, currency),
      formattedLineTotal: this.formatCurrency(lineTotal, currency),
    };

    // Confidence
    const confidence = safeNumber(pickField(dto, ['confidence'], 0));
    const confidencePercent = Math.round(confidence * 100);
    const confidenceTier = this.classifyConfidence(confidence);
    const uncertaintyNote = pickField<string | null>(
      dto,
      ['uncertaintyNote', 'uncertainty_note'],
      null
    );

    // Status
    const rawStatus = safeString(
      pickField(dto, ['status'], 'PROPOSED')
    ) as ReceiptCandidateStatusDto;
    const status: ReceiptCandidateStatus = ['PROPOSED', 'EDITED', 'REJECTED', 'CONFIRMED'].includes(
      rawStatus
    )
      ? rawStatus
      : 'PROPOSED';

    const statusLabel = CANDIDATE_STATUS_LABELS[status] || 'Đề xuất';
    const isRejected = status === 'REJECTED';
    const isEdited = status === 'EDITED';
    const isConfirmed = status === 'CONFIRMED';
    const rawClassification = safeString(pickField(dto, ['aiClassification'], 'UNCERTAIN'));
    const aiClassification: ReceiptCandidate['aiClassification'] = [
      'FOOD',
      'READY_TO_EAT',
      'NON_FOOD',
      'UNCERTAIN',
    ].includes(rawClassification)
      ? (rawClassification as ReceiptCandidate['aiClassification'])
      : 'UNCERTAIN';
    const classificationReason = pickField<string | null>(dto, ['classificationReason'], null);
    const rawClassificationConfidence = pickField<number | null>(
      dto,
      ['classificationConfidence'],
      null
    );
    const classificationConfidencePercent =
      rawClassificationConfidence === null
        ? null
        : Math.round(safeNumber(rawClassificationConfidence) * 100);
    const duplicateOfJobId = pickField<string | null>(dto, ['duplicateOfJobId'], null);
    const version = safeNumber(pickField(dto, ['version'], 1), 1);

    return {
      id,
      imageId,
      lineText,
      name,
      ingredientSuggestion,
      quantity,
      pricing,
      confidence,
      confidencePercent,
      confidenceTier,
      uncertaintyNote,
      aiClassification,
      classificationReason,
      classificationConfidencePercent,
      status,
      statusLabel,
      isRejected,
      isEdited,
      isConfirmed,
      duplicateOfJobId,
      version,
    };
  }

  toConfirmationModel(
    dto: ReceiptConfirmationResponseDto | null | undefined
  ): ReceiptConfirmationDiff {
    const job = this.toModel(dto?.job);
    const rawChanges = pickField(dto, ['pantryChanges', 'pantry_changes'], []);

    const pantryChanges: ReceiptPantryChange[] = safeArray<
      ReceiptPantryChangeDto,
      ReceiptPantryChange
    >(rawChanges, (change) => {
      const candidateId = safeString(pickField(change, ['candidateId', 'candidate_id'], ''));
      const action = pickField<'CREATED' | 'UPDATED'>(change, ['action'], 'CREATED');
      const actionLabel = action === 'CREATED' ? 'Thêm mới' : 'Cộng dồn';

      const pItem = pickField<ReceiptConfirmationPantryItemDto>(
        change,
        ['pantryItem', 'pantry_item'],
        {
          id: '',
          ingredient: null,
          unmatchedText: null,
          quantity: 0,
          unit: '',
          source: 'RECEIPT',
          confidence: 0,
          confirmationStatus: 'CONFIRMED',
          purchasedAt: null,
          version: 1,
        }
      );
      const pId = safeString(pickField(pItem, ['id'], ''));
      const ingredientObj = pickField<ReceiptConfirmationPantryItemDto['ingredient']>(
        pItem,
        ['ingredient'],
        null
      );
      const ingredientId = ingredientObj ? safeString(ingredientObj.id) || null : null;
      const ingredientName = ingredientObj ? safeString(ingredientObj.name) || null : null;
      const unmatchedText = pickField<string | null>(
        pItem,
        ['unmatchedText', 'unmatched_text'],
        null
      );
      const displayName = ingredientName || unmatchedText || 'Nguyên liệu hóa đơn';
      const quantity = safeNumber(pickField(pItem, ['quantity'], 0));
      const unit = safeString(pickField(pItem, ['unit'], ''));
      const formattedQuantity = `${quantity.toLocaleString('vi-VN')} ${unit}`.trim();
      const source = safeString(pickField(pItem, ['source'], 'RECEIPT'));
      const itemConf = safeNumber(pickField(pItem, ['confidence'], 0));
      const confidencePercent = Math.round(itemConf * 100);
      const purchasedAt = safeDate(pickField(pItem, ['purchasedAt', 'purchased_at'], null));
      const version = safeNumber(pickField(pItem, ['version'], 1));

      const pantryItem: ReceiptConfirmationPantryItem = {
        id: pId,
        ingredientId,
        ingredientName,
        unmatchedText,
        displayName,
        quantity,
        unit,
        formattedQuantity,
        source,
        confidencePercent,
        confirmationStatus: 'CONFIRMED',
        purchasedAt,
        version,
      };

      return {
        candidateId,
        action,
        actionLabel,
        pantryItem,
      };
    });
    const duplicateCandidates: ReceiptDuplicateCandidate[] = safeArray<
      ReceiptDuplicateCandidateDto,
      ReceiptDuplicateCandidate
    >(pickField(dto, ['duplicateCandidates', 'duplicate_candidates'], []), (item) => ({
      candidateId: safeString(pickField(item, ['candidateId', 'candidate_id'], '')),
      sourceJobId: safeString(pickField(item, ['sourceJobId', 'source_job_id'], '')),
    }));

    return {
      job,
      duplicateCandidates,
      pantryChanges,
    };
  }

  toCreateJobDto(input: CreateReceiptJobInput): CreateReceiptJobReqDto {
    return {
      imageAssetIds: input.imageAssetIds,
      idempotencyKey: input.idempotencyKey || this.generateUuid(),
    };
  }

  toUpdateCandidateDto(input: UpdateReceiptCandidateInput): UpdateReceiptCandidateReqDto {
    const dto: UpdateReceiptCandidateReqDto = {
      expectedVersion: input.expectedVersion,
    };

    if (input.ingredientId !== undefined) dto.ingredientId = input.ingredientId;
    if (input.detectedName !== undefined) dto.detectedName = input.detectedName;
    if (input.lineText !== undefined) dto.lineText = input.lineText;
    if (input.quantity !== undefined) dto.quantity = input.quantity;
    if (input.unit !== undefined) dto.unit = input.unit;
    if (input.unitPrice !== undefined) dto.unitPrice = input.unitPrice;
    if (input.lineTotal !== undefined) dto.lineTotal = input.lineTotal;
    if (input.currency !== undefined) dto.currency = input.currency;
    if (input.confidence !== undefined) dto.confidence = input.confidence;
    if (input.uncertaintyNote !== undefined) dto.uncertaintyNote = input.uncertaintyNote;
    if (input.decision !== undefined) dto.decision = input.decision;

    return dto;
  }

  toConfirmJobDto(input: {
    candidates: { id: string; expectedVersion: number }[];
    receiptReviewDecision?: ReceiptJob['receiptReviewDecision'];
    idempotencyKey?: string;
  }): ConfirmReceiptJobReqDto {
    return {
      candidates: input.candidates,
      ...(input.receiptReviewDecision
        ? { receiptReviewDecision: input.receiptReviewDecision }
        : {}),
      idempotencyKey: input.idempotencyKey || this.generateUuid(),
    };
  }

  private classifyConfidence(confidence: number): ConfidenceTier {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  private formatCurrency(amount: number | null | undefined, currency: string): string {
    if (amount === null || amount === undefined) return 'Chưa có giá';
    try {
      if (currency === 'VND') {
        return `${amount.toLocaleString('vi-VN')} ₫`;
      }
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `${amount.toLocaleString('vi-VN')} ${currency}`;
    }
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export const receiptMapper = new ReceiptMapper();
