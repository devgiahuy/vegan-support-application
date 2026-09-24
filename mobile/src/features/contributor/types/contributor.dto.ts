/**
 * DTO thô cho `GET /contributor-applications/me` (đồng bộ backend
 * `contributor.schemas.ts` → `contributorApplicationSchema`). Mọi field optional để
 * mapper null-safe; UI chỉ hiển thị — approval basis KHÔNG cấp quyền (BL-01).
 */
export interface ContributorReviewerDto {
  id?: string;
  displayName?: string;
}

export interface ContributorApplicationItemDto {
  id?: string;
  claimedApprovalBasis?: string;
  claimedApprovalBasisLabel?: string;
  organizationClaim?: string | null;
  experience?: string;
  referenceLinks?: string[];
  source?: string;
  invitedBy?: ContributorReviewerDto | null;
  invitationReason?: string | null;
  status?: string;
  approvalBasis?: string | null;
  approvalBasisLabel?: string | null;
  reviewNote?: string | null;
  reviewedBy?: ContributorReviewerDto | null;
  reviewedAt?: string | null;
  reapplyEligibleAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContributorApplicationListResponseDto {
  success?: boolean;
  data?: (ContributorApplicationItemDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  } | null;
}

/** `POST /contributor-applications` → 1 đơn vừa tạo. */
export interface ContributorApplicationResponseDto {
  success?: boolean;
  data?: ContributorApplicationItemDto | null;
  meta?: null;
}

/** `POST /contributor-applications` request — cùng shape `contributorRequest` khi đăng ký. */
export interface SubmitContributorApplicationRequestDto {
  claimedApprovalBasis: string;
  organizationClaim?: string;
  experience: string;
  referenceLinks?: string[];
}
