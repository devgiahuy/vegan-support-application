/**
 * DTO trust-safety leftovers: gửi báo cáo + xóa lịch sử hành vi.
 * Theo `docs/api/moderation.md` (POST /reports) + `docs/api/recommendations.md`
 * (DELETE behavior-history). Backend còn `PLANNED` — DTO viết đủ để nối live sau.
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** `POST /reports` — targetType + targetId UUID + reasonCode 6 mã bắt buộc. */
export interface CreateReportRequestDto {
  targetType: string;
  targetId: string;
  reasonCode: string;
  details?: string;
}

/** Báo cáo đã ghi nhận (thô). */
export interface ViolationReportDto {
  id?: string;
  targetId?: string;
  target_id?: string;
  targetType?: string;
  target_type?: string;
  reasonCode?: string;
  reason_code?: string;
  details?: string | null;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

/** `POST /reports` → 201 báo cáo. */
export interface ViolationReportResponseDto {
  success?: boolean;
  data?: ViolationReportDto | null;
  meta?: null;
}

/** `DELETE /users/me/behavior-history` → số lượng đã xóa. */
export interface DeleteBehaviorHistoryResponseDto {
  success?: boolean;
  data?: { deletedCount?: number | string } | null;
  meta?: null;
}
