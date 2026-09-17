/**
 * DTO notifications (SUY LUẬN — không có schema swagger, BE còn `PLANNED`).
 * Mọi field optional + `TODO(BE-READY)` reconfirm shape ở task nối live.
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** Thông báo (thô, suy luận). */
export interface NotificationDto {
  id?: string;
  type?: string;
  title?: string;
  summary?: string | null;
  link?: string | null;
  read?: boolean;
  readAt?: string | null;
  read_at?: string | null;
  createdAt?: string;
  created_at?: string;
}

/** `GET /notifications` (suy luận). */
export interface NotificationListResponseDto {
  success?: boolean;
  data?: (NotificationDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `PATCH /notifications/:id/read` (suy luận). */
export interface NotificationReadResponseDto {
  success?: boolean;
  data?: { id?: string; read?: boolean } | null;
  meta?: null;
}

/** `PATCH /notifications/read-all` (suy luận). */
export interface NotificationReadAllResponseDto {
  success?: boolean;
  data?: { updatedCount?: number | string } | null;
  meta?: null;
}
