/**
 * Raw Backend Data Transfer Objects (DTO) for Receipt Analysis (Phase 22).
 * Strictly mapped from backend/src/modules/receipts/receipt.schemas.ts.
 */

export type ReceiptJobStatusDto =
  'QUEUED' | 'PROCESSING' | 'READY' | 'PARTIAL_FAILED' | 'FAILED' | 'CONFIRMED' | 'CANCELLED';

export type ReceiptCandidateStatusDto = 'PROPOSED' | 'EDITED' | 'REJECTED' | 'CONFIRMED';

export type ReceiptInputStatusDto = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface ReceiptImageDto {
  id: string;
  position: number;
  url: string;
  status: ReceiptInputStatusDto;
  /** Additive fields may be absent while an older Phase 22 server is still deployed. */
  receiptNumber?: string | null;
  merchantName?: string | null;
  purchasedAt?: string | null;
  currency?: string | null;
  totalAmount?: number | null;
  issue: string | null;
}

export type ReceiptItemClassificationDto = 'FOOD' | 'READY_TO_EAT' | 'NON_FOOD' | 'UNCERTAIN';
export type ReceiptReviewDecisionDto = 'SAME_RECEIPT' | 'SEPARATE_RECEIPTS';

export interface ReceiptNoticeDto {
  code: 'RECEIPT_NON_FOOD_ITEMS_EXCLUDED';
  message: string;
  count: number;
}

export interface ReceiptExcludedItemDto {
  id: string;
  imageId: string;
  lineText: string;
  name: string;
  reason: string;
  confidence: number;
  version: number;
}

export interface ReceiptCandidatePricingDto {
  unitPrice: number | null;
  lineTotal: number | null;
  currency: string | null;
}

export interface ReceiptIngredientSuggestionDto {
  id: string;
  name: string;
  confidence: number;
}

export interface ReceiptCandidateQuantityDto {
  value: number | null;
  unit: string | null;
}

export interface ReceiptCandidateDto {
  id: string;
  imageId: string;
  lineText: string;
  name: string;
  ingredientSuggestion: ReceiptIngredientSuggestionDto | null;
  quantity: ReceiptCandidateQuantityDto;
  pricing: ReceiptCandidatePricingDto;
  confidence: number;
  uncertaintyNote: string | null;
  aiClassification?: ReceiptItemClassificationDto;
  classificationReason?: string | null;
  classificationConfidence?: number | null;
  status: ReceiptCandidateStatusDto;
  duplicateOfJobId?: string | null;
  version: number;
}

export interface ReceiptJobMetadataDto {
  merchantName: string | null;
  purchasedAt: string | null;
  currency: string | null;
  totalAmount: number | null;
  confidence: number | null;
}

export interface ReceiptJobProgressDto {
  completedImages: number;
  totalImages: number;
}

export interface ReceiptJobIssueDto {
  code: string;
  message: string;
}

export interface ReceiptJobResponseDto {
  id: string;
  status: ReceiptJobStatusDto;
  /** Additive receipt review fields are optional for compatibility with pre-migration jobs. */
  reviewRequired?: boolean;
  identityDecisionRequired?: boolean;
  receiptReviewDecision?: ReceiptReviewDecisionDto | null;
  notices?: ReceiptNoticeDto[];
  excludedItems?: ReceiptExcludedItemDto[];
  progress: ReceiptJobProgressDto;
  receipt: ReceiptJobMetadataDto;
  images: ReceiptImageDto[];
  candidates: ReceiptCandidateDto[];
  attempt: number;
  issue: ReceiptJobIssueDto | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  confirmedAt: string | null;
}

export interface CreateReceiptJobReqDto {
  imageAssetIds: string[];
  idempotencyKey: string;
}

export interface UpdateReceiptCandidateReqDto {
  expectedVersion: number;
  ingredientId?: string | null;
  detectedName?: string;
  lineText?: string;
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  currency?: string | null;
  confidence?: number;
  uncertaintyNote?: string | null;
  decision?: 'KEEP' | 'REJECT';
}

export interface ConfirmReceiptJobCandidateItemDto {
  id: string;
  expectedVersion: number;
}

export interface ConfirmReceiptJobReqDto {
  candidates: ConfirmReceiptJobCandidateItemDto[];
  receiptReviewDecision?: ReceiptReviewDecisionDto;
  idempotencyKey: string;
}

export interface RetryReceiptJobReqDto {
  idempotencyKey: string;
}

export interface ReceiptConfirmationPantryItemDto {
  id: string;
  ingredient: {
    id: string;
    name: string;
  } | null;
  unmatchedText: string | null;
  quantity: number;
  unit: string;
  source: string;
  confidence: number;
  confirmationStatus: 'CONFIRMED';
  purchasedAt: string | null;
  version: number;
}

export interface ReceiptPantryChangeDto {
  candidateId: string;
  action: 'CREATED' | 'UPDATED';
  pantryItem: ReceiptConfirmationPantryItemDto;
}

export interface ReceiptDuplicateCandidateDto {
  candidateId: string;
  sourceJobId: string;
}

export interface ReceiptConfirmationResponseDto {
  job: ReceiptJobResponseDto;
  duplicateCandidates?: ReceiptDuplicateCandidateDto[];
  pantryChanges: ReceiptPantryChangeDto[];
}

export interface ReceiptJobEnvelopeDto {
  success: true;
  data: ReceiptJobResponseDto;
}

export interface ReceiptConfirmationEnvelopeDto {
  success: true;
  data: ReceiptConfirmationResponseDto;
}

export interface AddReceiptImagesRequestDto {
  imageAssetIds: string[];
}
