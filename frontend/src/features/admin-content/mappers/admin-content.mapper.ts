import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import { PostStatus, PostType, VideoSource } from '@/common/enums';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import {
  getPostStatusLabel,
  coverUrlFromMedia,
  authorFromDto,
} from '@/features/post/mappers/post.mapper';
import {
  getPostReviewStatusLabel,
  parsePostReviewStatus,
} from '@/features/review/mappers/content-review.mapper';
import { ADMIN_CONTENT_STATUS_OPTIONS } from '../types/admin-content.options';
import type {
  BasePostDto,
  PostCategorySummaryDto,
  PostMediaDto,
  PostRevisionDto,
} from '@/features/post/types/post.dto';
import type { AdminContentListResponseDto } from '../types/admin-content.dto';
import type {
  AdminContentListResult,
  AdminContentRow,
  AdminContentSource,
} from '../types/admin-content.model';

/**
 * Phiên bản nội dung có thêm các trường kiểm toán mà `PostRevisionDto` chưa khai báo.
 * Máy chủ trả về chúng (`submittedAt`, `reviewNote`, `reviewedAt`, `reviewedBy`).
 */
interface AdminRevisionDto extends PostRevisionDto {
  submittedAt?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

/** Tập 8 `PostStatus` thực sự tồn tại ở máy chủ — dùng để chặn `ARCHIVED` (R-10). */
const VALID_POST_STATUSES = new Set<string>(
  ADMIN_CONTENT_STATUS_OPTIONS.map((option) => option.value)
);

const BLOCKED_EDIT_STATUSES = new Set<string>([
  PostStatus.DELETED,
  PostStatus.HIDDEN,
  PostStatus.FLAGGED,
  PostStatus.QUARANTINED,
  PostStatus.PENDING_REVIEW,
]);

const PENDING_REVISION_STATUSES = new Set<string>(['PENDING_REVIEW', 'FLAGGED', 'QUARANTINED']);

const DEFAULT_COVER_FALLBACK = '';

/**
 * Nhãn loại nội dung dùng thống nhất với `ADMIN_CONTENT_TYPE_OPTIONS`.
 * Cố ý KHÔNG dùng `getPostTypeLabel()` của hàng đợi duyệt vì nhãn VIDEO ở đó là
 * "Video nấu ăn" còn khu vực quản lý dùng "Video".
 */
function getAdminTypeLabel(type: PostType): string {
  switch (type) {
    case PostType.RECIPE:
      return 'Công thức';
    case PostType.VIDEO:
      return 'Video';
    case PostType.BLOG:
    default:
      return 'Bài viết';
  }
}

/**
 * Parse `PostStatus` nhưng loại bỏ `ARCHIVED` vì máy chủ không hỗ trợ giá trị này.
 * Dùng bảng `ADMIN_CONTENT_STATUS_OPTIONS` làm nguồn chân lý duy nhất.
 */
export function parsePostStatusStrict(raw: unknown): PostStatus {
  const upper = safeString(raw).toUpperCase();
  if (VALID_POST_STATUSES.has(upper)) return upper as PostStatus;
  return PostStatus.DRAFT;
}

function parseAdminTypeStrict(raw: unknown): PostType {
  const upper = safeString(raw).toUpperCase();
  return Object.values(PostType).includes(upper as PostType) ? (upper as PostType) : PostType.BLOG;
}

function detectVideoSource(
  media: (PostMediaDto | null | undefined)[] | null | undefined
): VideoSource | null {
  const video = safeArray<PostMediaDto>(media).find(
    (item) => safeString(item?.kind).toUpperCase() === 'VIDEO'
  );
  if (!video) return null;
  const provider = safeString(video.provider).toUpperCase();
  if (provider === VideoSource.YOUTUBE) return VideoSource.YOUTUBE;
  if (provider === VideoSource.CLOUDINARY) return VideoSource.CLOUDINARY;
  const url = safeString(video.secureUrl);
  if (url.includes('youtube.com') || url.includes('youtu.be')) return VideoSource.YOUTUBE;
  return url ? VideoSource.CLOUDINARY : null;
}

/**
 * Quy tắc `isEditable` — data-model.md §3.4.
 *
 * Quyền ghi nội dung chỉ thuộc về **chính tác giả** (quyết định Q1). Nội dung đang
 * chờ duyệt / bị gắn cờ / bị cách ly / đã ẩn / đã xóa thì khoá. Nội dung đã xuất bản
 * vẫn sửa được vì sửa tạo bản nháp mới, bản công khai giữ nguyên (FR-019).
 */
function computeIsEditable(
  authorId: string,
  sessionUserId: string,
  status: PostStatus,
  hasPendingRevision: boolean
): boolean {
  if (!sessionUserId || !authorId) return false;
  if (authorId !== sessionUserId) return false;
  if (BLOCKED_EDIT_STATUSES.has(status)) return false;
  if (hasPendingRevision) return false;
  return true;
}

/** Bảng ánh xạ mã lỗi nghiệp vụ → thông báo tiếng Việt (FR-045). */
const ERROR_MESSAGES: Record<string, string> = {
  CONTENT_VERSION_CONFLICT: 'Nội dung đã được thay đổi bởi thao tác khác.',
  CONTENT_STATE_CONFLICT: 'Nội dung đang chờ duyệt nên chưa thể chỉnh sửa.',
  CONTENT_SLUG_CONFLICT: 'Đường dẫn đã tồn tại. Vui lòng chọn đường dẫn khác.',
  CONTENT_DELETED: 'Nội dung này đã bị xóa.',
  INVALID_CONTENT: 'Nội dung chưa hợp lệ. Vui lòng kiểm tra lại.',
  INVALID_INGREDIENT_REFERENCE: 'Nguyên liệu đã chọn không còn hợp lệ.',
  INGREDIENT_ID_NAME_MISMATCH: 'Tên nguyên liệu không khớp với nguyên liệu đã chọn.',
  INVALID_MEDIA_REFERENCE: 'Tệp đính kèm không hợp lệ. Vui lòng tải lại.',
  STORAGE_QUOTA_EXCEEDED: 'Bạn đã vượt hạn mứng dung lượng cho phép.',
  UPLOAD_RESERVATION_EXPIRED: 'Phiên tải lên đã hết hạn. Vui lòng thử lại.',
  UPLOAD_PROVIDER_MISMATCH: 'Tệp tải lên không đúng nhà cung cấp đã đăng ký.',
  SELF_APPROVAL_FORBIDDEN: 'Bạn không thể tự duyệt nội dung do chính mình là tác giả.',
  REVIEW_ALREADY_DECIDED: 'Nội dung này đã có quyết định duyệt trước đó.',
  REVIEW_CONFLICT: 'Có quản trị viên khác vừa xử lý nội dung này.',
  CONTENT_AUTHOR_INACTIVE: 'Tác giả không còn hoạt động nên không thể xuất bản.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  VALIDATION_ERROR: 'Vui lòng kiểm tra lại các trường được đánh dấu.',
};

const GENERIC_ERROR_MESSAGE = 'Thao tác thất bại. Vui lòng thử lại.';

export class AdminContentMapper extends BaseMapper<BasePostDto, AdminContentRow> {
  /**
   * DTO → Model hàng bảng. Mọi quy tắc quyền được tính MỘT LẦN ở đây để thành
   * phần chỉ đọc, không suy luận (data-model.md §2.1).
   */
  override toModel(dto: BasePostDto | null | undefined): AdminContentRow {
    return this.toAdminRow(dto, '');
  }

  toAdminRow(dto: BasePostDto | null | undefined, sessionUserId: string): AdminContentRow {
    if (!dto || typeof dto !== 'object') {
      const status = PostStatus.DRAFT;
      return {
        id: '',
        type: PostType.BLOG,
        typeLabel: getAdminTypeLabel(PostType.BLOG),
        title: 'Nội dung chưa có tiêu đề',
        slug: '',
        authorId: '',
        authorName: 'Không rõ tác giả',
        status,
        statusLabel: getPostStatusLabel(status),
        isEditable: false,
        version: 1,
        revisionId: '',
        revisionVersion: 1,
        hasPendingRevision: false,
        publishedRevisionVersion: null,
        categoryNames: [],
        tagLabels: [],
        coverUrl: null,
        videoSource: null,
        durationSeconds: null,
        createdAt: null,
        updatedAt: null,
        submittedAt: null,
        deletedAt: null,
        reviewNote: null,
        moderationSignalCount: 0,
      };
    }

    const type = parseAdminTypeStrict(pickField<string>(dto, ['type'], ''));
    const status = parsePostStatusStrict(pickField<string>(dto, ['status'], ''));
    const version = Math.max(1, safeNumber(pickField<number>(dto, ['version'], 1), 1));

    const revision = pickField<AdminRevisionDto | null>(dto, ['revision'], null);
    const revisionStatus = parsePostReviewStatus(
      safeString(revision?.status).toUpperCase() || null
    );
    const revisionVersion = Math.max(
      1,
      safeNumber(pickField<number>(revision, ['version'], version), version)
    );
    const hasPendingRevision = PENDING_REVISION_STATUSES.has(revisionStatus);

    const media = pickField<(PostMediaDto | null)[] | null>(dto, ['media'], null);
    const author = authorFromDto(dto, 'Không rõ tác giả');
    const authorId = safeString(pickField<string>(dto, ['author.id', 'authorId'], ''));

    const categories = safeArray<PostCategorySummaryDto>(
      pickField<PostCategorySummaryDto[]>(dto, ['categories'], [])
    );
    const tags = safeArray<string>(pickField<string[]>(dto, ['revision.tags', 'tags'], []));

    const publishedRevisionVersionRaw = pickField<number | null>(
      dto,
      ['publishedRevisionVersion'],
      null
    );
    const publishedRevisionVersion =
      publishedRevisionVersionRaw === null || publishedRevisionVersionRaw === undefined
        ? null
        : safeNumber(publishedRevisionVersionRaw, 0) || null;

    const coverRaw = coverUrlFromMedia(media, DEFAULT_COVER_FALLBACK);

    const signalCountRaw = safeNumber(pickField<number>(dto, ['moderationSignalCount'], 0), 0);

    return {
      id: safeString(pickField<string>(dto, ['id'], '')),
      type,
      typeLabel: getAdminTypeLabel(type),
      title: safeString(
        pickField<string>(dto, ['revision.title', 'title'], ''),
        'Nội dung chưa có tiêu đề'
      ),
      slug: safeString(pickField<string>(dto, ['slug'], '')),
      authorId: authorId || author.id,
      authorName: author.name,
      status,
      statusLabel: getPostStatusLabel(status),
      isEditable: computeIsEditable(
        authorId || author.id,
        sessionUserId,
        status,
        hasPendingRevision
      ),
      version,
      revisionId: safeString(pickField<string>(revision, ['id'], '')),
      revisionVersion,
      hasPendingRevision,
      publishedRevisionVersion,
      categoryNames: categories
        .map((category) => safeString(category?.name))
        .filter((name) => name.length > 0),
      tagLabels: tags.map((tag) => safeString(tag)).filter((tag) => tag.length > 0),
      coverUrl: coverRaw.length > 0 ? coverRaw : null,
      videoSource: detectVideoSource(media),
      durationSeconds:
        safeNumber(
          safeArray<PostMediaDto>(media).find(
            (item) => safeString(item?.kind).toUpperCase() === 'VIDEO'
          )?.durationSeconds,
          0
        ) || null,
      createdAt: safeDate(pickField<string>(dto, ['createdAt'], '')),
      updatedAt: safeDate(pickField<string>(dto, ['updatedAt'], '')),
      submittedAt: safeDate(pickField<string>(revision, ['submittedAt'], '')),
      deletedAt: safeDate(pickField<string>(dto, ['deletedAt'], '')),
      reviewNote: safeString(pickField<string>(revision, ['reviewNote'], '')) || null,
      moderationSignalCount: signalCountRaw > 0 ? Math.floor(signalCountRaw) : 0,
    };
  }

  /**
   * Vỏ phản hồi → kết quả danh sách khi nguồn là `GET /posts?type=…`
   * (`source = 'published-only'` — nhãn trung thực, R-06).
   */
  toPublishedOnlyResult(
    response: AdminContentListResponseDto | null | undefined,
    sessionUserId: string
  ): AdminContentListResult {
    return this.toResult(response, sessionUserId, 'published-only');
  }

  /**
   * Vỏ phản hồi → kết quả danh sách khi CG-01 (`GET /admin/posts`) đã `READY`.
   * Chỉ dùng sau khi T082 trong tasks.md xác nhận trạng thái `READY`.
   */
  toAdminListResult(
    response: AdminContentListResponseDto | null | undefined,
    sessionUserId: string
  ): AdminContentListResult {
    return this.toResult(response, sessionUserId, 'admin-list');
  }

  private toResult(
    response: AdminContentListResponseDto | null | undefined,
    sessionUserId: string,
    source: AdminContentSource
  ): AdminContentListResult {
    // Phần tử null trong `data` không phải nội dung thật — bỏ hẳn thay vì dựng
    // hàng giả, để tổng số dòng khớp `meta.total` (contracts/api-consumers.md §3.4).
    const rows = safeArray<BasePostDto | null>(response?.data)
      .filter((dto): dto is BasePostDto => dto !== null && dto !== undefined)
      .map((dto) => this.toAdminRow(dto, sessionUserId));
    const meta = response?.meta ?? null;
    const totalItems = Math.max(0, safeNumber(meta?.total, rows.length));
    const totalPagesRaw = safeNumber(meta?.totalPages, 0);

    return {
      rows,
      page: Math.max(1, safeNumber(meta?.page, 1)),
      limit: Math.max(1, safeNumber(meta?.limit, 20)),
      totalItems,
      totalPages: Math.max(1, totalPagesRaw > 0 ? Math.ceil(totalPagesRaw) : 1),
      source,
    };
  }

  /**
   * Ánh xạ mã lỗi nghiệp vụ sang thông báo tiếng Việt.
   * TUYỆT ĐỐI phân nhánh theo `error.code`, không bao giờ theo `error.message`
   * (contracts/api-consumers.md §4.2).
   */
  mapAdminContentError(code: string | null | undefined): string {
    const normalized = safeString(code).toUpperCase();
    return ERROR_MESSAGES[normalized] ?? GENERIC_ERROR_MESSAGE;
  }

  /** Trích mã lỗi từ lỗi Axios rồi ánh xạ sang thông báo tiếng Việt. */
  mapErrorObject(error: unknown): string {
    return this.mapAdminContentError(getApiErrorCode(error));
  }

  /** Lỗi theo từng trường từ `error.fields`, dùng cho biểu mẫu (FR-014). */
  errorFields(error: unknown): Record<string, string[]> {
    const fields = getApiErrorFields(error);
    if (!fields) return {};
    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fields)) {
      result[key] = Array.isArray(value)
        ? value.map((item) => safeString(item)).filter(Boolean)
        : [safeString(value)].filter(Boolean);
    }
    return result;
  }

  /** Nhãn tiếng Việt của trạng thái phiên bản cho hộp thoại lịch sử duyệt. */
  revisionStatusLabel(raw: string | null | undefined): string {
    return getPostReviewStatusLabel(parsePostReviewStatus(safeString(raw).toUpperCase() || null));
  }

  /** Lớp Badge theo mức độ trạng thái — chỉ dùng class, không sinh màu động. */
  getStatusBadgeClass(status: PostStatus): string {
    switch (status) {
      case PostStatus.PUBLISHED:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case PostStatus.PENDING_REVIEW:
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case PostStatus.FLAGGED:
      case PostStatus.QUARANTINED:
      case PostStatus.REJECTED:
      case PostStatus.HIDDEN:
      case PostStatus.DELETED:
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case PostStatus.DRAFT:
      default:
        return '';
    }
  }
}

export const adminContentMapper = new AdminContentMapper();
