import type { CandidateStatus, ScanStatus } from './scanning.model';

export interface ScanCandidateDto {
  id: string;
  name: string;
  ingredientSuggestion: { id: string; name: string; confidence: number } | null;
  quantity: { value: number | null; unit: string | null };
  confidence: number;
  uncertaintyNote: string | null;
  status: CandidateStatus;
  version: number;
  freshnessObservation?: string | null;
  evidence?: { imageId: string; imagePosition: number; confidence: number }[];
  imageId?: string;
  lineText?: string;
  pricing?: { unitPrice: number | null; lineTotal: number | null; currency: string | null };
}

export interface ScanJobDto {
  id: string;
  status: ScanStatus;
  progress: { completedImages: number; totalImages: number };
  images: { id: string; position: number; url: string; status: 'PENDING' | 'PROCESSED' | 'FAILED'; issue: string | null }[];
  candidates: ScanCandidateDto[];
  issue: { code: string; message: string } | null;
  freshnessDisclaimer?: string;
  receipt?: { merchantName: string | null; purchasedAt: string | null; currency: string | null; totalAmount: number | null; confidence: number | null };
}

export interface ScanCreateDto { imageAssetIds: string[]; idempotencyKey: string }
export interface ScanConfirmDto { candidates: { id: string; expectedVersion: number }[]; idempotencyKey: string }
export interface ScanRetryDto { idempotencyKey: string }
export interface CandidateEditDto {
  expectedVersion: number;
  detectedName: string;
  ingredientId: string | null;
  quantity: number | null;
  unit: string | null;
  decision: 'KEEP' | 'REJECT';
  freshnessObservation?: string | null;
  lineText?: string;
  unitPrice?: number | null;
  lineTotal?: number | null;
  currency?: string | null;
}
export interface ScanConfirmationDto {
  job: ScanJobDto;
  pantryChanges: { candidateId: string; action: 'CREATED' | 'UPDATED'; pantryItem: { id: string; ingredient: { id: string; name: string } | null; unmatchedText: string | null; quantity: number; unit: string } }[];
}
