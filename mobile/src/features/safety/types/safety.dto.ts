export type ReportTargetTypeDto = 'POST' | 'COMMENT';
export type ReportReasonCodeDto = 'SPAM' | 'HARMFUL_HEALTH' | 'HARASSMENT' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER';

export interface SubmitReportRequestDto {
  targetType: ReportTargetTypeDto;
  targetId: string;
  reasonCode: ReportReasonCodeDto;
  details?: string;
}

export interface ViolationReportDto {
  id?: string;
  targetType?: ReportTargetTypeDto;
  targetId?: string;
  reasonCode?: ReportReasonCodeDto;
  details?: string | null;
  status?: 'OPEN' | 'RESOLVED';
  priority?: 'NORMAL' | 'HIGH';
  activeReporterCount?: number | string;
  createdAt?: string;
}

export interface ViolationReportResponseDto {
  success?: true;
  data?: ViolationReportDto;
  meta?: null;
}

export interface DeleteBehaviorHistoryResponseDto {
  success?: true;
  data?: { deletedCount?: number | string };
  meta?: null;
}

