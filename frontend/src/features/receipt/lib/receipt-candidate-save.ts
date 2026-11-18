import type { ReceiptJob } from '../types/receipt.model';

export interface ReceiptCandidateSaveDraft {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  isRejected: boolean;
  version: number;
  ingredientId: string | null;
  initialName: string;
  initialQuantity: string;
  initialUnit: string;
  initialIsRejected: boolean;
}

/**
 * Selects only kept (non-rejected) receipt candidates that have local changes compared to server state.
 *
 * Rejected candidates do not need individual PATCH calls before POST /confirm because
 * the backend confirm transaction automatically marks all non-selected PROPOSED/EDITED
 * candidates as REJECTED.
 */
export function getReceiptCandidatesToPatchBeforeConfirm<T extends ReceiptCandidateSaveDraft>(
  items: T[]
): T[] {
  return items.filter((item) => {
    if (item.isRejected) return false;

    const isNameChanged = item.name.trim() !== item.initialName.trim();
    const isQtyChanged = item.quantity.trim() !== item.initialQuantity.trim();
    const isUnitChanged = item.unit.trim() !== item.initialUnit.trim();
    const isRestored = item.isRejected !== item.initialIsRejected;

    return isNameChanged || isQtyChanged || isUnitChanged || isRestored;
  });
}

/**
 * Billing entitlements should refresh from the receipt job query only when OCR processing
 * finishes (settling or refunding the scan reservation).
 * Terminal user actions (CONFIRMED, CANCELLED) already invalidate billing in their own mutations.
 */
export function shouldRefreshBillingForReceiptJobStatus(status?: ReceiptJob['status']): boolean {
  return status === 'READY' || status === 'PARTIAL_FAILED' || status === 'FAILED';
}
