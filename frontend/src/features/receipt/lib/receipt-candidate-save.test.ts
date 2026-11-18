import { describe, expect, it } from 'vitest';
import {
  getReceiptCandidatesToPatchBeforeConfirm,
  shouldRefreshBillingForReceiptJobStatus,
  type ReceiptCandidateSaveDraft,
} from './receipt-candidate-save';

function makeCandidate(
  overrides: Partial<ReceiptCandidateSaveDraft> = {}
): ReceiptCandidateSaveDraft {
  return {
    id: 'receipt-cand-1',
    name: 'Đậu phụ non',
    quantity: '2',
    unit: 'hộp',
    isRejected: false,
    version: 1,
    ingredientId: 'ing-1',
    initialName: 'Đậu phụ non',
    initialQuantity: '2',
    initialUnit: 'hộp',
    initialIsRejected: false,
    ...overrides,
  };
}

describe('getReceiptCandidatesToPatchBeforeConfirm', () => {
  it('skips newly rejected and already rejected candidates', () => {
    const items = [
      makeCandidate({ id: 'kept-unchanged' }),
      makeCandidate({ id: 'newly-rejected', isRejected: true, initialIsRejected: false }),
      makeCandidate({
        id: 'rejected-after-edit',
        quantity: '5',
        isRejected: true,
        initialIsRejected: false,
      }),
      makeCandidate({ id: 'already-rejected', isRejected: true, initialIsRejected: true }),
    ];

    expect(getReceiptCandidatesToPatchBeforeConfirm(items)).toEqual([]);
  });

  it('returns only kept candidates whose name, quantity, or unit changed', () => {
    const unchanged = makeCandidate({ id: 'unchanged' });
    const whitespaceOnly = makeCandidate({
      id: 'whitespace-only',
      name: '  Đậu phụ non  ',
      quantity: ' 2 ',
      unit: ' hộp ',
    });
    const editedName = makeCandidate({ id: 'edited-name', name: 'Đậu phụ trắng' });
    const editedQty = makeCandidate({ id: 'edited-qty', quantity: '3' });
    const editedUnit = makeCandidate({ id: 'edited-unit', unit: 'g' });

    const result = getReceiptCandidatesToPatchBeforeConfirm([
      unchanged,
      whitespaceOnly,
      editedName,
      editedQty,
      editedUnit,
    ]);

    expect(result.map((item) => item.id)).toEqual(['edited-name', 'edited-qty', 'edited-unit']);
  });

  it('includes a previously server-rejected candidate restored to active', () => {
    const restored = makeCandidate({
      id: 'restored',
      isRejected: false,
      initialIsRejected: true,
    });

    const result = getReceiptCandidatesToPatchBeforeConfirm([restored]);

    expect(result.map((item) => item.id)).toEqual(['restored']);
  });
});

describe('shouldRefreshBillingForReceiptJobStatus', () => {
  it('returns true only when processing completes into a reviewable or failed state', () => {
    expect(shouldRefreshBillingForReceiptJobStatus('READY')).toBe(true);
    expect(shouldRefreshBillingForReceiptJobStatus('PARTIAL_FAILED')).toBe(true);
    expect(shouldRefreshBillingForReceiptJobStatus('FAILED')).toBe(true);
  });

  it('returns false for active processing and mutation-handled terminal states', () => {
    expect(shouldRefreshBillingForReceiptJobStatus(undefined)).toBe(false);
    expect(shouldRefreshBillingForReceiptJobStatus('QUEUED')).toBe(false);
    expect(shouldRefreshBillingForReceiptJobStatus('PROCESSING')).toBe(false);
    expect(shouldRefreshBillingForReceiptJobStatus('CONFIRMED')).toBe(false);
    expect(shouldRefreshBillingForReceiptJobStatus('CANCELLED')).toBe(false);
  });
});
