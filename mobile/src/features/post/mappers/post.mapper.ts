import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import { PaginationResult } from '@/types/api';
import { authorFromDto, coverUrlFromMedia, firstCategory, getPostStatusLabel, parsePostStatus } from './post-shared';
import type { BasePostDto, PostMediaDto, PostRevisionDto } from '../types/post.dto';
import type { Article } from '../types/post.model';

function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const ARTICLE_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80';

/** PostMapper cho Cẩm nang — bản đọc, đồng bộ `frontend/.../post.mapper.ts`. */
export class PostMapper extends BaseMapper<BasePostDto, Article> {
  toModel(dto: BasePostDto | null | undefined): Article {
    const status = parsePostStatus(safeString(pickField(dto, ['status'], 'DRAFT')));
    const revision = pickField<PostRevisionDto | null>(dto, ['revision'], null);
    const body = safeString(revision?.body);
    const publishedAt = safeDate(pickField(dto, ['publishedAt', 'published_at'], null));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(revision?.title, 'Bài viết chưa có tiêu đề'),
      slug: safeString(pickField(dto, ['slug'], '')),
      status,
      statusLabel: getPostStatusLabel(status),
      version: safeNumber(pickField(dto, ['version'], 1)),
      author: authorFromDto(dto, 'Tác giả VeggieConnect'),
      category: firstCategory(dto),
      coverImageUrl: coverUrlFromMedia(
        pickField<PostMediaDto[]>(dto, ['media'], []),
        ARTICLE_FALLBACK_COVER
      ),
      excerpt: safeString(revision?.excerpt),
      content: body,
      tags: safeArray<string>(revision?.tags),
      readingTimeMinutes: estimateReadingMinutes(body),
      publishedAt,
      formattedPublishedAt: formatDate(publishedAt),
      stats: { views: 0, likes: 0, comments: 0 },
    };
  }

  toPaginationFromEnvelope(
    data: (BasePostDto | null | undefined)[] | null | undefined,
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null
  ): PaginationResult<Article> {
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

export const postMapper = new PostMapper();
