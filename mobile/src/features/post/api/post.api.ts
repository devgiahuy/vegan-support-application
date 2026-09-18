import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType } from '@/common/enums';
import { postMapper } from '../mappers/post.mapper';
import type { PostListResponseDto } from '../types/post.dto';
import type { Article } from '../types/post.model';
import type { PaginationResult } from '@/types/api';

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  q?: string;
}

export const postApi = {
  /** Danh sách bài viết Cẩm nang. `GET /posts?type=BLOG`. */
  getArticles: async (params?: ArticleQueryParams): Promise<PaginationResult<Article>> => {
    const res = await api.get<PostListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
      params: { ...params, type: PostType.BLOG },
      silent: true,
    });
    return postMapper.toPaginationFromEnvelope(res.data.data, res.data.meta);
  },
};
