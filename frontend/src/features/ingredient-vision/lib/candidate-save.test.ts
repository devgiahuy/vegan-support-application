import { describe, expect, it } from 'vitest';
import {
  getCandidatesToPatchBeforeConfirm,
  shouldRefreshBillingForJobStatus,
  type CandidateSaveDraft,
} from './candidate-save';

function makeCandidate(overrides: Partial<CandidateSaveDraft> = {}): CandidateSaveDraft {
  return {
    id: 'cand-1',
    name: 'Đậu phụ',
    quantity: '300',
    unit: 'g',
    isRejected: false,
    version: 1,
    ingredientId: 'ing-1',
    initialName: 'Đậu phụ',
    initialQuantity: '300',
    initialUnit: 'g',
    initialIsRejected: false,
    ...overrides,
  };
}

describe('getCandidatesToPatchBeforeConfirm', () => {
  it('skips newly rejected and already rejected candidates', () => {
    const items = [
      makeCandidate({ id: 'kept-unchanged' }),
      makeCandidate({ id: 'newly-rejected', isRejected: true, initialIsRejected: false }),
      makeCandidate({
        id: 'rejected-with-edits',
        name: 'Đã sửa rồi xóa',
        isRejected: true,
        initialIsRejected: false,
      }),
      makeCandidate({ id: 'already-rejected', isRejected: true, initialIsRejected: true }),
    ];

    expect(getCandidatesToPatchBeforeConfirm(items)).toEqual([]);
  });

  it('returns only kept candidates whose name, quantity, or unit changed', () => {
    const unchanged = makeCandidate({ id: 'unchanged' });
    const whitespaceOnly = makeCandidate({
      id: 'whitespace-only',
      name: '  Đậu phụ  ',
      quantity: ' 300 ',
      unit: ' g ',
    });
    const editedName = makeCandidate({ id: 'edited-name', name: 'Đậu phụ non' });
    const editedQty = makeCandidate({ id: 'edited-qty', quantity: '500' });
    const editedUnit = makeCandidate({ id: 'edited-unit', unit: 'kg' });

    const result = getCandidatesToPatchBeforeConfirm([
      unchanged,
      whitespaceOnly,
      editedName,
      editedQty,
      editedUnit,
    ]);

    expect(result.map((item) => item.id)).toEqual(['edited-name', 'edited-qty', 'edited-unit']);
  });

  it('includes a previously server-rejected candidate that was restored to active', () => {
    const restored = makeCandidate({
      id: 'restored',
      isRejected: false,
      initialIsRejected: true,
    });

    const result = getCandidatesToPatchBeforeConfirm([restored]);

    expect(result.map((item) => item.id)).toEqual(['restored']);
  });
});

describe('shouldRefreshBillingForJobStatus', () => {
  it('returns true only when processing completes into a reviewable or failed state', () => {
    expect(shouldRefreshBillingForJobStatus('READY')).toBe(true);
    expect(shouldRefreshBillingForJobStatus('PARTIAL_FAILED')).toBe(true);
    expect(shouldRefreshBillingForJobStatus('FAILED')).toBe(true);
  });

  it('returns false for active processing and mutation-handled terminal states', () => {
    expect(shouldRefreshBillingForJobStatus(undefined)).toBe(false);
    expect(shouldRefreshBillingForJobStatus('QUEUED')).toBe(false);
    expect(shouldRefreshBillingForJobStatus('PROCESSING')).toBe(false);
    expect(shouldRefreshBillingForJobStatus('CONFIRMED')).toBe(false);
    expect(shouldRefreshBillingForJobStatus('CANCELLED')).toBe(false);
  });
});
