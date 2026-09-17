import { BaseMapper, pickField, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type {
  CreateReportRequestDto,
  DeleteBehaviorHistoryResponseDto,
  ViolationReportDto,
  ViolationReportResponseDto,
} from '../types/safety.dto';
import type { DeletionResult, SubmitReportInput, ViolationReport } from '../types/safety.model';
import { ReportReasonCode, ReportTargetKind } from '@/common/enums';

const REASON_LABELS: Record<ReportReasonCode, string> = {
  [ReportReasonCode.SPAM]: 'Spam',
  [ReportReasonCode.HARMFUL_HEALTH]: 'Gây hại sức khỏe',
  [ReportReasonCode.HARASSMENT]: 'Quấy rối',
  [ReportReasonCode.MISINFORMATION]: 'Thông tin sai lệch',
  [ReportReasonCode.COPYRIGHT]: 'Vi phạm bản quyền',
  [ReportReasonCode.OTHER]: 'Lý do khác',
};

const TARGET_KIND_LABELS: Record<ReportTargetKind, string> = {
  [ReportTargetKind.POST]: 'Bài viết',
  [ReportTargetKind.COMMENT]: 'Bình luận',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * SafetyMapper: báo cáo vi phạm + xóa lịch sử.
 * Envelope `{success, data, meta}` đọc trực tiếp — cấm bọc `APIResponse<>` 2 tầng.
 */
export class SafetyMapper extends BaseMapper<ViolationReportDto, ViolationReport> {
  toModel(dto: ViolationReportDto | null | undefined): ViolationReport {
    const targetKind = safeEnum(
      pickField(dto, ['targetType', 'target_type'], 'POST'),
      ReportTargetKind,
      ReportTargetKind.POST
    );
    const reasonCode = safeEnum(
      pickField(dto, ['reasonCode', 'reason_code'], 'OTHER'),
      ReportReasonCode,
      ReportReasonCode.OTHER
    );
    return {
      id: safeString(pickField(dto, ['id'], '')),
      targetId: safeString(pickField(dto, ['targetId', 'target_id'], '')),
      targetKind,
      targetKindLabel: TARGET_KIND_LABELS[targetKind],
      reasonCode,
      reasonLabel: REASON_LABELS[reasonCode],
      details: safeString(pickField(dto, ['details'], '')) || null,
      status: safeString(pickField(dto, ['status'], 'OPEN')),
      statusLabel:
        safeString(pickField(dto, ['status'], 'OPEN')).toUpperCase() === 'RESOLVED'
          ? 'Đã xử lý'
          : 'Đang mở',
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
    };
  }

  /** `POST /reports` → 201 báo cáo đã ghi nhận. */
  toSingleReport(dto: ViolationReportResponseDto | null | undefined): ViolationReport {
    const data = pickField(dto, ['data'], null) as ViolationReportDto | null;
    return this.toModel(data);
  }

  /** `DELETE /users/me/behavior-history` → số lượng đã xóa. */
  toDeletionResult(dto: DeleteBehaviorHistoryResponseDto | null | undefined): DeletionResult {
    const data = pickField(dto, ['data'], null) as DeleteBehaviorHistoryResponseDto['data'];
    return { deletedCount: safeNumber(pickField(data, ['deletedCount'], 0)) };
  }

  toSubmitDto(input: SubmitReportInput): CreateReportRequestDto | null {
    if (!UUID_RE.test(input.targetId)) return null;
    const details = safeString(input.details);
    return {
      targetType: input.targetKind,
      targetId: input.targetId,
      reasonCode: input.reasonCode,
      ...(details.length > 0 ? { details } : {}),
    };
  }
}

export const safetyMapper = new SafetyMapper();
