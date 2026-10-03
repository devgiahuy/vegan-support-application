import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { storageApi } from '../api/storage.api';
import { uploadImage } from '../api/image-upload';
import type { ReservationInput, UploadAttempt } from '../types/storage.model';

export const STORAGE_QUERY_KEYS = {
  all: ['storage'] as const,
  account: ['storage', 'account'] as const,
};

export function useStorageAccountQuery() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: STORAGE_QUERY_KEYS.account,
    queryFn: storageApi.getAccount,
    enabled: authenticated,
  });
}

export function useUploadImageMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      onProgress,
      attempt,
    }: {
      input: ReservationInput;
      onProgress: (percent: number) => void;
      attempt: UploadAttempt;
    }) => uploadImage(input, onProgress, attempt),
    onSettled: () => client.invalidateQueries({ queryKey: STORAGE_QUERY_KEYS.all }),
  });
}
