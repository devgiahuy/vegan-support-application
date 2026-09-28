/**
 * DTOs cho Contributor Application, Admin Review, Direct Invitation & Revocation.
 * Đồng bộ theo contract Backend Phase 14 (`docs/api/contributors.md` + `docs/api/contributor-admin.md`).
 */

/** DTO đơn Contributor thô (lịch sử cá nhân và hàng chờ admin). */
export interface ContributorApplicationDto {
  id?: string;
  user?: {
    id?: string;
    email?: string;
    displayName?: string;
    display_name?: string;
    role?: string;
    currentApprovalBasis?: string | null;
    current_approval_basis?: string | null;
  } | null;
  claimedApprovalBasis?: string;
  claimed_approval_basis?: string;
  claimedApprovalBasisLabel?: string;
  claimed_approval_basis_label?: string;
  organizationClaim?: string | null;
  organization_claim?: string | null;
  experience?: string;
  referenceLinks?: (string | null)[] | null;
  reference_links?: (string | null)[] | null;
  source?: string;
  invitedBy?: {
    id?: string;
    displayName?: string;
    display_name?: string;
  } | null;
  invited_by?: {
    id?: string;
    displayName?: string;
    display_name?: string;
  } | null;
  invitationReason?: string | null;
  invitation_reason?: string | null;
  status?: string;
  approvalBasis?: string | null;
  approval_basis?: string | null;
  approvalBasisLabel?: string | null;
  approval_basis_label?: string | null;
  reviewEvidence?: Record<string, unknown> | null;
  review_evidence?: Record<string, unknown> | null;
  reviewNote?: string | null;
  review_note?: string | null;
  reviewedBy?: {
    id?: string;
    displayName?: string;
    display_name?: string;
  } | null;
  reviewed_by?: {
    id?: string;
    displayName?: string;
    display_name?: string;
  } | null;
  reviewedAt?: string | null;
  reviewed_at?: string | null;
  reapplyEligibleAt?: string | null;
  reapply_eligible_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

/** `POST /api/v1/contributor-applications` — Nộp đơn đăng ký. */
export interface SubmitApplicationRequestDto {
  claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD';
  organizationClaim?: string;
  experience: string;
  referenceLinks?: string[];
}

/** `POST /api/v1/contributor-applications` → Trả về đơn PENDING. */
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

/** `GET /api/v1/contributor-applications/me` + `GET /api/v1/admin/contributor-applications`. */
export interface ContributorApplicationListResponseDto {
  success?: boolean;
  data?: (ContributorApplicationDto | null)[] | null;
  meta?: ContributorPageMetaDto | null;
}

/** `PATCH /api/v1/admin/contributor-applications/:id/review` — oneOf: APPROVE / REJECT. */
export type ReviewApplicationRequestDto =
  | {
      decision: 'APPROVE';
      approvalBasis: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD' | 'ADMIN_INVITED';
      reviewNote: string;
    }
  | {
      decision: 'REJECT';
      reviewNote: string;
    };

/** `POST /api/v1/admin/contributor-invitations` — Admin mời thành viên. */
export interface InviteContributorRequestDto {
  userId: string;
  reason: string;
}

/** `PATCH /api/v1/admin/contributors/:userId/revoke` — Admin thu hồi tư cách Contributor. */
export interface RevokeContributorRequestDto {
  reason: string;
}

/** Phản hồi thu hồi tư cách Contributor. */
export interface ContributorRevocationResponseDto {
  success?: boolean;
  data?: {
    userId?: string;
    user_id?: string;
    role?: string;
    revokedAt?: string;
    revoked_at?: string;
    revokedBy?: {
      id?: string;
      displayName?: string;
      display_name?: string;
    } | null;
    revoked_by?: {
      id?: string;
      displayName?: string;
      display_name?: string;
    } | null;
    reason?: string;
  } | null;
  meta?: null;
}
