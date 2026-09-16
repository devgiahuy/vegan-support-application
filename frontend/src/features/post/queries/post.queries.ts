import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postApi, ArticleQueryParams } from '../api/post.api';
import type { Article, RelatedGroup } from '../types/post.model';

export const POST_QUERY_KEYS = {
  all: ['posts'] as const,
  articlesList: () => [...POST_QUERY_KEYS.all, 'articles'] as const,
  articles: (params?: ArticleQueryParams) => [...POST_QUERY_KEYS.articlesList(), params] as const,
  articleDetail: (idOrSlug: string) =>
    [...POST_QUERY_KEYS.all, 'articles', 'detail', idOrSlug] as const,
  related: (id: string) => [...POST_QUERY_KEYS.all, 'related', id] as const,
};

/**
 * Hook truy vấn danh sách bài viết blog
 */
export function useArticlesQuery(params?: ArticleQueryParams) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.articles(params),
    queryFn: () => postApi.getArticles(params),
    staleTime: 60 * 1000,
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
  return useQuery<RelatedGroup>({
    queryKey: POST_QUERY_KEYS.related(id),
    queryFn: () => postApi.getRelatedPosts(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook tạo mới bài viết blog
 */
export function useCreateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (article: Partial<Article>) => postApi.createArticle(article),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articlesList() });
      toast.success('Đã gửi bài viết thành công!', {
        description:
          data.status === 'PUBLISHED'
            ? 'Bài viết của bạn đã được xuất bản công khai.'
            : 'Bài viết đã được gửi vào hàng chờ duyệt của ban biên tập.',
      });
    },
    onError: (err: Error) => {
      toast.error('Không thể tạo bài viết', {
        description: err.message || 'Vui lòng kiểm tra lại thông tin.',
      });
    },
  });
}

/**
 * Hook cập nhật bài viết blog
 */
export function useUpdateArticleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, article }: { id: string; article: Partial<Article> }) =>
      postApi.updateArticle(id, article),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articleDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.articlesList() });
      toast.success('Đã lưu bài viết thành công!');
    },
    onError: (err: Error) => {
      toast.error('Lỗi khi cập nhật bài viết', {
        description: err.message,
      });
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
      toast.success('Đã xóa bài viết thành công.');
    },
    onError: (err: Error) => {
      toast.error('Không thể xóa bài viết', {
        description: err.message,
      });
    },
  });
}
