/**
 * DTO notifications — khế ước từ OpenAPI (`/notifications*`). Envelope `{success, data, meta}`.
 */

export interface NotificationDto {
  id?: string;
  type?: string;
  title?: string;
  summary?: string | null;
  link?: string | null;
  payloadVersion?: number;
  payload?: Record<string, unknown>;
  read?: boolean;
  readAt?: string | null;
  read_at?: string | null;
  createdAt?: string;
  created_at?: string;
  expiresAt?: string;
  expires_at?: string;
}

/** `GET /notifications` */
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

/** `GET /notifications/unread-count` */
export interface NotificationUnreadCountResponseDto {
  success?: boolean;
  data?: { count?: number } | null;
}

/** `PATCH /notifications/:id/read` */
export interface NotificationReadResponseDto {
  success?: boolean;
  data?: { id?: string; read?: boolean } | null;
  meta?: null;
}

/** `PATCH /notifications/read-all` */
export interface NotificationReadAllResponseDto {
  success?: boolean;
  data?: { updatedCount?: number | string } | null;
  meta?: null;
}
