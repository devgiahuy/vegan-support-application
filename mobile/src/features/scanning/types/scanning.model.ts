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

export type ReceiptReviewDecision = 'SAME_RECEIPT' | 'SEPARATE_RECEIPTS';

/** Dòng hóa đơn AI cho là không phải thực phẩm nên không được nhập Tủ bếp trừ khi người dùng khôi phục. */
export interface ReceiptExcludedItem {
  id: string;
  name: string;
  lineText: string;
  reason: string;
  confidence: number;
  version: number;
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
  /** FOOD | READY_TO_EAT | NON_FOOD | UNCERTAIN; chỉ hóa đơn. */
  classification: string | null;
  classificationReason: string | null;
  /** Có giá trị khi dòng này đã nằm trong hóa đơn khác của bạn nên bị bỏ qua. */
  duplicateOfJobId: string | null;
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
  /** Chỉ hóa đơn: BE yêu cầu người dùng chọn "cùng hóa đơn" hay "hóa đơn riêng" trước khi xác nhận. */
  identityDecisionRequired: boolean;
  reviewDecision: ReceiptReviewDecision | null;
  notices: string[];
  excludedItems: ReceiptExcludedItem[];
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
  receiptReviewDecision?: ReceiptReviewDecision;
}

export interface ScanConfirmation {
  job: ScanJob;
  changes: { candidateId: string; action: 'CREATED' | 'UPDATED'; itemId: string; name: string; quantity: number; unit: string }[];
  /** Số dòng bị bỏ qua vì đã có trong hóa đơn khác (không cộng thêm vào Tủ bếp). */
  duplicateCount: number;
}

export function canEditScan(job: ScanJob): boolean {
  return job.status === 'READY' || job.status === 'PARTIAL_FAILED';
}

export function canSelectCandidate(candidate: ScanCandidate): boolean {
  return candidate.status !== 'REJECTED' && candidate.status !== 'CONFIRMED' &&
    candidate.quantity !== null && candidate.quantity > 0 && Boolean(candidate.unit?.trim());
}
