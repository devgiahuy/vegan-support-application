import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/api-error';
import { chatSharingApi } from '../api/chat-sharing.api';
import type { PublicAnswerQueryParams } from '../types/chat-sharing.model';

export const CHAT_SHARING_KEYS = {
  all: ['chat-sharing'] as const,
  publicList: (params?: PublicAnswerQueryParams) =>
    [...CHAT_SHARING_KEYS.all, 'public', params ?? {}] as const,
  publicItem: (shareId: string) => [...CHAT_SHARING_KEYS.all, 'public-item', shareId] as const,
};

/** Danh sách công khai — KHÔNG gate auth (khách xem được). */
export function usePublicAnswersQuery(params?: PublicAnswerQueryParams) {
  return useQuery({
    queryKey: CHAT_SHARING_KEYS.publicList(params),
    queryFn: () => chatSharingApi.getPublicAnswers(params),
    staleTime: 60 * 1000,
  });
}

/** Xem 1 mục công khai theo shareId (null = hết hiệu lực). */
export function usePublicAnswerQuery(shareId: string) {
  return useQuery({
    queryKey: CHAT_SHARING_KEYS.publicItem(shareId),
    queryFn: () => chatSharingApi.getPublicAnswer(shareId),
    staleTime: 60 * 1000,
    enabled: shareId.length > 0,
  });
}

/** Chia sẻ / thu hồi câu trả lời (fixture ở phase scaffold). */
export function useShareAnswerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { messageId: string; shared: boolean }) =>
      chatSharingApi.setShared(vars.messageId, vars.shared),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: CHAT_SHARING_KEYS.all });
      toast.success(result.shared ? 'Đã chia sẻ công khai.' : 'Đã thu hồi chia sẻ.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể cập nhật chia sẻ'),
  });
}

/** Kiểm chứng chuyên gia (fixture; UI chặn role từ trước). */
export function useVerifyAnswerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { messageId: string; note: string }) =>
      chatSharingApi.verifyAnswer(vars.messageId, vars.note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_SHARING_KEYS.all });
      toast.success('Đã ghi nhận kiểm chứng.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể kiểm chứng'),
  });
}
