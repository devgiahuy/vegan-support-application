import type { ContributorApplicationStatus, ContributorApprovalBasis } from '@/common/enums';

export interface ContributorReviewer {
  id: string;
  displayName: string;
}

/**
 * 1 đơn nguyện vọng Contributor (Phase 14, chỉ hiển thị — không cấp quyền, BL-01).
 * `approvalBasis`/`approvalBasisLabel` chỉ có giá trị khi `status === APPROVED`.
 */
export interface ContributorApplicationDetail {
  id: string;
  claimedApprovalBasis: ContributorApprovalBasis | null;
  claimedApprovalBasisLabel: string;
  organizationClaim: string | null;
  experience: string;
  referenceLinks: string[];
  status: ContributorApplicationStatus;
  rawStatus: string;
  approvalBasis: ContributorApprovalBasis | null;
  approvalBasisLabel: string | null;
  reviewNote: string | null;
  reviewedBy: ContributorReviewer | null;
  reviewedAt: Date | null;
  /** Ngày sớm nhất được nộp đơn lại — chỉ có khi đơn bị từ chối. */
  reapplyEligibleAt: Date | null;
  createdAt: Date | null;
}
