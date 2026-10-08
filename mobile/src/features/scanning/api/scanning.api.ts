import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import type { APIResponse } from '@/types/api';
import { requireDevScans } from '../lib/scan-access';
import { scanningMappers } from '../mappers/scanning.mapper';
import type { ScanConfirmationDto, ScanJobDto } from '../types/scanning.dto';
import type { CandidateEdit, ScanConfirm, ScanCreate, ScanKind } from '../types/scanning.model';

export const scanningApi = {
  async create(kind: ScanKind, input: ScanCreate) {
    requireDevScans();
    const res = await api.post<APIResponse<ScanJobDto>>(API_ENDPOINTS.SCANNING[kind].JOBS, scanningMappers[kind].toCreateDto(input), { silent: true });
    return scanningMappers[kind].toModel(res.data.data);
  },
  async get(kind: ScanKind, id: string) {
    requireDevScans();
    const res = await api.get<APIResponse<ScanJobDto>>(API_ENDPOINTS.SCANNING[kind].JOB(id), { silent: true });
    return scanningMappers[kind].toModel(res.data.data);
  },
  async edit(kind: ScanKind, id: string, candidateId: string, input: CandidateEdit) {
    requireDevScans();
    const res = await api.patch<APIResponse<ScanJobDto>>(API_ENDPOINTS.SCANNING[kind].CANDIDATE(id, candidateId), scanningMappers[kind].toEditDto(input), { silent: true });
    return scanningMappers[kind].toModel(res.data.data);
  },
  async confirm(kind: ScanKind, id: string, input: ScanConfirm) {
    requireDevScans();
    const res = await api.post<APIResponse<ScanConfirmationDto>>(API_ENDPOINTS.SCANNING[kind].CONFIRM(id), scanningMappers[kind].toConfirmDto(input), { silent: true });
    return scanningMappers[kind].toConfirmation(res.data.data);
  },
  async cancel(kind: ScanKind, id: string) {
    requireDevScans();
    const res = await api.post<APIResponse<ScanJobDto>>(API_ENDPOINTS.SCANNING[kind].CANCEL(id), undefined, { silent: true });
    return scanningMappers[kind].toModel(res.data.data);
  },
  async retry(kind: ScanKind, id: string, operationKey: string) {
    requireDevScans();
    const res = await api.post<APIResponse<ScanJobDto>>(API_ENDPOINTS.SCANNING[kind].RETRY(id), scanningMappers[kind].toRetryDto(operationKey), { silent: true });
    return scanningMappers[kind].toModel(res.data.data);
  },
};
