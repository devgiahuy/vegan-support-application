import { useMutation, useQuery } from '@tanstack/react-query';
import { dietImpactApi } from '../api/diet-impact.api';
import type { DietPreferenceDraft } from '../types/diet.model';
import type {
  DietRepairPreviewInput,
  DietRepairApplyInput,
  DietProgramRevisionInput,
} from '../types/diet-impact.model';
import { useInvalidateDietaryState } from './dietary-cache';

export const DIET_IMPACT_KEYS = {
  all: ['dietary-impact'] as const,
  repair: (input: DietRepairPreviewInput) => ['dietary-repair', input] as const,
};
export function useDietImpactPreview() {
  return useMutation({ mutationFn: (input: DietPreferenceDraft) => dietImpactApi.preview(input) });
}
export function useDietRepairPreview() {
  return useMutation({
    mutationFn: (input: DietRepairPreviewInput) => dietImpactApi.previewRepair(input),
  });
}
export function useDietRepairProposal(input: DietRepairPreviewInput) {
  return useQuery({
    queryKey: DIET_IMPACT_KEYS.repair(input),
    queryFn: () => dietImpactApi.previewRepair(input),
    enabled:
      input.planIds.length > 0 &&
      Number.isInteger(input.expectedDietaryRevision) &&
      input.expectedDietaryRevision > 0,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}
export function useDietRepairApply() {
  const invalidate = useInvalidateDietaryState();
  return useMutation({
    mutationFn: (input: DietRepairApplyInput) => dietImpactApi.applyRepair(input),
    onSuccess: invalidate,
  });
}
export function useDietProgramRevision() {
  const invalidate = useInvalidateDietaryState();
  return useMutation({
    mutationFn: ({ id, ...input }: DietProgramRevisionInput) => dietImpactApi.revise(id, input),
    onSuccess: invalidate,
  });
}
