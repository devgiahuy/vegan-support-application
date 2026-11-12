import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage, toastApiError } from '@/lib/api-error';
import { PostStatus } from '@/common/enums';
import { reviewApi } from '@/features/review/api/review.api';
import type { SubmitPostResult } from '@/features/review/types/content-review.model';
import { CONTENT_REVIEW_KEYS } from '@/features/review/queries/review.queries';
import { postApi, ArticleQueryParams } from '../api/post.api';
import { getPostStatusLabel, parsePostStatus } from '../mappers/post.mapper';
import type { Article, RelatedGroup } from '../types/post.model';
import { useAuthStore } from '@/store/useAuthStore';

export const POST_QUERY_KEYS = {
  all: ['posts'] as const,
  mineRoot: () => [...POST_QUERY_KEYS.all, 'mine'] as const,
  mine: (userId: string | undefined, params?: { page?: number; limit?: number }) =>
    [...POST_QUERY_KEYS.mineRoot(), userId, params] as const,
  articlesList: () => [...POST_QUERY_KEYS.all, 'articles'] as const,
  articles: (params?: ArticleQueryParams) => [...POST_QUERY_KEYS.articlesList(), params] as const,
  articleDetail: (idOrSlug: string) =>
    [...POST_QUERY_KEYS.all, 'articles', 'detail', idOrSlug] as const,
  related: (id: string, userId?: string) =>
    [...POST_QUERY_KEYS.all, 'related', id, userId ?? 'guest'] as const,
};

export function useMyPostsQuery(
  userId: string | undefined,
  params?: { page?: number; limit?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.mine(userId, params),
    queryFn: () => postApi.getMyPosts(params),
    staleTime: 30 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook truy vấn danh sách bài viết blog
 */
export function useArticlesQuery(params?: ArticleQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.articles(params),
    queryFn: () => postApi.getArticles(params),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook truy vấn chi tiết bài viết blog
 */
export function useArticleDetailQuery(idOrSlug: string) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.articleDetail(idOrSlug),
    queryFn: () => postApi.getArticleDetail(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook truy vấn bài viết & nội dung liên quan theo nhóm
 * `{ recipes, blogs, videos }` (đúng contract `GET /posts/:id/related`).
 */
export function useRelatedPostsQuery(id: string) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery<RelatedGroup>({
    queryKey: POST_QUERY_KEYS.related(id, userId),
    queryFn: () => postApi.getRelatedPosts(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

/**
 * Lưu xong nhưng gửi xuất bản / kiểm duyệt thất bại: bài viết vẫn còn ở dạng bản nháp.
 */
export class ArticleSubmitForReviewError extends Error {
  constructor(
    readonly article: Article,
    readonly reason: unknown
  ) {
    super(
      `Đã lưu bản nháp nhưng chưa gửi xuất bản được: ${getApiErrorMessage(reason, 'vui lòng thử gửi lại.')}`
    );
    this.name = 'ArticleSubmitForReviewError';
  }
}

/** Backend luôn lưu revision mới ở dạng DRAFT; gửi/xuất bản ngay bằng `POST /posts/:id/submit`. */
export async function submitSavedArticle(saved: Article): Promise<Article> {
  const expectedVersion = saved.version ?? saved.revisionVersion;
  let submitted: SubmitPostResult;
  try {
    if (!saved.id || !saved.revisionId || expectedVersion === undefined) {
      throw new Error('Phản hồi lưu bài viết thiếu thông tin phiên bản.');
    }
    submitted = await reviewApi.submitPost(saved.id, {
      revisionId: saved.revisionId,
      expectedVersion,
    });
  } catch (err) {
    throw new ArticleSubmitForReviewError(saved, err);
  }

  const nextPostStatus = parsePostStatus(submitted.postStatus);
  const nextRevisionStatus = parsePostStatus(submitted.revisionStatus);

  return {
    ...saved,
    status: nextPostStatus,
    statusLabel: getPostStatusLabel(nextPostStatus),
    version: submitted.version || saved.version,
    revisionId: submitted.revisionId || saved.revisionId,
    revisionVersion: submitted.revisionVersion || saved.revisionVersion,
    revisionStatus: nextRevisionStatus,
    publishedRevisionVersion: submitted.publishedRevisionVersion ?? saved.publishedRevisionVersion,
    publishedAt: submitted.publishedAt ?? saved.publishedAt,
    formattedPublishedAt: submitted.publishedAt
      ? submitted.formattedPublishedAt
      : saved.formattedPublishedAt,
  };
}

function useSaveAndSubmitArticleCallbacks() {
  const queryClient = useQueryClient();
  return {
    onSuccess: (data: Article) => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articlesList() });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articleDetail(data.id) });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
      queryClient.invalidateQueries({ queryKey: CONTENT_REVIEW_KEYS.all });

      const effectiveStatus = data.revisionStatus ?? data.status;
      if (effectiveStatus === PostStatus.PUBLISHED) {
        toast.success('Đã xuất bản bài viết công khai!', {
          description: 'Bài viết của bạn đã được duyệt tự động và hiển thị trong Cẩm nang.',
        });
      } else if (
        effectiveStatus === PostStatus.FLAGGED ||
        effectiveStatus === PostStatus.QUARANTINED
      ) {
        toast.warning('Bài viết cần được kiểm duyệt bổ sung', {
          description:
            'Hệ thống đã chuyển bài viết tới Quản trị viên để rà soát trước khi công khai.',
        });
      } else {
        toast.success('Đã gửi bài viết để kiểm duyệt!', {
          description: 'Bài viết đang chờ Quản trị viên thẩm định trước khi xuất bản.',
        });
      }
    },
    onError: (err: unknown, fallbackTitle: string) => {
      if (err instanceof ArticleSubmitForReviewError) {
        queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articleDetail(err.article.id) });
        queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
        toast.warning('Đã lưu bản nháp nhưng chưa gửi xuất bản được', {
          description: getApiErrorMessage(err.reason, 'Vui lòng thử gửi lại.'),
        });
        return;
      }
      toastApiError(err, fallbackTitle, 'Vui lòng kiểm tra lại thông tin.');
    },
  };
}

/**
 * Hook tạo mới bài viết blog (dạng DRAFT)
 */
export function useCreateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (article: Partial<Article>) => postApi.createArticle(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articlesList() });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Không thể tạo bài viết', 'Vui lòng kiểm tra lại thông tin.');
    },
  });
}

/**
 * Hook cập nhật bài viết blog (dạng DRAFT mới)
 */
export function useUpdateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, article }: { id: string; article: Partial<Article> }) =>
      postApi.updateArticle(id, article),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articleDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articlesList() });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Lỗi khi cập nhật bài viết');
    },
  });
}

/**
 * Hook tạo bài viết rồi nộp xuất bản / kiểm duyệt ngay (`POST /posts` -> `POST /posts/:id/submit`).
 */
export function useCreateAndSubmitArticleMutation() {
  const callbacks = useSaveAndSubmitArticleCallbacks();
  return useMutation({
    mutationFn: async (article: Partial<Article>) =>
      submitSavedArticle(await postApi.createArticle(article)),
    onSuccess: callbacks.onSuccess,
    onError: (err: unknown) => callbacks.onError(err, 'Không thể tạo bài viết'),
  });
}

/**
 * Hook lưu bản sửa rồi nộp xuất bản / kiểm duyệt ngay (`PATCH /posts/:id` -> `POST /posts/:id/submit`).
 */
export function useUpdateAndSubmitArticleMutation() {
  const callbacks = useSaveAndSubmitArticleCallbacks();
  return useMutation({
    mutationFn: async ({ id, article }: { id: string; article: Partial<Article> }) =>
      submitSavedArticle(await postApi.updateArticle(id, article)),
    onSuccess: callbacks.onSuccess,
    onError: (err: unknown) => callbacks.onError(err, 'Lỗi khi cập nhật bài viết'),
  });
}

/**
 * Hook xóa mềm bài viết (backend yêu cầu `expectedVersion`)
 */
export function useDeleteArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: string; expectedVersion?: number }) =>
      postApi.deleteArticle(id, expectedVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articlesList() });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.mineRoot() });
      toast.success('Đã xóa bài viết thành công.');
    },
    onError: (err: unknown) => {
      toastApiError(err, 'Không thể xóa bài viết');
    },
  });
}
