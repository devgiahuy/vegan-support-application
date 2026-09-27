import type { BasePostDto } from '@/features/post/types/post.dto';

export interface VideoDetailDto extends BasePostDto {
  recipe?: null;
}

export interface VideoListResponseDto {
  success: boolean;
  data: VideoDetailDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VideoDetailResponseDto {
  success: boolean;
  data: VideoDetailDto;
  meta?: null;
}

export interface RelatedVideosResponseDto {
  success: boolean;
  data: {
    videos?: VideoDetailDto[];
  };
  meta?: {
    rankingVersion?: string;
    limitPerType?: number;
  };
}

export interface CreateVideoPostRequestDto {
  type: 'VIDEO';
  title: string;
  excerpt?: string;
  categoryIds?: string[];
  tags?: string[];
  media: (
    {
      provider: 'YOUTUBE';
      kind: 'VIDEO';
      secureUrl: string;
    } | {
      provider: 'CLOUDINARY';
      kind: 'COVER_IMAGE';
      publicId: string;
      secureUrl: string;
      mimeType: string;
      bytes: number;
      width?: number;
      height?: number;
    }
  )[];
  body: string;
}
