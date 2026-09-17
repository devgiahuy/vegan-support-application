import type {
  DeleteBehaviorHistoryResponseDto,
  ViolationReportResponseDto,
} from '../types/safety.dto';

/** Fixture báo cáo đã ghi nhận (phase scaffold — BE còn `PLANNED`). */
export function submittedReportFixture(
  targetId: string,
  reasonCode: string
): ViolationReportResponseDto {
  return {
    success: true,
    data: {
      id: 'rep-new-1',
      targetId,
      targetType: 'POST',
      reasonCode,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    },
    meta: null,
  };
}

/** Fixture xóa lịch sử (phase scaffold). */
export const deletedHistoryFixture: DeleteBehaviorHistoryResponseDto = {
  success: true,
  data: { deletedCount: 17 },
  meta: null,
};

export const emptyHistoryFixture: DeleteBehaviorHistoryResponseDto = {
  success: true,
  data: { deletedCount: 0 },
  meta: null,
};
