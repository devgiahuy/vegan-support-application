import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { aiArtifactApi } from '../api/ai-artifact.api';
import type { CreateAiArtifactInput, PublicAiArtifactsQuery } from '../types/ai-artifact.model';

export const AI_ARTIFACT_KEYS = {
  all: ['ai-artifacts'] as const,
  public: (query: PublicAiArtifactsQuery) => [...AI_ARTIFACT_KEYS.all, 'public', query] as const,
};

/** Danh sách tri thức AI công khai theo loại. */
export function usePublicAiArtifactsQuery(query: PublicAiArtifactsQuery = {}) {
  return useQuery({
    queryKey: AI_ARTIFACT_KEYS.public(query),
    queryFn: () => aiArtifactApi.listPublic(query),
    staleTime: 60 * 1000,
  });
}

/** Lưu đầu ra AI thành bản ghi riêng tư. Lỗi do màn gọi tự hiển thị. */
export function useCreateAiArtifactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAiArtifactInput) => aiArtifactApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AI_ARTIFACT_KEYS.all });
    },
  });
}

export function useUpdateAiArtifactVisibilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; visibility: 'PRIVATE' | 'PUBLIC'; expectedLifecycleVersion: number }) =>
      aiArtifactApi.updateVisibility(vars.id, vars.visibility, vars.expectedLifecycleVersion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AI_ARTIFACT_KEYS.all });
    },
  });
}

export function useSubmitAiArtifactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; expectedLifecycleVersion: number }) =>
      aiArtifactApi.submit(vars.id, vars.expectedLifecycleVersion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AI_ARTIFACT_KEYS.all });
    },
  });
}
