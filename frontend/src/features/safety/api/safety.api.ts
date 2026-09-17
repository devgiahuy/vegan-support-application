import type { DeletionResult, SubmitReportInput, ViolationReport } from '../types/safety.model';
import { safetyMapper } from '../mappers/safety.mapper';
import { deletedHistoryFixture, submittedReportFixture } from '../__fixtures__/safety-fixtures';

/**
 * API trust-safety — PHASE SCAFFOLD: đọc fixture, 0 request mạng.
 * Backend (`POST /reports`, `DELETE behavior-history`) còn `PLANNED`
 * nên 2 hàm dưới MÔ PHỎNG đúng signature live.
 *
 * Ngày nối live (TODO(BE-READY)): thay thân hàm bằng axios qua
 * `API_ENDPOINTS.SAFETY`, giữ nguyên chữ ký + kiểu trả về —
 * queries/components KHÔNG đổi. Đồng thời chuyển `__fixtures__`
 * sang test-only hoặc xóa khỏi bundle.
 */
export const USE_FIXTURES = true;

const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

// Báo cáo đã gửi (theo targetId) để chặn trùng ở UI.
const reportedTargets = new Set<string>();

export function __resetSafetyFixtures(): void {
  reportedTargets.clear();
}

export function __isReported(targetId: string): boolean {
  return reportedTargets.has(targetId);
}

export const safetyApi = {
  /** `POST /reports` (fixture). UUID sai → mapper trả null → ném lỗi rõ. */
  submitReport: async (input: SubmitReportInput): Promise<ViolationReport> => {
    await delay();
    const payload = safetyMapper.toSubmitDto(input);
    if (!payload) throw new Error('Mục tiêu báo cáo không hợp lệ.');
    const report = safetyMapper.toSingleReport(
      submittedReportFixture(payload.targetId, payload.reasonCode)
    );
    reportedTargets.add(payload.targetId);
    return report;
  },

  /** `DELETE /users/me/behavior-history` (fixture). */
  deleteBehaviorHistory: async (): Promise<DeletionResult> => {
    await delay();
    return safetyMapper.toDeletionResult(deletedHistoryFixture);
  },
};
