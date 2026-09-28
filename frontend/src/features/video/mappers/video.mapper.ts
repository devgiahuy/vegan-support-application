import { BaseMapper, pickField, safeString, safeDate, safeNumber } from '@/lib/mapper';
import { youtubeThumbnailFromUrl } from '@/lib/safe-image';
import { formatDate } from '@/lib/utils';
import { VideoSource } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import {
  authorFromDto,
  coverMediaInput,
  coverUrlFromMedia,
  firstCategory,
  getPostStatusLabel,
  parsePostStatus,
} from '@/features/post/mappers/post.mapper';
import type { PostMediaDto, PostRevisionDto } from '@/features/post/types/post.dto';
import type {
  VideoDetailDto,
  CreateVideoRequestDto,
  UpdateVideoRequestDto,
} from '../types/video.dto';
import type { Video } from '../types/video.model';

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function detectVideoSource(url: string, rawSource?: string): VideoSource {
  const normalized = safeString(rawSource).toUpperCase();
  if (normalized === 'YOUTUBE' || normalized === 'CLOUDINARY') {
    return normalized as VideoSource;
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return VideoSource.YOUTUBE;
  }
  return VideoSource.CLOUDINARY;
}

function videoMediaFromDto(dto: VideoDetailDto | null | undefined): PostMediaDto | null {
  const media = pickField<PostMediaDto[] | null>(dto, ['media'], null);
  if (!Array.isArray(media)) return null;
  return (
    media.find((m) => safeString(m?.kind).toUpperCase() === 'VIDEO' && safeString(m?.secureUrl)) ??
    null
  );
}

const VIDEO_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80';

export class VideoMapper extends BaseMapper<VideoDetailDto, Video> {
  toModel(dto: VideoDetailDto | null | undefined): Video {
    const status = parsePostStatus(safeString(pickField(dto, ['status'], 'DRAFT')));
    const revision = pickField<PostRevisionDto | null>(dto, ['revision'], null);
    const body = safeString(revision?.body);
    const publishedAt = safeDate(pickField(dto, ['publishedAt', 'published_at'], null));

    const videoMedia = videoMediaFromDto(dto);
    const videoUrl = safeString(videoMedia?.secureUrl);
    const durationSeconds = safeNumber(videoMedia?.durationSeconds, 0);
    const videoSource = detectVideoSource(videoUrl, videoMedia?.provider);
    const author = authorFromDto(dto, 'Bếp Chay An Nhiên');
    // Video YouTube không ảnh bìa → dùng thumbnail i.ytimg.com (đã allow remotePatterns),
    // thay vì để URL watch lọt vào `next/image` gây crash.
    const rawCover = coverUrlFromMedia(pickField<PostMediaDto[]>(dto, ['media'], []), '');
    const coverImageUrl = rawCover || youtubeThumbnailFromUrl(videoUrl) || VIDEO_FALLBACK_COVER;

    const revisionId = safeString(revision?.id);
    const version = safeNumber(pickField(dto, ['version'], 1));
    const revisionVersion = safeNumber(revision?.version, version);
    const publishedRevisionVersion = pickField<number | null>(
      dto,
      ['publishedRevisionVersion'],
      null
    );

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(revision?.title, 'Video chưa có tiêu đề'),
      slug: safeString(pickField(dto, ['slug'], '')),
      status,
      statusLabel: getPostStatusLabel(status),
      version,
      revisionId: revisionId || undefined,
      revisionVersion,
      publishedRevisionVersion,
      author,
      category: firstCategory(dto),
      coverImageUrl,
      coverMedia: null,
      videoUrl,
      videoSource,
      videoMedia: videoMedia
        ? {
            publicId: videoMedia.publicId ?? undefined,
            mimeType: videoMedia.mimeType ?? undefined,
            bytes: videoMedia.bytes ?? undefined,
          }
        : null,
      durationSeconds,
      formattedDuration: formatDuration(durationSeconds),
      description: body || safeString(revision?.excerpt),
      ingredients: [],
      steps: [],
      publishedAt,
      formattedPublishedAt: formatDate(publishedAt),
      stats: { views: 0, likes: 0, comments: 0 },
    };
  }

  toPaginationFromEnvelope(
    data: (VideoDetailDto | null | undefined)[] | null | undefined,
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null
  ): PaginationResult<Video> {
    const items = this.toModelList(data);
    return {
      items,
      metadata: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 20),
        totalItems: safeNumber(meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
      },
    };
  }

  toCreateDto(domain: Partial<Video>): CreateVideoRequestDto {
    const media: CreateVideoRequestDto['media'] = [];
    // URL blob:/mock chỉ là preview tạm khi backend chưa cấp chữ ký — loại khỏi
    // payload để backend khỏi 400 khó hiểu (uploader đã toast cảnh báo riêng).
    if (domain.videoUrl && !domain.videoUrl.startsWith('blob:')) {
      if (domain.videoSource === VideoSource.YOUTUBE) {
        media.push({
          provider: 'YOUTUBE',
          kind: 'VIDEO',
          secureUrl: domain.videoUrl,
        });
      } else if (domain.videoMedia?.assetId) {
        media.push({
          provider: 'CLOUDINARY',
          kind: 'VIDEO',
          assetId: domain.videoMedia.assetId,
        });
      }
    }
    return {
      type: 'VIDEO',
      title: domain.title || '',
      excerpt: domain.description?.slice(0, 500) || undefined,
      categoryIds: domain.category?.id ? [domain.category.id] : [],
      tags: [],
      media: [...coverMediaInput(domain.coverImageUrl, domain.coverMedia), ...media],
      body: domain.description || '',
    };
  }

  toUpdateDto(domain: Partial<Video>): UpdateVideoRequestDto {
    return {
      ...this.toCreateDto(domain),
      expectedVersion: typeof domain.version === 'number' ? domain.version : 1,
    };
  }
}

export const videoMapper = new VideoMapper();
