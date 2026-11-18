import { describe, expect, it } from 'vitest';
import { keptRepairBatch, repairBatchSummary, repairPlanBatches } from './diet-repair-batches';

const ids = (count: number) => Array.from({ length: count }, (_, index) => `plan-${index}`);
describe('dietary repair batching', () => {
  it('keeps all 21 plans in explicit bounded groups', () => {
    const selected = ids(21);
    const batches = repairPlanBatches(selected);
    expect(batches.map((batch) => batch.length)).toEqual([20, 1]);
    expect(batches.flat()).toEqual(selected);
  });
  it('deduplicates across group boundaries without losing later unique plans', () => {
    const selected = ids(42);
    const batches = repairPlanBatches([
      ...selected.slice(0, 20),
      selected[0],
      ...selected.slice(20),
    ]);
    expect(batches.map((batch) => batch.length)).toEqual([20, 20, 2]);
    expect(batches.flat()).toEqual(selected);
  });
  it('does not finish after the first successful group while another group is pending', () => {
    const batches = repairPlanBatches(ids(21));
    const summary = repairBatchSummary(batches, [
      {
        batchIndex: 0,
        planIds: batches[0],
        result: {
          dietaryRevision: 2,
          results: batches[0].map((planId) => ({
            planId,
            status: 'UPDATED',
            message: '',
            remainingAffectedMeals: 0,
          })),
        },
      },
    ]);
    expect(summary.allResolved).toBe(false);
    expect(summary.pendingPlanIds).toEqual(['plan-20']);
  });
  it('preserves kept/failed plans after a later group succeeds', () => {
    const batches = repairPlanBatches(ids(21));
    const kept = keptRepairBatch(0, batches[0], 2, undefined);
    const summary = repairBatchSummary(batches, [
      kept,
      {
        batchIndex: 1,
        planIds: batches[1],
        result: {
          dietaryRevision: 2,
          results: [
            { planId: 'plan-20', status: 'UPDATED', message: '', remainingAffectedMeals: 0 },
          ],
        },
      },
    ]);
    expect(summary.pendingPlanIds).toEqual([]);
    expect(summary.unresolvedPlanIds).toEqual(batches[0]);
    expect(summary.updated).toBe(1);
    expect(summary.allResolved).toBe(false);
  });
  it('only clears a failed group after a successful retry replaces its outcomes', () => {
    const batches = repairPlanBatches(['one']);
    const kept = keptRepairBatch(0, batches[0], 2, undefined);
    const repaired = {
      ...kept,
      result: {
        dietaryRevision: 2,
        results: [
          { planId: 'one', status: 'UPDATED' as const, message: '', remainingAffectedMeals: 0 },
        ],
      },
    };
    expect(repairBatchSummary(batches, [kept, repaired]).allResolved).toBe(true);
  });
  it('leaves a missing per-plan result unresolved instead of assuming success', () => {
    const batches = repairPlanBatches(['one']);
    expect(
      repairBatchSummary(batches, [
        { batchIndex: 0, planIds: ['one'], result: { dietaryRevision: 2, results: [] } },
      ]).unresolvedPlanIds
    ).toEqual(['one']);
  });
});
