import type { ContributorApplicationStatus, ContributorApprovalBasis } from '@/common/enums';

/** Đơn Contributor dùng cho UI (đã qua Mapper, type-safe 100%). */
export interface ContributorApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  currentRole: string;
  currentApprovalBasis: ContributorApprovalBasis | null;

  // Căn cứ tự đề xuất và thông tin hồ sơ
  claimedApprovalBasis: ContributorApprovalBasis;
  claimedApprovalBasisLabel: string;
  organizationClaim: string | null;
  experience: string;
  /** Rút gọn 160 ký tự + … ở bảng; đầy đủ ở chi tiết. */
  experienceShort: string;
  referenceLinks: string[];
  source: string;
  sourceLabel: string;

  // Thông tin nếu là Quản trị viên mời
  invitedBy: { id: string; displayName: string } | null;
  invitationReason: string | null;

  // Trạng thái & Thẩm định
  status: ContributorApplicationStatus;
  statusLabel: string;
  approvalBasis: ContributorApprovalBasis | null;
  approvalBasisLabel: string | null;
  reviewEvidence: Record<string, unknown> | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reapplyEligibleAt: Date | null;
  isReapplyBlocked: boolean;

  // Timestamps
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Input review của Admin (oneOf BE). */
export type ReviewApplicationInput =
  | {
      decision: 'APPROVE';
      approvalBasis: ContributorApprovalBasis;
      reviewNote: string;
    }
  | {
      decision: 'REJECT';
      reviewNote: string;
    };

/** Tham số query hàng chờ Admin. */
export interface ContributorQueueParams {
  page?: number;
  limit?: number;
  status?: string;
  claimedApprovalBasis?: string;
  source?: string;
  q?: string;
}

/** Kết quả thu hồi quyền Contributor. */
export interface ContributorRevocationResult {
  userId: string;
  role: string;
  revokedAt: Date | null;
  revokedByName: string;
  reason: string;
}
