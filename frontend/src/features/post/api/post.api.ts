import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import { postMapper } from '../mappers/post.mapper';
import { shouldFallbackToFixtures, createNotFoundError } from '../utils/api-fallback';
import { MOCK_ARTICLE_DTOS } from '../__fixtures__/post-fixtures';
import type {
  BlogDetailDto,
  PostListResponseDto,
  PostDetailResponseDto,
  CreatePostRequestDto,
  UpdatePostRequestDto,
  RelatedPostsResponseDto,
} from '../types/post.dto';
import type { Article, RelatedGroup } from '../types/post.model';

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  /** Lọc theo thẻ: backend không hỗ trợ → lọc client-side sau khi map. */
  tag?: string;
  q?: string;
}

function matchesCategory(dto: BlogDetailDto, category?: string): boolean {
  if (!category) return true;
  return (dto.categories || []).some((c) => c.id === category || c.slug === category);
}

function matchesQuery(dto: BlogDetailDto, q?: string): boolean {
  if (!q) return true;
  const query = q.toLowerCase();
  const title = dto.revision?.title?.toLowerCase() || '';
  const excerpt = dto.revision?.excerpt?.toLowerCase() || '';
  return title.includes(query) || excerpt.includes(query);
}

export const postApi = {
  /**
   * Lấy danh sách bài viết blog kiến thức thuần chay
   */
  getArticles: async (params?: ArticleQueryParams): Promise<PaginationResult<Article>> => {
    const { tag, ...backendParams } = params || {};
    try {
      const res = await api.get<PostListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
        params: {
          ...backendParams,
          type: PostType.BLOG,
        },
        silent: true,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        const page = postMapper.toPaginationFromEnvelope(res.data.data, res.data.meta);
        // Backend không lọc theo tag → lọc client-side trên kết quả đã map.
        if (tag) {
          const items = page.items.filter((a) => a.tags.includes(tag));
          return { items, metadata: { ...page.metadata, totalItems: items.length } };
        }
        return page;
      }
      // Backend đã trả lời nhưng payload lạ: coi như lỗi thật, không đoán.
      throw new Error('Phản hồi danh sách bài viết không đúng định dạng.');
    } catch (err) {
      // Endpoint còn PLANNED (lỗi mạng / route 404 / 5xx) → fixture demo.
      // Lỗi nghiệp vụ 4xx (quyền, validation...) → ném tiếp cho UI xử lý.
      if (!shouldFallbackToFixtures(err, 'list')) throw err;
    }

    let filtered = MOCK_ARTICLE_DTOS.filter(
      (a) => matchesCategory(a, params?.category) && matchesQuery(a, params?.q)
    );
    if (tag) {
      filtered = filtered.filter((a) => a.revision?.tags?.includes(tag));
    }

    return postMapper.toPaginationFromEnvelope(filtered, {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: filtered.length,
      totalPages: 1,
    });
  },

  /**
   * Lấy chi tiết bài viết theo id hoặc slug
   */
  getArticleDetail: async (idOrSlug: string): Promise<Article> => {
    try {
      const res = await api.get<PostDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(idOrSlug), {
        silent: true,
      });

      if (res.data?.success && res.data.data) {
        return postMapper.toModel(res.data.data as BlogDetailDto);
      }
      throw new Error('Phản hồi chi tiết bài viết không đúng định dạng.');
    } catch (err) {
      // 404 từ backend hoặc lỗi nghiệp vụ 4xx → ném tiếp để trang [id] hiện 404.
      if (!shouldFallbackToFixtures(err, 'detail')) throw err;
    }

    const found = MOCK_ARTICLE_DTOS.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
    if (found) {
      return postMapper.toModel(found);
    }

    // Không có trong fixture: báo 404 thật thay vì trả bài viết giả.
    throw createNotFoundError({ resourceLabel: 'Bài viết' });
  },

  /**
   * Lấy danh sách nội dung liên quan (công thức, video, bài viết khác).
   * Contract `GET /posts/:id/related` trả object nhóm `{ recipes, blogs, videos }`.
   */
  getRelatedPosts: async (id: string): Promise<RelatedGroup> => {
    try {
      const res = await api.get<RelatedPostsResponseDto>(API_ENDPOINTS.POSTS.RELATED(id), {
        silent: true,
      });

      if (res.data?.success && res.data.data && !Array.isArray(res.data.data)) {
        return postMapper.toRelatedGroup(res.data.data);
      }
      throw new Error('Phản hồi nội dung liên quan không đúng định dạng.');
    } catch (err) {
      if (!shouldFallbackToFixtures(err, 'list')) throw err;
    }

    // Endpoint còn PLANNED: trả nhóm rỗng, khối related ẩn đi thay vì hard-code.
    return { recipes: [], blogs: [], videos: [] };
  },

  /**
   * Tạo bài viết mới
   */
  createArticle: async (article: Partial<Article>): Promise<Article> => {
    const payload: CreatePostRequestDto = postMapper.toCreateDto(article);
    try {
      const res = await api.post<PostDetailResponseDto>(API_ENDPOINTS.POSTS.CREATE, payload);
      if (res.data?.success && res.data.data) {
        return postMapper.toModel(res.data.data as BlogDetailDto);
      }
      throw new Error('Phản hồi tạo bài viết không đúng định dạng.');
    } catch (err) {
      // Lỗi nghiệp vụ 4xx (validation, quyền...) → ném tiếp để form hiện lỗi thật.
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }

    return postMapper.toModel({
      ...MOCK_ARTICLE_DTOS[0],
      revision: {
        ...MOCK_ARTICLE_DTOS[0].revision,
        title: article.title || 'Bài viết mới',
      },
    });
  },

  /**
   * Cập nhật bài viết (backend yêu cầu `expectedVersion` chống ghi đè đồng thời)
   */
  updateArticle: async (id: string, article: Partial<Article>): Promise<Article> => {
    const payload: UpdatePostRequestDto = postMapper.toUpdateDto(article);
    try {
      const res = await api.patch<PostDetailResponseDto>(API_ENDPOINTS.POSTS.UPDATE(id), payload);
      if (res.data?.success && res.data.data) {
        return postMapper.toModel(res.data.data as BlogDetailDto);
      }
      throw new Error('Phản hồi cập nhật bài viết không đúng định dạng.');
    } catch (err) {
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }

    return postMapper.toModel(MOCK_ARTICLE_DTOS[0]);
  },

  /**
   * Xóa mềm bài viết (backend yêu cầu `?expectedVersion`)
   */
  deleteArticle: async (id: string, expectedVersion?: number): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.POSTS.DELETE(id), {
        params: expectedVersion !== undefined ? { expectedVersion } : undefined,
      });
    } catch (err) {
      // 403/401 khi đã có API thật → ném tiếp để toast báo quyền, không im lặng.
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }
  },
};
