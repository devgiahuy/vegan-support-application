/**
 * DTO chat sharing/verification (SUY LUẬN — không có schema swagger, BE còn `PLANNED`).
 * Mọi field optional + `TODO(BE-READY)` reconfirm shape ở task nối live.
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** Câu trả lời chia sẻ (thô, suy luận). */
export interface SharedAnswerDto {
  messageId?: string;
  message_id?: string;
  sessionId?: string;
  shareId?: string;
  share_id?: string;
  shared?: boolean;
  sharedAt?: string | null;
  shared_at?: string | null;
}

/** `PATCH /chat/messages/:id/share` (suy luận). */
export interface ShareAnswerResponseDto {
  success?: boolean;
  data?: SharedAnswerDto | null;
  meta?: null;
}

/** Mục công khai (thô, suy luận). */
export interface PublicAnswerDto {
  shareId?: string;
  share_id?: string;
  messageId?: string;
  question?: string;
  answer?: string;
  content?: string;
  disclaimer?: string | null;
  authorLabel?: string;
  author_label?: string;
  sharedAt?: string | null;
  verification?: {
    verifierName?: string;
    verifier_name?: string;
    verifierRole?: string;
    verifier_role?: string;
    note?: string | null;
    verifiedAt?: string | null;
    verified_at?: string | null;
  } | null;
}

/** `GET /chat/public` (suy luận). */
export interface PublicAnswerListResponseDto {
  success?: boolean;
  data?: (PublicAnswerDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `POST /chat/messages/:id/verification` body (suy luận). */
export interface VerifyAnswerRequestDto {
  note: string;
}

/** `POST /chat/messages/:id/verification` (suy luận). */
export interface VerifyAnswerResponseDto {
  success?: boolean;
  data?: {
    messageId?: string;
    verifierName?: string;
    verifierRole?: string;
    note?: string | null;
    verifiedAt?: string;
  } | null;
  meta?: null;
}
