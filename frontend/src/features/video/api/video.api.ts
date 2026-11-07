import api from '@/lib/axios';
import { POSTS_ENDPOINTS } from '@/common/constants/endpoints/posts.endpoints';
import { PostType } from '@/common/enums';
import type { PaginationResult } from '@/types/api';
import { videoMapper } from '../mappers/video.mapper';
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

export const videoApi = {
  getVideos: async (params?: VideoQueryParams): Promise<PaginationResult<Video>> => {
    const res = await api.get<PostListResponseDto>(POSTS_ENDPOINTS.LIST, {
      params: { ...params, type: PostType.VIDEO },
      silent: true,
    });
    if (res.data?.success && Array.isArray(res.data.data)) {
      return videoMapper.toPaginationFromEnvelope(res.data.data as VideoDetailDto[], res.data.meta);
    }
    throw new Error('Phản hồi danh sách video không đúng định dạng.');
  },

  getVideoDetail: async (idOrSlug: string): Promise<Video> => {
    const res = await api.get<PostDetailResponseDto>(POSTS_ENDPOINTS.DETAIL(idOrSlug), {
      silent: true,
    });
    if (res.data?.success && res.data.data)
      return videoMapper.toModel(res.data.data as VideoDetailDto);
    throw new Error('Phản hồi chi tiết video không đúng định dạng.');
  },

  createVideo: async (video: Partial<Video>): Promise<Video> => {
    const payload: CreateVideoRequestDto = videoMapper.toCreateDto(video);
    const res = await api.post<PostDetailResponseDto>(POSTS_ENDPOINTS.CREATE, payload);
    if (res.data?.success && res.data.data)
      return videoMapper.toModel(res.data.data as VideoDetailDto);
    throw new Error('Phản hồi tạo video không đúng định dạng.');
  },

  updateVideo: async (id: string, video: Partial<Video>): Promise<Video> => {
    const payload: UpdateVideoRequestDto = videoMapper.toUpdateDto(video);
    const res = await api.patch<PostDetailResponseDto>(POSTS_ENDPOINTS.UPDATE(id), payload);
    if (res.data?.success && res.data.data)
      return videoMapper.toModel(res.data.data as VideoDetailDto);
    throw new Error('Phản hồi cập nhật video không đúng định dạng.');
  },

  deleteVideo: async (id: string, expectedVersion?: number): Promise<void> => {
    await api.delete(POSTS_ENDPOINTS.DELETE(id), {
      params: expectedVersion !== undefined ? { expectedVersion } : undefined,
    });
  },
};
