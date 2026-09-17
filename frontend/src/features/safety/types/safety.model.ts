import type { ReportReasonCode, ReportTargetKind } from '@/common/enums';

/** Báo cáo vi phạm dùng cho UI. */
export interface ViolationReport {
  id: string;
  targetId: string;
  targetKind: ReportTargetKind;
  targetKindLabel: string;
  reasonCode: ReportReasonCode;
  reasonLabel: string;
  details: string | null;
  status: string;
  statusLabel: string;
  createdAt: Date | null;
}

/** Kết quả xóa lịch sử hành vi. */
export interface DeletionResult {
  deletedCount: number;
}

/** Input gửi báo cáo (client kiểm tra UUID + enum trước khi gửi). */
export interface SubmitReportInput {
  targetKind: ReportTargetKind;
  targetId: string;
  reasonCode: ReportReasonCode;
  details?: string;
}
