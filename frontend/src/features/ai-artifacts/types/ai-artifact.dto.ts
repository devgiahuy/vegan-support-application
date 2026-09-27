/**
 * Raw DTOs cho AI Artifact từ Backend (Phase 23).
 * Mọi field từ DTO đều chấp nhận undefined/biến thể để đảm bảo an toàn tại tầng Mapper.
 */

import type { AiVerificationDto } from './ai-verification.dto';
export type { AiVerificationDto };

export interface NutrientSnapshotDto {
  code?: string;
  name?: string;
  amount?: number;
  unit?: string;
  origin?: string;
  confidence?: number;
  range?: {
    min?: number | null;
    max?: number | null;
  };
}

export interface ChatAnswerContentDto {
  type: 'CHAT_ANSWER';
  answer?: string;
}

export interface RecipeNutritionContentDto {
  type: 'RECIPE_NUTRITION';
  recipe?: {
    title?: string;
    servings?: number;
  };
  totals?: {
    rawGrams?: number;
    cookedGrams?: number;
  };
  perServingNutrients?: NutrientSnapshotDto[];
  confidence?: number;
  disclaimer?: string;
}

export interface RecognitionItemDto {
  name?: string;
  quantity?: {
    value?: number | null;
    unit?: string | null;
  };
  confidence?: number;
  status?: string;
}

export interface FridgeRecognitionContentDto {
  type: 'FRIDGE_RECOGNITION';
  items?: RecognitionItemDto[];
}

export interface ReceiptExtractionContentDto {
  type: 'RECEIPT_EXTRACTION';
  items?: RecognitionItemDto[];
}

export type AiArtifactContentDto =
  | ChatAnswerContentDto
  | RecipeNutritionContentDto
  | FridgeRecognitionContentDto
  | ReceiptExtractionContentDto;

export interface AiArtifactAuthorDto {
  name?: string;
  anonymous?: boolean;
}

export interface AiArtifactLifecycleDto {
  status?: string;
  visibility?: string;
  version?: number;
  submittedAt?: string | null;
  sharedAt?: string | null;
}

export interface AiArtifactDto {
  id?: string;
  type?: string;
  version?: number;
  title?: string;
  summary?: string;
  content?: AiArtifactContentDto;
  author?: AiArtifactAuthorDto;
  lifecycle?: AiArtifactLifecycleDto;
  activeVerification?: AiVerificationDto | null;
  verificationHistory?: AiVerificationDto[];
  createdAt?: string;
}

export interface CreateAiArtifactRequestDto {
  type: string;
  sourceId: string;
  title: string;
  summary: string;
  authorAnonymous?: boolean;
}

export interface UpdateAiArtifactVisibilityRequestDto {
  visibility: string;
  expectedLifecycleVersion: number;
}

export interface SubmitAiArtifactRequestDto {
  expectedLifecycleVersion: number;
}

export interface PublicAiArtifactsQueryDto {
  page?: number;
  limit?: number;
  type?: string;
}

export interface AiArtifactEnvelopeDto {
  success: boolean;
  data: AiArtifactDto;
}

export interface PublicAiArtifactListResponseDto {
  success: boolean;
  data: AiArtifactDto[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  } | null;
}
