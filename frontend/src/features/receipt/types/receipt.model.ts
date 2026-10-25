/**
 * Clean UI Models for Receipt Analysis (Phase 22).
 * Formatted for user consumption with Vietnamese labels and helper properties.
 */

export type ReceiptJobStatus =
  'QUEUED' | 'PROCESSING' | 'READY' | 'PARTIAL_FAILED' | 'FAILED' | 'CONFIRMED' | 'CANCELLED';

export type ReceiptCandidateStatus = 'PROPOSED' | 'EDITED' | 'REJECTED' | 'CONFIRMED';

export type ReceiptInputStatus = 'PENDING' | 'PROCESSED' | 'FAILED';
export type ReceiptItemClassification = 'FOOD' | 'READY_TO_EAT' | 'NON_FOOD' | 'UNCERTAIN';
export type ReceiptReviewDecision = 'SAME_RECEIPT' | 'SEPARATE_RECEIPTS';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface ReceiptImage {
  id: string;
  position: number;
  url: string;
  status: ReceiptInputStatus;
  statusLabel: string;
  receiptNumber: string | null;
  merchantName: string | null;
  purchasedAt: Date | null;
  currency: string | null;
  totalAmount: number | null;
  issue: string | null;
}

export interface ReceiptNotice {
  code: 'RECEIPT_NON_FOOD_ITEMS_EXCLUDED';
  message: string;
  count: number;
}

export interface ReceiptExcludedItem {
  id: string;
  imageId: string;
  lineText: string;
  name: string;
  reason: string;
  confidencePercent: number;
  version: number;
}

export interface ReceiptCandidatePricing {
  unitPrice: number | null;
  lineTotal: number | null;
  currency: string;
  formattedUnitPrice: string;
  formattedLineTotal: string;
}

export interface ReceiptIngredientSuggestion {
  id: string;
  name: string;
  confidence: number;
  confidencePercent: number;
  isHighConfidence: boolean;
}

export interface ReceiptCandidateQuantity {
  value: number | null;
  unit: string | null;
  formatted: string;
}

export interface ReceiptCandidate {
  id: string;
  imageId: string;
  lineText: string;
  name: string;
  ingredientSuggestion: ReceiptIngredientSuggestion | null;
  quantity: ReceiptCandidateQuantity;
  pricing: ReceiptCandidatePricing;
  confidence: number;
  confidencePercent: number;
  confidenceTier: ConfidenceTier;
  uncertaintyNote: string | null;
  aiClassification: ReceiptItemClassification;
  classificationReason: string | null;
  classificationConfidencePercent: number | null;
  status: ReceiptCandidateStatus;
  statusLabel: string;
  isRejected: boolean;
  isEdited: boolean;
  isConfirmed: boolean;
  duplicateOfJobId: string | null;
  version: number;
}

export interface ReceiptJobMetadata {
  merchantName: string;
  purchasedAt: Date | null;
  formattedDate: string;
  currency: string;
  totalAmount: number | null;
  formattedTotalAmount: string;
  confidence: number | null;
  confidencePercent: number | null;
}

export interface ReceiptJobProgress {
  completedImages: number;
  totalImages: number;
  percent: number;
}

export interface ReceiptJobIssue {
  code: string;
  message: string;
}

export interface ReceiptJob {
  id: string;
  status: ReceiptJobStatus;
  statusLabel: string;
  statusBadgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  reviewRequired: boolean;
  identityDecisionRequired: boolean;
  receiptReviewDecision: ReceiptReviewDecision | null;
  notices: ReceiptNotice[];
  excludedItems: ReceiptExcludedItem[];
  progress: ReceiptJobProgress;
  receiptMetadata: ReceiptJobMetadata;
  images: ReceiptImage[];
  candidates: ReceiptCandidate[];
  activeCandidates: ReceiptCandidate[];
  rejectedCandidates: ReceiptCandidate[];
  attempt: number;
  issue: ReceiptJobIssue | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  completedAt: Date | null;
  confirmedAt: Date | null;
  isProcessing: boolean;
  isReadyForReview: boolean;
  isConfirmed: boolean;
  isCancelled: boolean;
  isFailed: boolean;
  canConfirm: boolean;
  canRetry: boolean;
  canCancel: boolean;
  canAddImages: boolean;
}

export type ReceiptErrorCode =
  | 'RECEIPT_IMAGE_LIMIT_EXCEEDED'
  | 'RECEIPT_STATE_CONFLICT'
  | 'RECEIPT_NOT_FOUND'
  | 'RECEIPT_CANDIDATE_NOT_FOUND'
  | 'RECEIPT_CANDIDATE_VERSION_CONFLICT';

export const RECEIPT_ERROR_MESSAGES: Record<string, string> = {
  RECEIPT_IMAGE_LIMIT_EXCEEDED: 'Phiên quét hóa đơn chỉ cho phép tối đa 4 ảnh.',
  RECEIPT_STATE_CONFLICT:
    'Phiên quét đang trong quá trình xử lý. Vui lòng chờ hoàn tất trước khi bổ sung thêm ảnh.',
};

export interface ReceiptConfirmationPantryItem {
  id: string;
  ingredientId: string | null;
  ingredientName: string | null;
  unmatchedText: string | null;
  displayName: string;
  quantity: number;
  unit: string;
  formattedQuantity: string;
  source: string;
  confidencePercent: number;
  confirmationStatus: 'CONFIRMED';
  purchasedAt: Date | null;
  version: number;
}

export interface ReceiptPantryChange {
  candidateId: string;
  action: 'CREATED' | 'UPDATED';
  actionLabel: string;
  pantryItem: ReceiptConfirmationPantryItem;
}

export interface ReceiptConfirmationDiff {
  job: ReceiptJob;
  duplicateCandidates: ReceiptDuplicateCandidate[];
  pantryChanges: ReceiptPantryChange[];
}

export interface ReceiptDuplicateCandidate {
  candidateId: string;
  sourceJobId: string;
}

export interface CreateReceiptJobInput {
  imageAssetIds: string[];
  idempotencyKey?: string;
}

export interface UpdateReceiptCandidateInput {
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

export interface ConfirmReceiptJobInput {
  candidates: {
    id: string;
    expectedVersion: number;
  }[];
  receiptReviewDecision?: ReceiptReviewDecision;
  idempotencyKey?: string;
}
