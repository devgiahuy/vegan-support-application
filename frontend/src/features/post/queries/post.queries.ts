import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/api-error';
import { postApi, ArticleQueryParams } from '../api/post.api';
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
 * Hook tạo mới bài viết blog (toast thành công do component gọi để phân biệt Draft/Published)
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
 * Hook cập nhật bài viết blog (toast thành công do component gọi để phân biệt Draft/Published)
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
