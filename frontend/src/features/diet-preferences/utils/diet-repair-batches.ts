import type { DietRepairProposal, DietRepairResult } from '../types/diet-impact.model';

/** Mirrors the backend request bound without dropping any selected plan. */
export const DIET_REPAIR_BATCH_SIZE = 20;

export function repairPlanBatches(planIds: string[]): string[][] {
  const unique = [...new Set(planIds)];
  const batches: string[][] = [];
  for (let offset = 0; offset < unique.length; offset += DIET_REPAIR_BATCH_SIZE) {
    batches.push(unique.slice(offset, offset + DIET_REPAIR_BATCH_SIZE));
  }
  return batches;
}

export interface DietRepairBatchRecord {
  batchIndex: number;
  planIds: string[];
  result: DietRepairResult;
}

export function repairBatchSummary(batches: string[][], records: DietRepairBatchRecord[]) {
  const latest = new Map(records.map((record) => [record.batchIndex, record]));
  const visited = new Set([...latest.values()].flatMap((record) => record.planIds));
  const results = new Map(
    [...latest.values()].flatMap((record) =>
      record.result.results.map((result) => [result.planId, result] as const)
    )
  );
  const allIds = batches.flat();
  const pendingPlanIds = allIds.filter((id) => !visited.has(id));
  const unresolvedPlanIds = allIds.filter((id) => {
    if (!visited.has(id)) return false;
    const result = results.get(id);
    return (
      !result ||
      !['UPDATED', 'UNCHANGED'].includes(result.status) ||
      result.remainingAffectedMeals > 0
    );
  });
  return {
    total: allIds.length,
    visited: allIds.length - pendingPlanIds.length,
    updated: [...results.values()].filter((result) => result.status === 'UPDATED').length,
    pendingPlanIds,
    unresolvedPlanIds,
    allResolved: allIds.length > 0 && pendingPlanIds.length === 0 && unresolvedPlanIds.length === 0,
  };
}

/** Explicitly keeping a group must retain every unresolved plan in the aggregate report. */
export function keptRepairBatch(
  batchIndex: number,
  planIds: string[],
  dietaryRevision: number,
  proposal: DietRepairProposal | undefined
): DietRepairBatchRecord {
  const plans = new Map(proposal?.plans.map((plan) => [plan.planId, plan]));
  return {
    batchIndex,
    planIds,
    result: {
      dietaryRevision,
      results: planIds.map((planId) => {
        const plan = plans.get(planId);
        return {
          planId,
          status:
            plan?.status === 'UNCHANGED'
              ? 'UNCHANGED'
              : plan?.status === 'PROGRAM_REVISION_REQUIRED'
                ? 'PROGRAM_REVISION_REQUIRED'
                : 'FAILED',
          message:
            plan?.status === 'UNCHANGED'
              ? plan.message
              : plan?.message || 'Giữ nguyên thực đơn, xử lý sau.',
          remainingAffectedMeals:
            plan?.status === 'UNCHANGED' ? 0 : (plan?.replacements.length ?? 0),
        };
      }),
    },
  };
}
