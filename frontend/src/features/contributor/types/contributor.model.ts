import type { ContributorApplicationStatus, ContributorType } from '@/common/enums';

/** Đơn contributor dùng cho UI. */
export interface ContributorApplication {
  id: string;
  requestedType: ContributorType;
  requestedTypeLabel: string;
  /** Rút gọn 160 ký tự + … ở bảng; đầy đủ ở chi tiết. */
  experience: string;
  experienceShort: string;
  referenceLinks: string[];
  source: string;
  sourceLabel: string;
  status: ContributorApplicationStatus;
  statusLabel: string;
  approvedType: ContributorType | null;
  approvedTypeLabel: string | null;
  approvalBasis: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  /** Non-null + tương lai → chặn nộp lại kèm ngày. */
  reapplyEligibleAt: Date | null;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Input review của admin (oneOf BE). */
export type ReviewApplicationInput =
  | {
      decision: 'APPROVE';
      contributorType: ContributorType;
      approvalBasis: string;
      reviewNote: string;
    }
  | { decision: 'REJECT'; reviewNote: string };

/** Tham số query hàng chờ admin. */
export interface ContributorQueueParams {
  page?: number;
  limit?: number;
  status?: string;
  requestedType?: string;
  source?: string;
  q?: string;
}
