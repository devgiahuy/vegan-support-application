import { BaseMapper, pickField, safeString, safeDate, safeNumber, safeArray } from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import { PostStatus, PostType } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import type {
  BasePostDto,
  BlogDetailDto,
  CreatePostRequestDto,
  MediaInputDto,
  PostAuthorDto,
  PostCategorySummaryDto,
  PostMediaDto,
  PostRevisionDto,
  UpdatePostRequestDto,
} from '../types/post.dto';
import type { Article, RelatedGroup, RelatedItem } from '../types/post.model';

/** Nhãn tiếng Việt cho mọi trạng thái vòng đời backend `PostStatus`. */
export function getPostStatusLabel(status: PostStatus): string {
  switch (status) {
    case PostStatus.PUBLISHED:
      return 'Đã xuất bản';
    case PostStatus.PENDING_REVIEW:
      return 'Chờ duyệt';
    case PostStatus.FLAGGED:
      return 'Cần chỉnh sửa';
    case PostStatus.QUARANTINED:
      return 'Bị tạm giữ';
    case PostStatus.REJECTED:
      return 'Từ chối';
    case PostStatus.HIDDEN:
      return 'Đã ẩn';
    case PostStatus.ARCHIVED:
      return 'Đã lưu trữ';
    case PostStatus.DELETED:
      return 'Đã xóa';
    default:
      return 'Bản nháp';
  }
}

export function parsePostStatus(raw: string): PostStatus {
  return (
    Object.values(PostStatus).includes(raw as PostStatus) ? raw : PostStatus.DRAFT
  ) as PostStatus;
}

/** Ảnh bìa = media `COVER_IMAGE` đầu tiên, bỏ qua media VIDEO/link YouTube để khỏi lọt vào `next/image`. */
export function coverUrlFromMedia(
  media: (PostMediaDto | null | undefined)[] | null | undefined,
  fallback: string
): string {
  const isImageLike = (m: PostMediaDto | null | undefined): boolean => {
    const url = safeString(m?.secureUrl);
    if (!url || url.startsWith('blob:')) return false;
    if (url.includes('youtube.com/watch') || url.includes('youtu.be')) return false;
    return true;
  };
  const list = safeArray<PostMediaDto>(media);
  const cover = list.find(
    (m) => safeString(m?.kind).toUpperCase() === 'COVER_IMAGE' && isImageLike(m)
  );
  if (cover?.secureUrl) return cover.secureUrl as string;
  // Fallback: media ảnh đầu tiên (COVER_IMAGE/IMAGE/THUMBNAIL), tuyệt đối bỏ qua VIDEO.
  const firstImage = list.find(
    (m) =>
      safeString(m?.kind).toUpperCase() !== 'VIDEO' &&
      (safeString(m?.kind).toUpperCase() === 'IMAGE' ||
        safeString(m?.kind).toUpperCase() === 'THUMBNAIL' ||
        safeString(m?.kind).toUpperCase() === 'COVER_IMAGE' ||
        !safeString(m?.kind)) &&
      isImageLike(m)
  );
  // Trường hợp backend chỉ trả media VIDEO (video YouTube không ảnh bìa) → dùng fallback,
  // tầng UI sẽ tự đổi YouTube watch URL sang thumbnail `i.ytimg.com` khi cần.
  if (firstImage?.secureUrl) return firstImage.secureUrl as string;
  return fallback;
}

export function firstCategory(dto: BasePostDto | null | undefined): { id: string; name: string } {
  const categories = pickField<PostCategorySummaryDto[]>(dto, ['categories'], []);
  const first = categories[0];
  return {
    id: safeString(first?.id),
    name: safeString(first?.name, 'Chưa phân loại'),
  };
}

export function authorFromDto(
  dto: BasePostDto | null | undefined,
  fallbackName: string
): {
  id: string;
  name: string;
  avatarUrl: string | null;
} {
  const author = pickField<PostAuthorDto | null>(dto, ['author'], null);
  const name = safeString(author?.displayName, fallbackName);
  const avatar = safeString(author?.avatarUrl, '');
  return { id: safeString(author?.id), name, avatarUrl: avatar || null };
}

function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Ráp `media[]` cho ảnh bìa khi tạo/sửa. Chỉ hợp lệ khi có `assetId` từ reservation backend Phase 15. */
export function coverMediaInput(
  coverImageUrl: string | undefined,
  meta?: { assetId?: string; publicId?: string; mimeType?: string; bytes?: number } | null
): MediaInputDto[] {
  if (!coverImageUrl || coverImageUrl.startsWith('blob:')) return [];
  if (!meta?.assetId) return [];
  return [
    {
      provider: 'CLOUDINARY',
      kind: 'COVER_IMAGE',
      assetId: meta.assetId,
    },
  ];
}

const ARTICLE_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80';
const RELATED_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

export class PostMapper extends BaseMapper<BlogDetailDto, Article> {
  toModel(dto: BlogDetailDto | null | undefined): Article {
    const status = parsePostStatus(safeString(pickField(dto, ['status'], 'DRAFT')));
    const revision = pickField<PostRevisionDto | null>(dto, ['revision'], null);
    const body = safeString(revision?.body);
    const revisionId = safeString(revision?.id);
    const version = safeNumber(pickField(dto, ['version'], 1));
    const revisionVersion = safeNumber(revision?.version, version);
    const publishedRevisionVersion = pickField<number | null>(
      dto,
      ['publishedRevisionVersion'],
      null
    );
    const publishedAt = safeDate(pickField(dto, ['publishedAt', 'published_at'], null));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(revision?.title, 'Bài viết chưa có tiêu đề'),
      slug: safeString(pickField(dto, ['slug'], '')),
      status,
      statusLabel: getPostStatusLabel(status),
      version,
      revisionId: revisionId || undefined,
      revisionVersion,
      publishedRevisionVersion,
      author: authorFromDto(dto, 'Tác giả VeggieConnect'),
      category: firstCategory(dto),
      coverImageUrl: coverUrlFromMedia(
        pickField<PostMediaDto[]>(dto, ['media'], []),
        ARTICLE_FALLBACK_COVER
      ),
      coverMedia: null,
      excerpt: safeString(revision?.excerpt),
      content: body,
      tags: safeArray<string>(revision?.tags),
      readingTimeMinutes: estimateReadingMinutes(body),
      publishedAt,
      formattedPublishedAt: formatDate(publishedAt),
      // Backend chưa có lượt xem/thích/bình luận: giữ 0 trung thực thay vì số giả.
      stats: { views: 0, likes: 0, comments: 0 },
    };
  }

  toPaginationFromEnvelope(
    data: (BlogDetailDto | null | undefined)[] | null | undefined,
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

  toCreateDto(domain: Partial<Article>): CreatePostRequestDto {
    return {
      type: PostType.BLOG,
      title: domain.title || '',
      excerpt: domain.excerpt || undefined,
      categoryIds: domain.category?.id ? [domain.category.id] : [],
      tags: domain.tags || [],
      media: coverMediaInput(domain.coverImageUrl, domain.coverMedia),
      body: domain.content || '',
    };
  }

  toUpdateDto(domain: Partial<Article>): UpdatePostRequestDto {
    return {
      ...this.toCreateDto(domain),
      expectedVersion: typeof domain.version === 'number' ? domain.version : 1,
    };
  }

  toRelatedItem(dto: BasePostDto | null | undefined): RelatedItem {
    const revision = pickField<PostRevisionDto | null>(dto, ['revision'], null);
    const media = safeArray<PostMediaDto>(pickField<PostMediaDto[]>(dto, ['media'], []));
    const videoMedia = media.find((m) => safeString(m?.kind).toUpperCase() === 'VIDEO');
    const recipe = pickField<{ difficulty?: string } | null>(dto, ['recipe'], null);
    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(revision?.title, 'Nội dung liên quan'),
      slug: safeString(pickField(dto, ['slug'], '')),
      coverImageUrl: coverUrlFromMedia(media, RELATED_FALLBACK_COVER),
      type: safeString(pickField(dto, ['type'], 'RECIPE')),
      difficulty: safeString(recipe?.difficulty, ''),
      excerpt: safeString(revision?.excerpt, ''),
      videoUrl: safeString(videoMedia?.secureUrl, ''),
      durationSeconds: safeNumber(videoMedia?.durationSeconds, 0),
    };
  }

  toRelatedList(items?: (BasePostDto | null | undefined)[] | null): RelatedItem[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => this.toRelatedItem(item));
  }

  /**
   * Map object nhóm related `{ recipes, blogs, videos }` theo contract
   * `GET /posts/:id/related`. Mỗi nhóm thiếu hoặc không phải mảng → rỗng.
   */
  toRelatedGroup(
    dto: { recipes?: unknown; blogs?: unknown; videos?: unknown } | null | undefined
  ): RelatedGroup {
    const pickGroup = (value: unknown): RelatedItem[] => {
      if (!Array.isArray(value)) return [];
      return this.toRelatedList(value as (BasePostDto | null | undefined)[]);
    };
    return {
      recipes: pickGroup(dto?.recipes),
      blogs: pickGroup(dto?.blogs),
      videos: pickGroup(dto?.videos),
    };
  }
}

export const postMapper = new PostMapper();
