/**
 * Hằng số bộ lọc của khu vực Quản lý nội dung.
 *
 * `PostStatus.ARCHIVED` **CỐ Ý** không có trong danh sách này: máy chủ không có
 * giá trị đó (`backend/src/modules/content/content.schemas.ts`), dù
 * `src/common/enums/index.ts` vẫn khai báo. Gửi/lọc theo nó sẽ bị từ chối
 * (research.md R-10, data-model.md §4.1).
 */

import { PostStatus, PostType } from '@/common/enums';

export interface AdminContentFilterOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export const ADMIN_CONTENT_TYPE_OPTIONS: AdminContentFilterOption<PostType>[] = [
  { value: PostType.RECIPE, label: 'Công thức' },
  { value: PostType.BLOG, label: 'Bài viết' },
  { value: PostType.VIDEO, label: 'Video' },
];

/** Đúng 8 giá trị `PostStatus` mà máy chủ thực sự hỗ trợ. Không `ARCHIVED`. */
export const ADMIN_CONTENT_STATUS_OPTIONS: AdminContentFilterOption<PostStatus>[] = [
  { value: PostStatus.DRAFT, label: 'Bản nháp' },
  { value: PostStatus.PENDING_REVIEW, label: 'Chờ duyệt' },
  { value: PostStatus.PUBLISHED, label: 'Đã xuất bản' },
  { value: PostStatus.FLAGGED, label: 'Cần chỉnh sửa' },
  { value: PostStatus.QUARANTINED, label: 'Bị tạm giữ' },
  { value: PostStatus.REJECTED, label: 'Từ chối' },
  { value: PostStatus.HIDDEN, label: 'Đã ẩn' },
  { value: PostStatus.DELETED, label: 'Đã xóa' },
];

export const ADMIN_CONTENT_ALL_OPTION: AdminContentFilterOption = {
  value: 'ALL',
  label: 'Tất cả',
};

/** Lý do vô hiệu hoá bộ lọc chưa được máy chủ hỗ trợ (hiển thị tiếng Việt, FR-003). */
export const ADMIN_CONTENT_FILTER_DISABLED_REASON =
  'Bộ lọc này chưa được hỗ trợ cho tới khi có danh sách nội dung quản trị.';

/** Nhãn tiêu đề bảng khi danh sách chỉ gồm nội dung đã xuất bản (trung thực, R-06). */
export const ADMIN_CONTENT_PUBLISHED_ONLY_NOTE = 'Danh sách hiện chỉ gồm nội dung đã xuất bản.';
