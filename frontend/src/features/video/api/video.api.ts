import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import { videoMapper } from '../mappers/video.mapper';
import { shouldFallbackToFixtures, createNotFoundError } from '@/features/post/utils/api-fallback';
import { MOCK_VIDEO_DTOS } from '../__fixtures__/video-fixtures';
import type {
  VideoDetailDto,
  CreateVideoRequestDto,
  UpdateVideoRequestDto,
} from '../types/video.dto';
import type { Video } from '../types/video.model';
import type { PostListResponseDto, PostDetailResponseDto } from '@/features/post/types/post.dto';

export interface VideoQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  q?: string;
}

function matchesCategory(dto: VideoDetailDto, category?: string): boolean {
  if (!category) return true;
  return (dto.categories || []).some((c) => c.id === category || c.slug === category);
}

function matchesQuery(dto: VideoDetailDto, q?: string): boolean {
  if (!q) return true;
  const query = q.toLowerCase();
  const title = dto.revision?.title?.toLowerCase() || '';
  const body = dto.revision?.body?.toLowerCase() || '';
  return title.includes(query) || body.includes(query);
}

export const videoApi = {
  /**
   * Lấy danh sách video nấu ăn
   */
  getVideos: async (params?: VideoQueryParams): Promise<PaginationResult<Video>> => {
    try {
      const res = await api.get<PostListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
        params: {
          ...params,
          type: PostType.VIDEO,
        },
        silent: true,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        return videoMapper.toPaginationFromEnvelope(
          res.data.data as VideoDetailDto[],
          res.data.meta
        );
      }
      throw new Error('Phản hồi danh sách video không đúng định dạng.');
    } catch (err) {
      // Endpoint còn PLANNED (lỗi mạng / route 404 / 5xx) → fixture demo.
      // Lỗi nghiệp vụ 4xx → ném tiếp cho UI xử lý.
      if (!shouldFallbackToFixtures(err, 'list')) throw err;
    }

    const filtered = MOCK_VIDEO_DTOS.filter(
      (v) => matchesCategory(v, params?.category) && matchesQuery(v, params?.q)
    );

    return videoMapper.toPaginationFromEnvelope(filtered, {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: filtered.length,
      totalPages: 1,
    });
  },

  /**
   * Lấy chi tiết video theo ID hoặc slug
   */
  getVideoDetail: async (idOrSlug: string): Promise<Video> => {
    try {
      const res = await api.get<PostDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(idOrSlug), {
        silent: true,
      });

      if (res.data?.success && res.data.data) {
        return videoMapper.toModel(res.data.data as VideoDetailDto);
      }
      throw new Error('Phản hồi chi tiết video không đúng định dạng.');
    } catch (err) {
      // 404 từ backend hoặc lỗi nghiệp vụ 4xx → ném tiếp để trang [id] hiện 404.
      if (!shouldFallbackToFixtures(err, 'detail')) throw err;
    }

    const found = MOCK_VIDEO_DTOS.find((v) => v.id === idOrSlug || v.slug === idOrSlug);
    if (found) {
      return videoMapper.toModel(found);
    }

    // Không có trong fixture: báo 404 thật thay vì trả video giả.
    throw createNotFoundError({ resourceLabel: 'Video' });
  },

  /**
   * Tạo video mới
   */
  createVideo: async (video: Partial<Video>): Promise<Video> => {
    const payload: CreateVideoRequestDto = videoMapper.toCreateDto(video);
    try {
      const res = await api.post<PostDetailResponseDto>(API_ENDPOINTS.POSTS.CREATE, payload);
      if (res.data?.success && res.data.data) {
        return videoMapper.toModel(res.data.data as VideoDetailDto);
      }
      throw new Error('Phản hồi tạo video không đúng định dạng.');
    } catch (err) {
      // Lỗi nghiệp vụ 4xx (validation, quyền...) → ném tiếp để form hiện lỗi thật.
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }

    return videoMapper.toModel({
      ...MOCK_VIDEO_DTOS[0],
      revision: {
        ...MOCK_VIDEO_DTOS[0].revision,
        title: video.title || 'Video mới',
      },
    });
  },

  /**
   * Cập nhật video (backend yêu cầu `expectedVersion`)
   */
  updateVideo: async (id: string, video: Partial<Video>): Promise<Video> => {
    const payload: UpdateVideoRequestDto = videoMapper.toUpdateDto(video);
    try {
      const res = await api.patch<PostDetailResponseDto>(API_ENDPOINTS.POSTS.UPDATE(id), payload);
      if (res.data?.success && res.data.data) {
        return videoMapper.toModel(res.data.data as VideoDetailDto);
      }
      throw new Error('Phản hồi cập nhật video không đúng định dạng.');
    } catch (err) {
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }

    return videoMapper.toModel(MOCK_VIDEO_DTOS[0]);
  },

  /**
   * Xóa video (backend yêu cầu `?expectedVersion`)
   */
  deleteVideo: async (id: string, expectedVersion?: number): Promise<void> => {
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
