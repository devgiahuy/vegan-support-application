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
  coverMedia?: {
    publicId: string;
    secureUrl: string;
    mimeType: string;
    bytes: number;
    width?: number;
    height?: number;
  };
}

export interface UpdateVideoInput extends CreateVideoInput {
  expectedVersion: number;
}

function buildVideoMedia(input: Pick<CreateVideoInput, 'coverMedia' | 'youtubeUrl'>): CreateVideoPostRequestDto['media'] {
  return [
    ...(input.coverMedia
      ? [
          {
            provider: 'CLOUDINARY' as const,
            kind: 'COVER_IMAGE' as const,
            publicId: input.coverMedia.publicId,
            secureUrl: input.coverMedia.secureUrl,
            mimeType: input.coverMedia.mimeType,
            bytes: input.coverMedia.bytes,
            ...(input.coverMedia.width ? { width: input.coverMedia.width } : {}),
            ...(input.coverMedia.height ? { height: input.coverMedia.height } : {}),
          },
        ]
      : []),
    {
      provider: 'YOUTUBE',
      kind: 'VIDEO',
      secureUrl: input.youtubeUrl,
    },
  ];
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
      media: buildVideoMedia(input),
      body: input.body,
    };

    const res = await api.post<VideoDetailResponseDto>(API_ENDPOINTS.POSTS.LIST, payload, {
      silent: true,
    });
    return videoMapper.toModel(res.data.data);
  },

  /**
   * Sửa video của chính mình rồi gửi lại để duyệt: `PATCH /posts/:id` (tạo draft
   * revision mới) → `POST /posts/:id/submit`. `expectedVersion` là `version` hiện tại.
   */
  updateVideo: async (id: string, input: UpdateVideoInput): Promise<CookingVideo> => {
    const payload = {
      type: PostType.VIDEO,
      title: input.title,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(input.categoryIds?.length ? { categoryIds: input.categoryIds } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
      media: buildVideoMedia(input),
      body: input.body,
      expectedVersion: input.expectedVersion,
    };

    const updateRes = await api.patch<VideoDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(id), payload);
    const updated = updateRes.data.data;
    const revisionId = updated.revision?.id;
    const newExpectedVersion = updated.version;

    if (revisionId && newExpectedVersion) {
      try {
        const submitRes = await api.post<VideoDetailResponseDto>(
          API_ENDPOINTS.POSTS.SUBMIT(updated.id ?? ''),
          { revisionId, expectedVersion: newExpectedVersion }
        );
        return videoMapper.toModel(submitRes.data.data);
      } catch {
        return videoMapper.toModel(updated);
      }
    }
    return videoMapper.toModel(updated);
  },
};
