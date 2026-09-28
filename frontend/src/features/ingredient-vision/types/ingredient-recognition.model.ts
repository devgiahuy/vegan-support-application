/**
 * UI Models sạch cho tính năng Nhận diện thực phẩm tủ lạnh qua ảnh (Phase 21).
 * UI components CHỈ tiêu thụ các models này, không dùng DTO thô.
 */

export type RecognitionJobStatus =
  'QUEUED' | 'PROCESSING' | 'READY' | 'PARTIAL_FAILED' | 'FAILED' | 'CONFIRMED' | 'CANCELLED';

export type RecognitionInputStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export type RecognitionCandidateStatus = 'PROPOSED' | 'EDITED' | 'REJECTED' | 'CONFIRMED';

export type RecognitionCandidateDecision = 'KEEP' | 'REJECT';

export interface RecognitionCandidateEvidence {
  imageId: string;
  imagePosition: number;
  confidencePercent: number;
}

export interface RecognitionIngredientSuggestion {
  id: string;
  name: string;
  confidencePercent: number;
  isHighConfidence: boolean;
}

export interface RecognitionCandidateQuantity {
  value: number | null;
  unit: string | null;
  formatted: string;
}

export interface RecognitionCandidate {
  id: string;
  name: string;
  ingredientSuggestion: RecognitionIngredientSuggestion | null;
  quantity: RecognitionCandidateQuantity;
  freshnessObservation: string | null;
  confidence: number;
  confidencePercent: number;
  confidenceTier: 'high' | 'medium' | 'low';
  uncertaintyNote: string | null;
  status: RecognitionCandidateStatus;
  isRejected: boolean;
  isEdited: boolean;
  version: number;
  evidence: RecognitionCandidateEvidence[];
}

export interface RecognitionImage {
  id: string;
  position: number;
  url: string;
  status: RecognitionInputStatus;
  issue: string | null;
}

export interface RecognitionJobProgress {
  completedImages: number;
  totalImages: number;
  percent: number;
}

export interface RecognitionJobIssue {
  code: string;
  message: string;
}

export interface RecognitionJob {
  id: string;
  status: RecognitionJobStatus;
  statusLabel: string;
  statusBadgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  progress: RecognitionJobProgress;
  images: RecognitionImage[];
  candidates: RecognitionCandidate[];
  proposedCandidatesCount: number;
  rejectedCandidatesCount: number;
  attempt: number;
  issue: RecognitionJobIssue | null;
  freshnessDisclaimer: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  completedAt: Date | null;
  confirmedAt: Date | null;
  isProcessing: boolean;
  isReadyForReview: boolean;
  isConfirmed: boolean;
  isCancelled: boolean;
  isFailed: boolean;
  canRetry: boolean;
  canConfirm: boolean;
}

export interface RecognitionConfirmedPantryItem {
  id: string;
  ingredient: { id: string; name: string } | null;
  unmatchedText: string | null;
  quantity: number;
  unit: string;
  source: string;
  confidence: number;
  confirmationStatus: string;
  version: number;
}

export interface RecognitionPantryChange {
  candidateId: string;
  action: 'CREATED' | 'UPDATED';
  actionLabel: string;
  pantryItem: RecognitionConfirmedPantryItem;
}

export interface RecognitionConfirmationDiff {
  job: RecognitionJob;
  pantryChanges: RecognitionPantryChange[];
}

export interface UpdateCandidateInput {
  expectedVersion: number;
  ingredientId?: string | null;
  detectedName?: string;
  quantity?: number | null;
  unit?: string | null;
  freshnessObservation?: string | null;
  confidence?: number;
  decision?: RecognitionCandidateDecision;
}
