/**
 * Clean UI Models for Receipt Analysis (Phase 22).
 * Formatted for user consumption with Vietnamese labels and helper properties.
 */

export type ReceiptJobStatus =
  'QUEUED' | 'PROCESSING' | 'READY' | 'PARTIAL_FAILED' | 'FAILED' | 'CONFIRMED' | 'CANCELLED';

export type ReceiptCandidateStatus = 'PROPOSED' | 'EDITED' | 'REJECTED' | 'CONFIRMED';

export type ReceiptInputStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface ReceiptImage {
  id: string;
  position: number;
  url: string;
  status: ReceiptInputStatus;
  statusLabel: string;
  issue: string | null;
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
  status: ReceiptCandidateStatus;
  statusLabel: string;
  isRejected: boolean;
  isEdited: boolean;
  isConfirmed: boolean;
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
}

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
  pantryChanges: ReceiptPantryChange[];
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
  idempotencyKey?: string;
}
