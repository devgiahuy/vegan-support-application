/**
 * DTOs thô từ backend cho tính năng Nhận diện thực phẩm tủ lạnh qua ảnh (Phase 21).
 * Khớp 100% với backend OpenAPI và schemas tại backend/src/modules/ingredient-recognition/
 */

export type RecognitionJobStatusDto =
  'QUEUED' | 'PROCESSING' | 'READY' | 'PARTIAL_FAILED' | 'FAILED' | 'CONFIRMED' | 'CANCELLED';

export type RecognitionInputStatusDto = 'PENDING' | 'PROCESSED' | 'FAILED';

export type RecognitionCandidateStatusDto = 'PROPOSED' | 'EDITED' | 'REJECTED' | 'CONFIRMED';

export type RecognitionCandidateDecisionDto = 'KEEP' | 'REJECT';

export interface RecognitionImageDto {
  id: string;
  position: number;
  url: string;
  status: RecognitionInputStatusDto;
  issue: string | null;
}

export interface RecognitionCandidateEvidenceDto {
  imageId: string;
  imagePosition: number;
  confidence: number;
}

export interface RecognitionIngredientSuggestionDto {
  id: string;
  name: string;
  confidence: number;
}

export interface RecognitionCandidateQuantityDto {
  value: number | null;
  unit: string | null;
}

export interface RecognitionCandidateDto {
  id: string;
  name: string;
  ingredientSuggestion: RecognitionIngredientSuggestionDto | null;
  quantity: RecognitionCandidateQuantityDto;
  freshnessObservation: string | null;
  confidence: number;
  uncertaintyNote: string | null;
  status: RecognitionCandidateStatusDto;
  version: number;
  evidence: RecognitionCandidateEvidenceDto[];
}

export interface RecognitionJobProgressDto {
  completedImages: number;
  totalImages: number;
}

export interface RecognitionJobIssueDto {
  code: string;
  message: string;
}

export interface RecognitionJobResponseDto {
  id: string;
  status: RecognitionJobStatusDto;
  progress: RecognitionJobProgressDto;
  images: RecognitionImageDto[];
  candidates: RecognitionCandidateDto[];
  attempt: number;
  issue: RecognitionJobIssueDto | null;
  freshnessDisclaimer: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  confirmedAt: string | null;
}

export interface CreateRecognitionJobReqDto {
  imageAssetIds: string[];
  idempotencyKey: string;
}

export interface UpdateRecognitionCandidateReqDto {
  expectedVersion: number;
  ingredientId?: string | null;
  detectedName?: string;
  quantity?: number | null;
  unit?: string | null;
  freshnessObservation?: string | null;
  confidence?: number;
  decision?: RecognitionCandidateDecisionDto;
}

export interface ConfirmRecognitionJobCandidateDto {
  id: string;
  expectedVersion: number;
}

export interface ConfirmRecognitionJobReqDto {
  candidates: ConfirmRecognitionJobCandidateDto[];
  idempotencyKey: string;
}

export interface RetryRecognitionJobReqDto {
  idempotencyKey: string;
}

export interface RecognitionConfirmedPantryItemDto {
  id: string;
  ingredient: { id: string; name: string } | null;
  unmatchedText: string | null;
  quantity: number;
  unit: string;
  source: string;
  confidence: number;
  confirmationStatus: 'CONFIRMED';
  version: number;
}

export interface RecognitionPantryChangeDto {
  candidateId: string;
  action: 'CREATED' | 'UPDATED';
  pantryItem: RecognitionConfirmedPantryItemDto;
}

export interface RecognitionConfirmationResponseDto {
  job: RecognitionJobResponseDto;
  pantryChanges: RecognitionPantryChangeDto[];
}

export interface RecognitionJobEnvelopeDto {
  success: true;
  data: RecognitionJobResponseDto;
}

export interface RecognitionConfirmationEnvelopeDto {
  success: true;
  data: RecognitionConfirmationResponseDto;
}
