import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { PostType } from '@/common/enums';
import { toast } from 'sonner';
import {
  adminContentApi,
  type AdminContentDraft,
  type AdminContentListParams,
} from '../api/admin-content.api';
import { CATEGORY_QUERY_KEYS } from '@/features/category/queries/category.queries';
import { RECIPE_QUERY_KEYS } from '@/features/recipe/queries/recipe.queries';
import { POST_QUERY_KEYS } from '@/features/post/queries/post.queries';
import { VIDEO_QUERY_KEYS } from '@/features/video/queries/video.queries';
import type { AdminContentSubmitInput } from '../types/admin-content.model';

export const ADMIN_CONTENT_QUERY_KEYS = {
  all: ['admin-content', 'list'] as const,
  list: (params?: AdminContentListParams & { sessionUserId?: string }) =>
    [...ADMIN_CONTENT_QUERY_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...ADMIN_CONTENT_QUERY_KEYS.all, 'detail', id] as const,
  history: (id: string, params?: { page?: number; limit?: number }) =>
    [...ADMIN_CONTENT_QUERY_KEYS.all, 'history', id, params] as const,
};

const CONTENT_PUBLIC_KEYS = [
  RECIPE_QUERY_KEYS.all,
  POST_QUERY_KEYS.all,
  VIDEO_QUERY_KEYS.all,
] as const;

/**
 * Vô hiệu hoá cache của khu vực quản trị VÀ cache công khai tương ứng — thao tác
 * ghi nội dung phải phản ánh ngay ở cả hai nơi, nếu không quản trị viên sẽ thấy
 * trạng thái cũ và tưởng thao tác thất bại.
 */
function invalidateContent(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ADMIN_CONTENT_QUERY_KEYS.all });
  for (const key of CONTENT_PUBLIC_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

/** Gỡ cache danh mục vì biểu mẫu có thể vừa đổi chuyên mục của nội dung. */
function invalidateCategories(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
}

export function useAdminContentListQuery(params: AdminContentListParams, sessionUserId: string) {
  return useQuery({
    // `sessionUserId` có trong key vì `isEditable` phụ thuộc phiên đăng nhập —
    // đổi tài khoản phải tính lại quyền ghi, không dùng cache của phiên cũ.
    queryKey: ADMIN_CONTENT_QUERY_KEYS.list({ ...params, sessionUserId }),
    queryFn: () => adminContentApi.listContent(params, sessionUserId),
    enabled: Boolean(params),
  });
}

export function useAdminContentDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: ADMIN_CONTENT_QUERY_KEYS.detail(id),
    queryFn: () => adminContentApi.getContent(id),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminContentHistoryQuery(
  id: string,
  params?: { page?: number; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: ADMIN_CONTENT_QUERY_KEYS.history(id, params),
    queryFn: () => adminContentApi.getContentHistory(id, params),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateAdminContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, draft }: { type: PostType; draft: AdminContentDraft }) =>
      adminContentApi.createContent(type, draft),
    onSuccess: () => {
      invalidateContent(queryClient);
      invalidateCategories(queryClient);
      toast.success('Đã tạo nội dung ở trạng thái bản nháp.');
    },
  });
}

export function useUpdateAdminContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, draft }: { id: string; type: PostType; draft: AdminContentDraft }) =>
      adminContentApi.updateContent(id, type, draft),
    onSuccess: () => {
      invalidateContent(queryClient);
      invalidateCategories(queryClient);
      toast.success('Đã lưu nội dung. Bản sửa cần được duyệt trước khi công khai.');
    },
  });
}

export function useDeleteAdminContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: string; expectedVersion: number }) =>
      adminContentApi.deleteContent(id, expectedVersion),
    onSuccess: () => {
      invalidateContent(queryClient);
      toast.success('Đã xoá nội dung.');
    },
  });
}

/**
 * Gỡ nội dung của chính quản trị viên khỏi khu vực công khai.
 *
 * ⚠️ Máy chủ **không** có endpoint ẩn (HIDDEN) cho tác giả: `PostStatus.HIDDEN`
 * chỉ được đặt bởi quyết định kiểm duyệt (`backend/src/modules/moderation/moderation.repository.ts`).
 * Nên gỡ nội dung hiện chỉ đi được qua **xoá mềm** `DELETE /posts/:id` — có giữ bằng
 * chứng kiểm toán nhưng **không hoàn tác được** ở MVP. Yêu cầu "ẩn kèm lý do" và
 * "khôi phục" (FR-025..FR-027) bị chặn bởi CG-02, xem
 * `specs/029-admin-content-crud/contracts/cg-02-author-hide-restore.md`.
 */
export function useSubmitAdminContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminContentSubmitInput }) =>
      adminContentApi.submitContent(id, input),
    onSuccess: () => {
      invalidateContent(queryClient);
      toast.success('Đã gửi nội dung duyệt.');
    },
  });
}
