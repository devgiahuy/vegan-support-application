/**
 * Clean UI Models cho AI Verification (Phase 23).
 */

import {
  AiVerificationAdminActionType,
  AiVerificationConclusion,
  AiVerificationStatus,
  UserRole,
} from '@/common/enums';

export interface AiReviewer {
  name: string;
  role: UserRole.CONTRIBUTOR | UserRole.ADMIN;
  roleLabel: string;
}

export interface AiVerification {
  id: string;
  artifactVersion: number;
  conclusion: AiVerificationConclusion;
  conclusionLabel: string;
  scope: string;
  evidenceNote: string;
  correction: string | null;
  status: AiVerificationStatus;
  reviewer: AiReviewer;
  version: number;
  supersedesVerificationId: string | null;
  createdAt: string;
  // UI helpers
  isActive: boolean;
  isSuperseded: boolean;
  isRevoked: boolean;
}

export interface CreateAiVerificationInput {
  expectedArtifactVersion: number;
  conclusion: AiVerificationConclusion;
  scope: string;
  evidenceNote: string;
  correction?: string | null;
}

export interface AdminAiVerificationActionInput {
  action: AiVerificationAdminActionType;
  expectedVersion: number;
  reason: string;
  conclusion?: AiVerificationConclusion;
  scope?: string;
  evidenceNote?: string;
  correction?: string | null;
}
