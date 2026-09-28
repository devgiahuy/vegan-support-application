import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import { safetyMapper } from '../mappers/safety.mapper';
import type { DeleteBehaviorHistoryResponseDto, ViolationReportResponseDto } from '../types/safety.dto';
import type { DeletionResult, SubmitReportInput, ViolationReport } from '../types/safety.model';

export const safetyApi = {
  submitReport: async (input: SubmitReportInput): Promise<ViolationReport> => {
    const payload = safetyMapper.toSubmitDto(input);
    if (!payload) throw new Error('Muc tieu bao cao khong hop le.');
    const res = await api.post<ViolationReportResponseDto>(API_ENDPOINTS.SAFETY.REPORTS, payload);
    return safetyMapper.toSingleReport(res.data);
  },

  deleteBehaviorHistory: async (): Promise<DeletionResult> => {
    const res = await api.delete<DeleteBehaviorHistoryResponseDto>(API_ENDPOINTS.SAFETY.BEHAVIOR_HISTORY);
    return safetyMapper.toDeletionResult(res.data);
  },
};

