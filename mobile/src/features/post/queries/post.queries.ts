import { useQuery } from '@tanstack/react-query';
import { postApi, type ArticleQueryParams } from '../api/post.api';

export const POST_QUERY_KEYS = {
  all: ['articles'] as const,
  articles: (params?: ArticleQueryParams) => [...POST_QUERY_KEYS.all, 'list', params] as const,
};

export function useArticlesQuery(params?: ArticleQueryParams) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.articles(params),
    queryFn: () => postApi.getArticles(params),
    staleTime: 60 * 1000,
  });
}
