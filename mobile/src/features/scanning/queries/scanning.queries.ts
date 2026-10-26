import { useEffect } from 'react';
import { BILLING_QUERY_KEYS } from '@/features/billing/queries/billing.queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { scanningApi } from '../api/scanning.api';
import { DEV_SCANS_ENABLED } from '../lib/scan-access';
import type {
  CandidateEdit,
  ScanConfirm,
  ScanCreate,
  ScanJob,
  ScanKind,
} from '../types/scanning.model';

export const SCAN_QUERY_KEYS = {
  all: ['scanning'] as const,
  job: (owner: string, kind: ScanKind, id: string) => ['scanning', owner, kind, id] as const,
};

export function useScanJobQuery(kind: ScanKind, id: string) {
  const owner = useAuthStore((state) => state.user?.id ?? '');
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const allowanceClient = useQueryClient();
  const result = useQuery({
    queryKey: SCAN_QUERY_KEYS.job(owner, kind, id),
    queryFn: () => scanningApi.get(kind, id),
    enabled: DEV_SCANS_ENABLED && authenticated && Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'QUEUED' || status === 'PROCESSING' ? 1500 : false;
    },
  });
  const status = result.data?.status;
  const resultId = result.data?.id;
  useEffect(() => {
    if (status && !['QUEUED', 'PROCESSING'].includes(status))
      void allowanceClient.invalidateQueries({
        queryKey: BILLING_QUERY_KEYS.all,
      });
  }, [status, resultId, allowanceClient]);
  return result;
}

export function useScanMutations(kind: ScanKind) {
  const client = useQueryClient();
  const owner = useAuthStore((state) => state.user?.id ?? '');
  const cacheJob = (job: ScanJob) => {
    client.setQueryData(SCAN_QUERY_KEYS.job(owner, kind, job.id), job);
    void client.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
  };
  const refresh = () =>
    client.invalidateQueries({
      queryKey: [...SCAN_QUERY_KEYS.all, owner, kind],
    });
  const inventory = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['pantry'] }),
      client.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all }),
      client.invalidateQueries({ queryKey: ['shopping-preview'] }),
    ]);
  const create = useMutation({
    mutationFn: (input: ScanCreate) => scanningApi.create(kind, input),
    onSuccess: cacheJob,
  });
  const edit = useMutation({
    mutationFn: (input: { id: string; candidateId: string; values: CandidateEdit }) =>
      scanningApi.edit(kind, input.id, input.candidateId, input.values),
    onSuccess: cacheJob,
    onError: refresh,
  });
  const restore = useMutation({
    mutationFn: (input: { id: string; itemId: string; version: number }) =>
      scanningApi.restoreExcluded(input.id, input.itemId, input.version),
    onSuccess: cacheJob,
    onError: refresh,
  });
  const cancel = useMutation({
    mutationFn: (id: string) => scanningApi.cancel(kind, id),
    onSuccess: cacheJob,
    onError: refresh,
  });
  const retry = useMutation({
    mutationFn: (input: { id: string; operationKey: string }) =>
      scanningApi.retry(kind, input.id, input.operationKey),
    onSuccess: cacheJob,
    onError: refresh,
  });
  const confirm = useMutation({
    mutationFn: (input: { id: string; values: ScanConfirm }) =>
      scanningApi.confirm(kind, input.id, input.values),
    onSuccess: async (result) => {
      cacheJob(result.job);
      await inventory();
    },
    onError: async () => {
      await Promise.all([refresh(), inventory()]);
    },
  });
  return { create, edit, restore, cancel, retry, confirm };
}
