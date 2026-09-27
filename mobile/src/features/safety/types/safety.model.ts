export type ReportTargetType = 'POST' | 'COMMENT';
export type ReportReasonCode = 'SPAM' | 'HARMFUL_HEALTH' | 'HARASSMENT' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER';

export interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  details?: string;
}

export interface ViolationReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  reasonLabel: string;
  details: string | null;
  status: 'OPEN' | 'RESOLVED';
  statusLabel: string;
  priority: string;
  activeReporterCount: number;
  createdAt: string;
}

export interface DeletionResult {
  deletedCount: number;
}

