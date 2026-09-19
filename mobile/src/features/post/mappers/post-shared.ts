import { pickField, safeString } from '@/lib/mapper';
import { PostStatus } from '@/common/enums';
import type { BasePostDto, PostAuthorDto, PostCategorySummaryDto, PostMediaDto } from '../types/post.dto';

/**
 * Helper mapper dùng chung cho mọi loại post (Recipe/Blog/Video), đồng bộ
 * `frontend/src/features/post/mappers/post.mapper.ts`.
 */

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

/** Ảnh bìa = media `COVER_IMAGE` đầu tiên, bỏ qua media VIDEO/link YouTube. */
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
  const list = Array.isArray(media) ? media : [];
  const cover = list.find(
    (m) => safeString(m?.kind).toUpperCase() === 'COVER_IMAGE' && isImageLike(m)
  );
  if (cover?.secureUrl) return cover.secureUrl as string;
  const firstImage = list.find(
    (m) =>
      safeString(m?.kind).toUpperCase() !== 'VIDEO' &&
      (safeString(m?.kind).toUpperCase() === 'IMAGE' ||
        safeString(m?.kind).toUpperCase() === 'THUMBNAIL' ||
        safeString(m?.kind).toUpperCase() === 'COVER_IMAGE' ||
        !safeString(m?.kind)) &&
      isImageLike(m)
  );
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
): { id: string; name: string; avatarUrl: string | null } {
  const author = pickField<PostAuthorDto | null>(dto, ['author'], null);
  const name = safeString(author?.displayName, fallbackName);
  const avatar = safeString(author?.avatarUrl, '');
  return { id: safeString(author?.id), name, avatarUrl: avatar || null };
}
