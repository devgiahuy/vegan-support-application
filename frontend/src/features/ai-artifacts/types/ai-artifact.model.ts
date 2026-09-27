/**
 * Clean UI Models cho AI Artifact (Phase 23).
 * Dữ liệu sạch, non-null, strongly-typed cho các components giao diện.
 */

import { AiArtifactStatus, AiArtifactType, AiArtifactVisibility } from '@/common/enums';
import type { AiVerification } from './ai-verification.model';

export interface NutrientSnapshot {
  code: string;
  name: string;
  amount: number;
  unit: string;
  origin: string;
  confidence: number;
  range: {
    min: number | null;
    max: number | null;
  };
}

export interface ChatAnswerContent {
  type: AiArtifactType.CHAT_ANSWER;
  answer: string;
}

export interface RecipeNutritionContent {
  type: AiArtifactType.RECIPE_NUTRITION;
  recipe: {
    title: string;
    servings: number;
  };
  totals: {
    rawGrams: number;
    cookedGrams: number;
  };
  perServingNutrients: NutrientSnapshot[];
  confidence: number;
  disclaimer: string;
}

export interface RecognitionItem {
  name: string;
  quantity: {
    value: number | null;
    unit: string | null;
  };
  confidence: number;
  status: string;
}

export interface FridgeRecognitionContent {
  type: AiArtifactType.FRIDGE_RECOGNITION;
  items: RecognitionItem[];
}

export interface ReceiptExtractionContent {
  type: AiArtifactType.RECEIPT_EXTRACTION;
  items: RecognitionItem[];
}

export type AiArtifactContent =
  ChatAnswerContent | RecipeNutritionContent | FridgeRecognitionContent | ReceiptExtractionContent;

export interface AiArtifactAuthor {
  name: string;
  anonymous: boolean;
}

export interface AiArtifactLifecycle {
  status: AiArtifactStatus;
  visibility: AiArtifactVisibility;
  version: number;
  submittedAt: string | null;
  sharedAt: string | null;
}

export interface AiArtifact {
  id: string;
  type: AiArtifactType;
  version: number;
  title: string;
  summary: string;
  content: AiArtifactContent;
  author: AiArtifactAuthor;
  lifecycle: AiArtifactLifecycle;
  activeVerification: AiVerification | null;
  verificationHistory: AiVerification[];
  createdAt: string;
  // UI Presentation helpers
  isPublic: boolean;
  isSubmitted: boolean;
  isVerified: boolean;
  typeLabel: string;
}

export interface PublicAiArtifactsQuery {
  page?: number;
  limit?: number;
  type?: AiArtifactType;
}
