import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType } from '@/common/enums';
import { videoMapper } from '../mappers/video.mapper';
import type {
  CreateVideoPostRequestDto,
  RelatedVideosResponseDto,
  VideoDetailResponseDto,
  VideoListResponseDto,
} from '../types/video.dto';
import type { CookingVideo, VideoPaginationResult } from '../types/video.model';

export interface VideoQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
}

export interface CreateVideoInput {
  title: string;
  excerpt?: string;
  body: string;
  youtubeUrl: string;
  categoryIds?: string[];
  tags?: string[];
}

export const videoApi = {
  getVideos: async (params?: VideoQueryParams): Promise<VideoPaginationResult> => {
    const res = await api.get<VideoListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
      params: { ...params, type: PostType.VIDEO },
      silent: true,
    });
    return videoMapper.toPaginationFromEnvelope(res.data.data, res.data.meta);
  },

  getVideoDetail: async (idOrSlug: string): Promise<CookingVideo> => {
    const res = await api.get<VideoDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(idOrSlug), {
      silent: true,
    });
    return videoMapper.toModel(res.data.data);
  },

  getRelatedVideos: async (id: string, limitPerType = 3): Promise<CookingVideo[]> => {
    const res = await api.get<RelatedVideosResponseDto>(API_ENDPOINTS.POSTS.RELATED(id), {
      params: { limitPerType },
      silent: true,
    });
    return videoMapper.toModelList(res.data.data.videos ?? []);
  },

  createVideo: async (input: CreateVideoInput): Promise<CookingVideo> => {
    const payload: CreateVideoPostRequestDto = {
      type: PostType.VIDEO,
      title: input.title,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(input.categoryIds?.length ? { categoryIds: input.categoryIds } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
      media: [
        {
          provider: 'YOUTUBE',
          kind: 'VIDEO',
          secureUrl: input.youtubeUrl,
        },
      ],
      body: input.body,
    };

    const res = await api.post<VideoDetailResponseDto>(API_ENDPOINTS.POSTS.LIST, payload, {
      silent: true,
    });
    return videoMapper.toModel(res.data.data);
  },
};
