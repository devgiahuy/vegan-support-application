import type { BasePostDto, MediaInputDto } from '@/features/post/types/post.dto';

export interface VideoDetailDto extends BasePostDto {
  type?: string;
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

export interface CreateVideoRequestDto {
  type: 'VIDEO';
  title: string;
  slug?: string;
  excerpt?: string;
  categoryIds: string[];
  tags?: string[];
  media: MediaInputDto[];
  body: string;
}

export interface UpdateVideoRequestDto extends Partial<CreateVideoRequestDto> {
  expectedVersion: number;
}
