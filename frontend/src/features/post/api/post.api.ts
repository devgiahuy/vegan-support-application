import api from '@/lib/axios';
import { POSTS_ENDPOINTS } from '@/common/constants/endpoints/posts.endpoints';
import { PostType } from '@/common/enums';
import type { PaginationResult } from '@/types/api';
import { postMapper, toMyPostModel } from '../mappers/post.mapper';
import type {
  BlogDetailDto,
  PostListResponseDto,
  MyPostListResponseDto,
  PostDetailResponseDto,
  CreatePostRequestDto,
  UpdatePostRequestDto,
  RelatedPostsResponseDto,
} from '../types/post.dto';
import type { Article, MyPostModel, RelatedGroup } from '../types/post.model';

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  /** Backend chưa hỗ trợ lọc thẻ; lọc trên trang đã tải sau khi map. */
  tag?: string;
  q?: string;
}

export const postApi = {
  getMyPosts: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<MyPostModel>> => {
    const res = await api.get<MyPostListResponseDto>(POSTS_ENDPOINTS.MINE, {
      params: { page: params?.page ?? 1, limit: params?.limit ?? 100 },
      silent: true,
    });
    if (!res.data?.success || !Array.isArray(res.data.data) || !res.data.meta) {
      throw new Error('Phản hồi danh sách bài viết cá nhân không đúng định dạng.');
    }
    return {
      items: res.data.data.map(toMyPostModel),
      metadata: {
        page: res.data.meta.page,
        limit: res.data.meta.limit,
        totalPages: res.data.meta.totalPages,
        totalItems: res.data.meta.total,
        hasNextPage: res.data.meta.page < res.data.meta.totalPages,
        hasPrevPage: res.data.meta.page > 1,
      },
    };
  },

  getArticles: async (params?: ArticleQueryParams): Promise<PaginationResult<Article>> => {
    const { tag, ...backendParams } = params || {};
    const res = await api.get<PostListResponseDto>(POSTS_ENDPOINTS.LIST, {
      params: { ...backendParams, type: PostType.BLOG },
      silent: true,
    });
    if (!res.data?.success || !Array.isArray(res.data.data)) {
      throw new Error('Phản hồi danh sách bài viết không đúng định dạng.');
    }
    const page = postMapper.toPaginationFromEnvelope(res.data.data, res.data.meta);
    if (!tag) return page;
    const items = page.items.filter((article) => article.tags.includes(tag));
    return { items, metadata: { ...page.metadata, totalItems: items.length } };
  },

  getArticleDetail: async (idOrSlug: string): Promise<Article> => {
    const res = await api.get<PostDetailResponseDto>(POSTS_ENDPOINTS.DETAIL(idOrSlug), {
      silent: true,
    });
    if (res.data?.success && res.data.data)
      return postMapper.toModel(res.data.data as BlogDetailDto);
    throw new Error('Phản hồi chi tiết bài viết không đúng định dạng.');
  },

  getRelatedPosts: async (id: string): Promise<RelatedGroup> => {
    const res = await api.get<RelatedPostsResponseDto>(POSTS_ENDPOINTS.RELATED(id), {
      silent: true,
    });
    if (res.data?.success && res.data.data && !Array.isArray(res.data.data)) {
      return postMapper.toRelatedGroup(res.data.data);
    }
    throw new Error('Phản hồi nội dung liên quan không đúng định dạng.');
  },

  createArticle: async (article: Partial<Article>): Promise<Article> => {
    const payload: CreatePostRequestDto = postMapper.toCreateDto(article);
    const res = await api.post<PostDetailResponseDto>(POSTS_ENDPOINTS.CREATE, payload);
    if (res.data?.success && res.data.data)
      return postMapper.toModel(res.data.data as BlogDetailDto);
    throw new Error('Phản hồi tạo bài viết không đúng định dạng.');
  },

  updateArticle: async (id: string, article: Partial<Article>): Promise<Article> => {
    const payload: UpdatePostRequestDto = postMapper.toUpdateDto(article);
    const res = await api.patch<PostDetailResponseDto>(POSTS_ENDPOINTS.UPDATE(id), payload);
    if (res.data?.success && res.data.data)
      return postMapper.toModel(res.data.data as BlogDetailDto);
    throw new Error('Phản hồi cập nhật bài viết không đúng định dạng.');
  },

  deleteArticle: async (id: string, expectedVersion?: number): Promise<void> => {
    await api.delete(POSTS_ENDPOINTS.DELETE(id), {
      params: expectedVersion !== undefined ? { expectedVersion } : undefined,
    });
  },
};
