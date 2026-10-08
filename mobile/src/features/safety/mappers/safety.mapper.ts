import { safeNumber, safeString } from '@/lib/mapper';
import type { DeleteBehaviorHistoryResponseDto, SubmitReportRequestDto, ViolationReportResponseDto } from '../types/safety.dto';
import type { DeletionResult, SubmitReportInput, ViolationReport } from '../types/safety.model';

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  HARMFUL_HEALTH: 'Thông tin sức khỏe gây hại',
  HARASSMENT: 'Quấy rối',
  MISINFORMATION: 'Thông tin sai lệch',
  COPYRIGHT: 'Bản quyền',
  OTHER: 'Khác',
};

export const safetyMapper = {
  toSubmitDto(input: SubmitReportInput): SubmitReportRequestDto | null {
    if (!input.targetId.trim()) return null;
    return {
      targetType: input.targetType,
      targetId: input.targetId,
      reasonCode: input.reasonCode,
      ...(input.details?.trim() ? { details: input.details.trim() } : {}),
    };
  },

  toSingleReport(dto: ViolationReportResponseDto | null | undefined): ViolationReport {
    const data = dto?.data;
    const reasonCode = safeString(data?.reasonCode, 'OTHER') as ViolationReport['reasonCode'];
    const status = safeString(data?.status, 'OPEN') as ViolationReport['status'];
    return {
      id: safeString(data?.id),
      targetType: safeString(data?.targetType, 'POST') as ViolationReport['targetType'],
      targetId: safeString(data?.targetId),
      reasonCode,
      reasonLabel: REASON_LABELS[reasonCode] ?? reasonCode,
      details: safeString(data?.details) || null,
      status,
      statusLabel: status === 'RESOLVED' ? 'Đã xử lý' : 'Đang mở',
      priority: safeString(data?.priority, 'NORMAL'),
      activeReporterCount: safeNumber(data?.activeReporterCount, 1),
      createdAt: safeString(data?.createdAt),
    };
  },

  toDeletionResult(dto: DeleteBehaviorHistoryResponseDto | null | undefined): DeletionResult {
    return { deletedCount: safeNumber(dto?.data?.deletedCount, 0) };
  },
};
