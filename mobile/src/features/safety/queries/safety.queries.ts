import { useMutation } from '@tanstack/react-query';
import { safetyApi } from '../api/safety.api';
import type { SubmitReportInput } from '../types/safety.model';

export function useSubmitReportMutation() {
  return useMutation({
    mutationFn: (input: SubmitReportInput) => safetyApi.submitReport(input),
  });
}

export function useDeleteBehaviorHistoryMutation() {
  return useMutation({
    mutationFn: safetyApi.deleteBehaviorHistory,
  });
}

