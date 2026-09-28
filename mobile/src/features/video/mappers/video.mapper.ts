import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import { authorFromDto, coverUrlFromMedia, firstCategory, getPostStatusLabel, parsePostStatus } from '@/features/post/mappers/post-shared';
import type { PostMediaDto, PostRevisionDto } from '@/features/post/types/post.dto';
import type { VideoDetailDto } from '../types/video.dto';
import type { CookingVideo, VideoPaginationResult } from '../types/video.model';

const VIDEO_FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&auto=format&fit=crop&q=80';

function getYoutubeVideoId(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '');
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] ?? '';
      return parsed.searchParams.get('v') ?? '';
    }
  } catch {
    return '';
  }

  return '';
}

function videoMediaFromList(media: PostMediaDto[] | null | undefined): PostMediaDto | null {
  const list = Array.isArray(media) ? media : [];
  return list.find((item) => safeString(item?.kind).toUpperCase() === 'VIDEO') ?? null;
}

function coverMediaFromList(media: PostMediaDto[] | null | undefined): CookingVideo['coverMedia'] {
  const list = Array.isArray(media) ? media : [];
  const cover = list.find((item) => safeString(item?.kind).toUpperCase() === 'COVER_IMAGE');
  if (!cover?.publicId || !cover.secureUrl || !cover.mimeType || !cover.bytes) return null;

  return {
    publicId: cover.publicId,
    secureUrl: cover.secureUrl,
    mimeType: cover.mimeType,
    bytes: cover.bytes,
    ...(cover.width ? { width: cover.width } : {}),
    ...(cover.height ? { height: cover.height } : {}),
  };
}

function thumbnailFromMedia(media: PostMediaDto[] | null | undefined): string {
  const coverUrl = coverUrlFromMedia(media, '');
  if (coverUrl) return coverUrl;

  const videoUrl = safeString(videoMediaFromList(media)?.secureUrl);
  const youtubeId = getYoutubeVideoId(videoUrl);
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return VIDEO_FALLBACK_THUMBNAIL;
}

export class VideoMapper extends BaseMapper<VideoDetailDto, CookingVideo> {
  toModel(dto: VideoDetailDto | null | undefined): CookingVideo {
    const status = parsePostStatus(safeString(pickField(dto, ['status'], 'DRAFT')));
    const revision = pickField<PostRevisionDto | null>(dto, ['revision'], null);
    const media = pickField<PostMediaDto[]>(dto, ['media'], []);
    const videoMedia = videoMediaFromList(media);
    const publishedAt = safeDate(pickField(dto, ['publishedAt', 'published_at'], null));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(revision?.title, 'Video nấu ăn chưa có tiêu đề'),
      slug: safeString(pickField(dto, ['slug'], '')),
      status,
      statusLabel: getPostStatusLabel(status),
      version: safeNumber(pickField(dto, ['version'], 1)),
      author: authorFromDto(dto, 'Bếp VeggieConnect'),
      category: firstCategory(dto),
      thumbnailUrl: thumbnailFromMedia(media),
      coverMedia: coverMediaFromList(media),
      videoUrl: safeString(videoMedia?.secureUrl),
      provider: safeString(videoMedia?.provider, 'VIDEO'),
      durationSeconds: videoMedia?.durationSeconds == null ? null : safeNumber(videoMedia.durationSeconds, 0),
      excerpt: safeString(revision?.excerpt),
      summary: safeString(revision?.body),
      tags: safeArray<string>(revision?.tags),
      publishedAt,
      formattedPublishedAt: formatDate(publishedAt),
    };
  }

  toPaginationFromEnvelope(
    data: (VideoDetailDto | null | undefined)[] | null | undefined,
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null
  ): VideoPaginationResult {
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
}

export const videoMapper = new VideoMapper();
