import { BaseMapper } from '@/lib/mapper';
import type { CandidateEditDto, ReceiptRestoreDto, ScanConfirmationDto, ScanConfirmDto, ScanCreateDto, ScanJobDto, ScanRetryDto } from '../types/scanning.dto';
import type { CandidateEdit, ScanConfirmation, ScanConfirm, ScanCreate, ScanJob, ScanKind } from '../types/scanning.model';

export class ScanningMapper extends BaseMapper<ScanJobDto, ScanJob> {
  constructor(private readonly kind: ScanKind) { super(); }

  toModel(dto: ScanJobDto | null | undefined): ScanJob {
    if (!dto) throw new Error('Không nhận được kết quả quét.');
    return {
      id: dto.id, kind: this.kind, status: dto.status,
      completedImages: dto.progress.completedImages, totalImages: dto.progress.totalImages,
      images: dto.images.map(image => ({ ...image })).sort((a, b) => a.position - b.position),
      issue: dto.issue ? { ...dto.issue } : null,
      disclaimer: dto.freshnessDisclaimer ?? null,
      identityDecisionRequired: dto.identityDecisionRequired === true,
      reviewDecision: dto.receiptReviewDecision ?? null,
      notices: (dto.notices ?? []).map(notice => notice.message).filter(message => message.length > 0),
      excludedItems: (dto.excludedItems ?? []).map(item => ({ id: item.id, name: item.name, lineText: item.lineText, reason: item.reason, confidence: item.confidence, version: item.version })),
      receipt: dto.receipt ? { merchant: dto.receipt.merchantName, purchasedAt: dto.receipt.purchasedAt, currency: dto.receipt.currency, total: dto.receipt.totalAmount } : null,
      candidates: dto.candidates.map(candidate => ({
        id: candidate.id, name: candidate.name,
        ingredient: candidate.ingredientSuggestion ? { ...candidate.ingredientSuggestion } : null,
        quantity: candidate.quantity.value, unit: candidate.quantity.unit,
        confidence: candidate.confidence, uncertainty: candidate.uncertaintyNote,
        freshness: candidate.freshnessObservation ?? null, status: candidate.status, version: candidate.version,
        lineText: candidate.lineText ?? null, unitPrice: candidate.pricing?.unitPrice ?? null,
        lineTotal: candidate.pricing?.lineTotal ?? null, currency: candidate.pricing?.currency ?? null,
        classification: candidate.aiClassification ?? null, classificationReason: candidate.classificationReason ?? null,
        duplicateOfJobId: candidate.duplicateOfJobId ?? null,
        imageIds: candidate.imageId ? [candidate.imageId] : [...new Set(candidate.evidence?.map(item => item.imageId) ?? [])],
      })),
    };
  }

  toCreateDto(input: ScanCreate): ScanCreateDto {
    return { imageAssetIds: [...input.assetIds], idempotencyKey: input.operationKey };
  }

  toEditDto(input: CandidateEdit): CandidateEditDto {
    const common: CandidateEditDto = {
      expectedVersion: input.expectedVersion, detectedName: input.name.trim(),
      ingredientId: input.ingredientId, quantity: input.quantity, unit: input.unit?.trim() || null,
      decision: input.decision,
    };
    if (this.kind === 'fridge') return { ...common, freshnessObservation: input.freshness?.trim() || null };
    return { ...common, ...(input.lineText !== undefined ? { lineText: input.lineText.trim() } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.lineTotal !== undefined ? { lineTotal: input.lineTotal } : {}),
      ...(input.currency !== undefined ? { currency: input.currency?.trim().toUpperCase() || null } : {}) };
  }

  toConfirmDto(input: ScanConfirm): ScanConfirmDto {
    return {
      candidates: input.candidates.map(candidate => ({ id: candidate.id, expectedVersion: candidate.version })), idempotencyKey: input.operationKey,
      ...(this.kind === 'receipt' && input.receiptReviewDecision ? { receiptReviewDecision: input.receiptReviewDecision } : {}),
    };
  }

  /** Khôi phục dòng hóa đơn bị loại: PATCH chỉ cần phiên bản + `decision: KEEP`, chưa đổi Tủ bếp. */
  toRestoreDto(version: number): ReceiptRestoreDto {
    return { expectedVersion: version, decision: 'KEEP' };
  }

  toRetryDto(operationKey: string): ScanRetryDto {
    return { idempotencyKey: operationKey };
  }

  toConfirmation(dto: ScanConfirmationDto | undefined): ScanConfirmation {
    if (!dto) throw new Error('Không nhận được xác nhận nhập tủ bếp.');
    return { job: this.toModel(dto.job), changes: dto.pantryChanges.map(change => ({
      candidateId: change.candidateId, action: change.action, itemId: change.pantryItem.id,
      name: change.pantryItem.ingredient?.name ?? change.pantryItem.unmatchedText ?? '',
      quantity: change.pantryItem.quantity, unit: change.pantryItem.unit,
    })), duplicateCount: dto.duplicateCandidates?.length ?? 0 };
  }
}

export const scanningMappers = { fridge: new ScanningMapper('fridge'), receipt: new ScanningMapper('receipt') };
