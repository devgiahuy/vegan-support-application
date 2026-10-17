/**
 * Model của khu vực Quản lý nội dung (Admin Content).
 *
 * `AdminContentRow` là hình chiếu phẳng của `Recipe | Article | Video` để một bảng
 * duy nhất hiển thị được cả ba loại nội dung. Thành phần chỉ đọc Model này, không
 * bao giờ đọc DTO (gate G1).
 */

import type { PostStatus, PostType, VideoSource } from '@/common/enums';

export type AdminContentType = PostType;

/**
 * Nguồn dữ liệu của danh sách.
 *
 * - `'published-only'`: đang dùng `GET /posts?type=…`; danh sách CHỈ gồm nội dung
 *   đã xuất bản, bộ lọc tác giả/trạng thái/thời gian **không dùng được**.
 * - `'admin-list'`: CG-01 (`GET /admin/posts`) đã `READY`; bộ lọc đầy đủ khả dụng.
 *
 * Cờ này là thông tin trung thực — thành phần dùng nó để vô hiệu hoá có kiểm soát
 * bộ lọc chưa hỗ trợ, thay vì giả vờ lọc đang hoạt động (contracts/api-consumers.md §7).
 */
export type AdminContentSource = 'published-only' | 'admin-list';

export interface AdminContentRow {
  id: string;
  type: AdminContentType;
  typeLabel: string;
  title: string;
  slug: string;
  authorId: string;
  authorName: string;
  status: PostStatus;
  statusLabel: string;
  /** Quyền ghi của quản trị viên lên nội dung này — tính MỘT LẦN trong mapper. */
  isEditable: boolean;
  version: number;
  revisionId: string;
  revisionVersion: number;
  /** Có bản nháp mới đang chờ duyệt thay cho bản đang công khai hay không. */
  hasPendingRevision: boolean;
  publishedRevisionVersion: number | null;
  categoryNames: string[];
  tagLabels: string[];
  coverUrl: string | null;
  videoSource: VideoSource | null;
  durationSeconds: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  submittedAt: Date | null;
  deletedAt: Date | null;
  reviewNote: string | null;
  /** Số tín hiệu kiểm duyệt tham chiếu. Chỉ để hiển thị — KHÔNG dẫn tới ẩn/xoá. */
  moderationSignalCount: number;
}

export interface AdminContentListResult {
  rows: AdminContentRow[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  source: AdminContentSource;
}

/**
 * Thân yêu cầu gửi duyệt — `revisionId` và `expectedVersion` đều bắt buộc.
 */
export interface AdminContentSubmitInput {
  revisionId: string;
  expectedVersion: number;
}

/**
 * Lịch sử duyệt của một nội dung.
 *
 * Tái sử dụng `ContentReviewHistoryModel` của `features/review` vì hợp đồng
 * `GET /posts/:id/review-history` đã được ánh xạ đầy đủ ở đó — không viết lại
 * cùng một dữ liệu (research.md R-05).
 */
export type { ContentReviewHistoryModel as AdminContentHistoryResult } from '@/features/review/types/content-review.model';
