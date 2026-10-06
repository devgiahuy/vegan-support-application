export type ScanKind = 'fridge' | 'receipt';
export type ScanStatus = 'QUEUED' | 'PROCESSING' | 'READY' | 'PARTIAL_FAILED' | 'FAILED' | 'CONFIRMED' | 'CANCELLED';
export type CandidateStatus = 'PROPOSED' | 'EDITED' | 'REJECTED' | 'CONFIRMED';

export interface ScanImage {
  id: string;
  position: number;
  url: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  issue: string | null;
}

export interface ScanCandidate {
  id: string;
  name: string;
  ingredient: { id: string; name: string; confidence: number } | null;
  quantity: number | null;
  unit: string | null;
  confidence: number;
  uncertainty: string | null;
  freshness: string | null;
  status: CandidateStatus;
  version: number;
  lineText: string | null;
  unitPrice: number | null;
  lineTotal: number | null;
  currency: string | null;
  imageIds: string[];
}

export interface ScanJob {
  id: string;
  kind: ScanKind;
  status: ScanStatus;
  completedImages: number;
  totalImages: number;
  images: ScanImage[];
  candidates: ScanCandidate[];
  issue: { code: string; message: string } | null;
  disclaimer: string | null;
  receipt: { merchant: string | null; purchasedAt: string | null; currency: string | null; total: number | null } | null;
}

export interface CandidateEdit {
  expectedVersion: number;
  name: string;
  ingredientId: string | null;
  quantity: number | null;
  unit: string | null;
  freshness?: string | null;
  lineText?: string;
  unitPrice?: number | null;
  lineTotal?: number | null;
  currency?: string | null;
  decision: 'KEEP' | 'REJECT';
}

export interface ScanCreate {
  assetIds: string[];
  operationKey: string;
}

export interface ScanConfirm {
  candidates: { id: string; version: number }[];
  operationKey: string;
}

export interface ScanConfirmation {
  job: ScanJob;
  changes: { candidateId: string; action: 'CREATED' | 'UPDATED'; itemId: string; name: string; quantity: number; unit: string }[];
}

export function canEditScan(job: ScanJob): boolean {
  return job.status === 'READY' || job.status === 'PARTIAL_FAILED';
}

export function canSelectCandidate(candidate: ScanCandidate): boolean {
  return candidate.status !== 'REJECTED' && candidate.status !== 'CONFIRMED' &&
    candidate.quantity !== null && candidate.quantity > 0 && Boolean(candidate.unit?.trim());
}
