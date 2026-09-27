/**
 * Raw DTOs cho AI Verification từ Backend (Phase 23).
 */

import type { AiArtifactDto } from './ai-artifact.dto';

export interface AiReviewerDto {
  name?: string;
  role?: string;
}

export interface AiVerificationSupersedesDto {
  verificationId?: string;
}

export interface AiVerificationDto {
  id?: string;
  artifactVersion?: number;
  conclusion?: string;
  scope?: string;
  evidenceNote?: string;
  correction?: string | null;
  status?: string;
  reviewer?: AiReviewerDto;
  version?: number;
  supersedes?: AiVerificationSupersedesDto | null;
  createdAt?: string;
}

export interface CreateAiVerificationRequestDto {
  expectedArtifactVersion: number;
  conclusion: string;
  scope: string;
  evidenceNote: string;
  correction?: string | null;
}

export interface AdminAiVerificationActionRequestDto {
  action: 'OVERRIDE' | 'REVOKE';
  expectedVersion: number;
  reason: string;
  conclusion?: string;
  scope?: string;
  evidenceNote?: string;
  correction?: string | null;
}

export interface AiVerificationEnvelopeDto {
  success: boolean;
  data: {
    artifact: AiArtifactDto;
    verification: AiVerificationDto;
  };
}
