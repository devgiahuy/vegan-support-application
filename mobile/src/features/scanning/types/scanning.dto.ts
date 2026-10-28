import type { CandidateStatus, ScanStatus } from './scanning.model';

export type ReceiptReviewDecisionDto = 'SAME_RECEIPT' | 'SEPARATE_RECEIPTS';

/** Dòng bị AI loại vì không phải thực phẩm; chỉ khôi phục được bằng PATCH `decision: 'KEEP'`. */
export interface ReceiptExcludedItemDto {
  id: string;
  imageId: string;
  lineText: string;
  name: string;
  reason: string;
  confidence: number;
  version: number;
}

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
  /** Chỉ hóa đơn. */
  aiClassification?: string;
  classificationReason?: string | null;
  duplicateOfJobId?: string | null;
}

export interface ScanJobDto {
  id: string;
  status: ScanStatus;
  progress: { completedImages: number; totalImages: number };
  images: {
    id: string; position: number; url: string; status: 'PENDING' | 'PROCESSED' | 'FAILED'; issue: string | null;
    receiptNumber?: string | null; merchantName?: string | null; purchasedAt?: string | null;
    currency?: string | null; totalAmount?: number | null;
  }[];
  candidates: ScanCandidateDto[];
  issue: { code: string; message: string } | null;
  freshnessDisclaimer?: string;
  /** Chỉ hóa đơn: bước kiểm tra danh tính hóa đơn và các dòng bị loại. */
  reviewRequired?: boolean;
  identityDecisionRequired?: boolean;
  receiptReviewDecision?: ReceiptReviewDecisionDto | null;
  notices?: { code: string; message: string; count: number }[];
  excludedItems?: ReceiptExcludedItemDto[];
  receipt?: { merchantName: string | null; purchasedAt: string | null; currency: string | null; totalAmount: number | null; confidence: number | null };
}

export interface ScanCreateDto { imageAssetIds: string[]; idempotencyKey: string }
export interface ScanConfirmDto {
  candidates: { id: string; expectedVersion: number }[];
  idempotencyKey: string;
  receiptReviewDecision?: ReceiptReviewDecisionDto;
}
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
/** PATCH khôi phục dòng đã bị loại: chỉ cần phiên bản và quyết định giữ lại. */
export interface ReceiptRestoreDto { expectedVersion: number; decision: 'KEEP' }
export interface ScanConfirmationDto {
  job: ScanJobDto;
  /** Dòng bị bỏ qua vì đã có trong hóa đơn khác của bạn (không cộng thêm vào Tủ bếp). */
  duplicateCandidates?: { candidateId: string; sourceJobId: string }[];
  pantryChanges: { candidateId: string; action: 'CREATED' | 'UPDATED'; pantryItem: { id: string; ingredient: { id: string; name: string } | null; unmatchedText: string | null; quantity: number; unit: string } }[];
}
