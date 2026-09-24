import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType } from '@/common/enums';
import { postMapper } from '../mappers/post.mapper';
import type { PostDetailResponseDto, PostListResponseDto, RelatedPostsResponseDto } from '../types/post.dto';
import type { Article } from '../types/post.model';
import type { PaginationResult } from '@/types/api';

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  q?: string;
}

export interface CreateArticleInput {
  title: string;
  excerpt?: string;
  body: string;
  categoryIds?: string[];
  tags?: string[];
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

  /** Chi tiết 1 bài viết theo id hoặc slug. `GET /posts/:idOrSlug`. */
  getArticleDetail: async (idOrSlug: string): Promise<Article> => {
    const res = await api.get<PostDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(idOrSlug), {
      silent: true,
    });
    return postMapper.toModel(res.data?.data);
  },

  /** Bài viết liên quan cùng danh mục. `GET /posts/:id/related`. */
  getRelatedArticles: async (id: string, limitPerType = 3): Promise<Article[]> => {
    const res = await api.get<RelatedPostsResponseDto>(API_ENDPOINTS.POSTS.RELATED(id), {
      params: { limitPerType },
      silent: true,
    });
    return postMapper.toModelList(res.data?.data?.blogs ?? []);
  },

  /**
   * Tạo bài viết mới rồi gửi ngay để duyệt: `POST /posts` (type=BLOG) →
   * `POST /posts/:id/submit`. Chưa hỗ trợ ảnh bìa (cần luồng upload Cloudinary
   * riêng, ngoài phạm vi task này).
   */
  createArticle: async (input: CreateArticleInput): Promise<Article> => {
    const payload = {
      type: PostType.BLOG,
      title: input.title,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(input.categoryIds?.length ? { categoryIds: input.categoryIds } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
      media: [],
      body: input.body,
    };

    const createRes = await api.post<PostDetailResponseDto>(API_ENDPOINTS.POSTS.LIST, payload);
    const created = createRes.data?.data;
    const revisionId = created?.revision?.id;
    const expectedVersion = created?.version;

    if (created?.id && revisionId && expectedVersion) {
      try {
        const submitRes = await api.post<PostDetailResponseDto>(
          API_ENDPOINTS.POSTS.SUBMIT(created.id),
          { revisionId, expectedVersion }
        );
        return postMapper.toModel(submitRes.data?.data);
      } catch {
        return postMapper.toModel(created);
      }
    }
    return postMapper.toModel(created);
  },
};
