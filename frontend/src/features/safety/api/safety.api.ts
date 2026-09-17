import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  DeleteBehaviorHistoryResponseDto,
  ViolationReportResponseDto,
} from '../types/safety.dto';
import type { DeletionResult, SubmitReportInput, ViolationReport } from '../types/safety.model';
import { safetyMapper } from '../mappers/safety.mapper';

export const USE_FIXTURES = false;

// Báo cáo đã gửi (theo targetId) để chặn trùng ở UI.
const reportedTargets = new Set<string>();

export function __resetSafetyFixtures(): void {
  reportedTargets.clear();
}

export function __isReported(targetId: string): boolean {
  return reportedTargets.has(targetId);
}

export const safetyApi = {
  /** `POST /reports` */
  submitReport: async (input: SubmitReportInput): Promise<ViolationReport> => {
    const payload = safetyMapper.toSubmitDto(input);
    if (!payload) throw new Error('Mục tiêu báo cáo không hợp lệ.');
    const res = await api.post<ViolationReportResponseDto>(API_ENDPOINTS.SAFETY.REPORTS, payload);
    reportedTargets.add(payload.targetId);
    return safetyMapper.toSingleReport(res.data);
  },

  /** `DELETE /users/me/behavior-history` */
  deleteBehaviorHistory: async (): Promise<DeletionResult> => {
    const res = await api.delete<DeleteBehaviorHistoryResponseDto>(
      API_ENDPOINTS.SAFETY.BEHAVIOR_HISTORY
    );
    return safetyMapper.toDeletionResult(res.data);
  },
};
