/**
 * DTO thô của AI Artifact theo OpenAPI (`AiArtifactResponse`, `PublicAiArtifactListResponse`,
 * `AiVerificationResponse`). Mọi trường đều optional để mapper tự phòng thủ.
 */

export interface AiVerificationDto {
  id?: string;
  artifactVersion?: number;
  conclusion?: string;
  scope?: string;
  evidenceNote?: string;
  correction?: string | null;
  status?: string;
  reviewer?: { name?: string; role?: string };
  version?: number;
  supersedes?: { verificationId?: string } | null;
  createdAt?: string;
}

export interface NutrientSnapshotDto {
  code?: string;
  name?: string;
  amount?: number;
  unit?: string;
  origin?: string;
  confidence?: number;
  range?: { min?: number | null; max?: number | null };
}

export interface RecognitionItemDto {
  name?: string;
  quantity?: { value?: number | null; unit?: string | null };
  confidence?: number;
  status?: string;
}

export interface AiArtifactContentDto {
  type?: string;
  answer?: string;
  recipe?: { title?: string; servings?: number };
  totals?: { rawGrams?: number; cookedGrams?: number };
  perServingNutrients?: NutrientSnapshotDto[];
  confidence?: number;
  disclaimer?: string;
  items?: RecognitionItemDto[];
}

export interface AiArtifactDto {
  id?: string;
  type?: string;
  version?: number;
  title?: string;
  summary?: string;
  content?: AiArtifactContentDto;
  author?: { name?: string; anonymous?: boolean };
  lifecycle?: {
    status?: string;
    visibility?: string;
    version?: number;
    submittedAt?: string | null;
    sharedAt?: string | null;
  };
  activeVerification?: AiVerificationDto | null;
  verificationHistory?: AiVerificationDto[];
  createdAt?: string;
}

export interface AiArtifactResponseDto {
  success?: boolean;
  data?: AiArtifactDto;
}

export interface PublicAiArtifactListResponseDto {
  success?: boolean;
  data?: AiArtifactDto[];
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

export interface CreateAiArtifactRequestDto {
  type: string;
  sourceId: string;
  title: string;
  summary: string;
  authorAnonymous: boolean;
}

export interface UpdateAiArtifactVisibilityRequestDto {
  visibility: 'PRIVATE' | 'PUBLIC';
  expectedLifecycleVersion: number;
}

export interface SubmitAiArtifactRequestDto {
  expectedLifecycleVersion: number;
}
