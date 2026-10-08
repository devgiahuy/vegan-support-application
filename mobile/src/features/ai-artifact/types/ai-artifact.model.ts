import type {
  AiArtifactStatus,
  AiArtifactType,
  AiArtifactVisibility,
  AiVerificationConclusion,
  AiVerificationStatus,
} from '@/common/enums';

export interface AiVerification {
  id: string;
  artifactVersion: number;
  conclusion: AiVerificationConclusion;
  conclusionLabel: string;
  scope: string;
  evidenceNote: string;
  correction: string | null;
  status: AiVerificationStatus;
  reviewerName: string;
  reviewerRoleLabel: string;
  createdAtLabel: string;
}

export interface NutrientSnapshot {
  code: string;
  name: string;
  amount: number;
  unit: string;
  confidencePercent: number;
  rangeLabel: string | null;
}

export interface RecognitionItem {
  name: string;
  quantityLabel: string;
  statusLabel: string;
  confidencePercent: number;
}

export type AiArtifactContent =
  | { type: AiArtifactType.CHAT_ANSWER; answer: string }
  | {
      type: AiArtifactType.RECIPE_NUTRITION;
      recipeTitle: string;
      servings: number;
      rawGrams: number;
      cookedGrams: number;
      nutrients: NutrientSnapshot[];
      confidencePercent: number;
      disclaimer: string;
    }
  | { type: AiArtifactType.FRIDGE_RECOGNITION; items: RecognitionItem[] }
  | { type: AiArtifactType.RECEIPT_EXTRACTION; items: RecognitionItem[] };

export interface AiArtifact {
  id: string;
  type: AiArtifactType;
  typeLabel: string;
  /** Phiên bản nội dung — dùng làm `expectedArtifactVersion` khi thẩm định. */
  version: number;
  title: string;
  summary: string;
  content: AiArtifactContent;
  authorName: string;
  status: AiArtifactStatus;
  visibility: AiArtifactVisibility;
  /** Phiên bản vòng đời — dùng làm `expectedLifecycleVersion` khi chia sẻ/gửi thẩm định. */
  lifecycleVersion: number;
  isPublic: boolean;
  isSubmitted: boolean;
  activeVerification: AiVerification | null;
  verificationHistory: AiVerification[];
  createdAtLabel: string;
}

export interface AiArtifactListResult {
  items: AiArtifact[];
  page: number;
  total: number;
  totalPages: number;
}

export interface CreateAiArtifactInput {
  type: AiArtifactType;
  sourceId: string;
  title: string;
  summary: string;
  authorAnonymous: boolean;
}

export interface PublicAiArtifactsQuery {
  type?: AiArtifactType;
  page?: number;
  limit?: number;
}
