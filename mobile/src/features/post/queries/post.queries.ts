import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postApi, type ArticleQueryParams, type CreateArticleInput } from '../api/post.api';

export const POST_QUERY_KEYS = {
  all: ['articles'] as const,
  articles: (params?: ArticleQueryParams) => [...POST_QUERY_KEYS.all, 'list', params] as const,
  detail: (idOrSlug: string) => [...POST_QUERY_KEYS.all, 'detail', idOrSlug] as const,
  related: (id: string) => [...POST_QUERY_KEYS.all, 'related', id] as const,
};

export function useArticlesQuery(params?: ArticleQueryParams) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.articles(params),
    queryFn: () => postApi.getArticles(params),
    staleTime: 60 * 1000,
  });
}

export function useArticleDetailQuery(idOrSlug: string) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.detail(idOrSlug),
    queryFn: () => postApi.getArticleDetail(idOrSlug),
    enabled: idOrSlug.length > 0,
  });
}

export function useRelatedArticlesQuery(id: string) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.related(id),
    queryFn: () => postApi.getRelatedArticles(id),
    enabled: id.length > 0,
  });
}

export function useCreateArticleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateArticleInput) => postApi.createArticle(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });
    },
  });
}
