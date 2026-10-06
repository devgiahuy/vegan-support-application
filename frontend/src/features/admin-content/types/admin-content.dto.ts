/**
 * DTO riêng của khu vực Quản lý nội dung (Admin Content).
 *
 * KHÔNG khai báo lại DTO nội dung: `RecipeDetailDto` / `BlogDetailDto` / `VideoDetailDto`
 * đều mở rộng `BasePostDto` từ `@/features/post/types/post.dto` và được tái sử dụng
 * nguyên vẹn (research.md R-05). Tệp này chỉ chứa tham số truy vấn và vỏ phản hồi
 * mà khu vực quản trị cần thêm.
 */

import type { BasePostDto } from '@/features/post/types/post.dto';

/** Tham số truy vấn danh sách nội dung của khu vực quản trị. */
export interface AdminContentListQueryDto {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  authorId?: string;
  categoryId?: string;
  q?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

/**
 * Vỏ phản hồi danh sách nội dung.
 *
 * `data` dùng `BasePostDto` vì `GET /posts?type=…` trả về đúng `postSchema`.
 * Khi CG-01 (`GET /admin/posts`) được `READY`, bổ sung `AdminPostListResponseDto`.
 */
export interface AdminContentListResponseDto {
  success?: boolean;
  data?: (BasePostDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  } | null;
}

/** Tham số phân trang lịch sử duyệt của một nội dung. */
export interface AdminContentHistoryQueryDto {
  page?: number;
  limit?: number;
}

/** Phản hồi xoá mềm: `{ id, status: 'DELETED' }`. */
export interface AdminContentDeleteResponseDto {
  success?: boolean;
  data?: { id?: string; status?: string } | null;
  meta?: null;
}
