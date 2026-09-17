/**
 * DTO contributor applications: nộp đơn, lịch sử, admin duyệt.
 * Theo `docs/api/contributors.md` + `docs/api/contributor-admin.md` (backend PLANNED).
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** Đơn contributor thô (own + admin cùng shape). */
export interface ContributorApplicationDto {
  id?: string;
  user?: {
    id?: string;
    email?: string;
    displayName?: string;
    display_name?: string;
    role?: string;
    currentContributorType?: string | null;
  } | null;
  requestedType?: string;
  requested_type?: string;
  requestedTypeLabel?: string;
  experience?: string;
  referenceLinks?: (string | null)[] | null;
  reference_links?: (string | null)[] | null;
  source?: string;
  status?: string;
  approvedType?: string | null;
  approved_type?: string | null;
  approvedTypeLabel?: string | null;
  approvalBasis?: string | null;
  approval_basis?: string | null;
  reviewNote?: string | null;
  review_note?: string | null;
  reviewedBy?: { id?: string; displayName?: string } | null;
  reviewed_by?: { id?: string; displayName?: string } | null;
  reviewedAt?: string | null;
  reviewed_at?: string | null;
  reapplyEligibleAt?: string | null;
  reapply_eligible_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

/** `POST /contributor-applications` — type + experience bắt buộc. */
export interface SubmitApplicationRequestDto {
  requestedType: string;
  experience: string;
  referenceLinks?: string[];
}

/** `POST /contributor-applications` → đơn PENDING. */
export interface ContributorApplicationResponseDto {
  success?: boolean;
  data?: ContributorApplicationDto | null;
  meta?: null;
}

/** Meta phân trang chuẩn. */
export interface ContributorPageMetaDto {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  total_pages?: number;
}

/** `GET /contributor-applications/me` + `GET /admin/contributor-applications`. */
export interface ContributorApplicationListResponseDto {
  success?: boolean;
  data?: (ContributorApplicationDto | null)[] | null;
  meta?: ContributorPageMetaDto | null;
}

/** `PATCH /admin/.../review` oneOf: APPROVE đủ 4 / REJECT note. */
export type ReviewApplicationRequestDto =
  | { decision: 'APPROVE'; contributorType: string; approvalBasis: string; reviewNote: string }
  | { decision: 'REJECT'; reviewNote: string };
