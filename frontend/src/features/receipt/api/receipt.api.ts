import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { ReceiptConfirmationEnvelopeDto, ReceiptJobEnvelopeDto } from '../types/receipt.dto';
import type {
  ConfirmReceiptJobInput,
  CreateReceiptJobInput,
  ReceiptConfirmationDiff,
  ReceiptJob,
  UpdateReceiptCandidateInput,
} from '../types/receipt.model';
import { receiptMapper } from '../mappers/receipt.mapper';

export const receiptApi = {
  /**
   * Tạo tác vụ bóc tách hóa đơn bất đồng bộ từ các ảnh đã commit
   */
  createJob: async (input: CreateReceiptJobInput): Promise<ReceiptJob> => {
    const payload = receiptMapper.toCreateJobDto(input);
    const res = await api.post<ReceiptJobEnvelopeDto>(API_ENDPOINTS.RECEIPT_JOBS.JOBS, payload, {
      showErrorToast: true,
    });
    return receiptMapper.toModel(res.data.data);
  },

  /**
   * Lấy chi tiết tác vụ bóc tách hóa đơn, tiến trình xử lý và danh sách dòng sản phẩm
   */
  getJob: async (id: string): Promise<ReceiptJob> => {
    const res = await api.get<ReceiptJobEnvelopeDto>(API_ENDPOINTS.RECEIPT_JOBS.JOB_DETAIL(id), {
      silent: true,
    });
    return receiptMapper.toModel(res.data.data);
  },

  /**
   * Chỉnh sửa thông tin ứng viên hoặc loại bỏ mặt hàng phi thực phẩm
   */
  updateCandidate: async (
    jobId: string,
    candidateId: string,
    input: UpdateReceiptCandidateInput
  ): Promise<ReceiptJob> => {
    const payload = receiptMapper.toUpdateCandidateDto(input);
    const res = await api.patch<ReceiptJobEnvelopeDto>(
      API_ENDPOINTS.RECEIPT_JOBS.UPDATE_CANDIDATE(jobId, candidateId),
      payload,
      { showErrorToast: true }
    );
    return receiptMapper.toModel(res.data.data);
  },

  /**
   * Xác nhận nhập các ứng viên hợp lệ vào Tủ bếp (Transaction & Idempotent)
   */
  confirmJob: async (
    jobId: string,
    input: ConfirmReceiptJobInput
  ): Promise<ReceiptConfirmationDiff> => {
    const payload = receiptMapper.toConfirmJobDto(input);
    const res = await api.post<ReceiptConfirmationEnvelopeDto>(
      API_ENDPOINTS.RECEIPT_JOBS.CONFIRM(jobId),
      payload,
      { showErrorToast: true }
    );
    return receiptMapper.toConfirmationModel(res.data.data);
  },

  /**
   * Hủy bỏ tác vụ bóc tách hóa đơn chưa xác nhận
   */
  cancelJob: async (jobId: string): Promise<ReceiptJob> => {
    const res = await api.post<ReceiptJobEnvelopeDto>(
      API_ENDPOINTS.RECEIPT_JOBS.CANCEL(jobId),
      {},
      { showErrorToast: true }
    );
    return receiptMapper.toModel(res.data.data);
  },

  /**
   * Thử lại tác vụ bóc tách khi gặp lỗi
   */
  retryJob: async (jobId: string, idempotencyKey?: string): Promise<ReceiptJob> => {
    const payload = {
      idempotencyKey:
        idempotencyKey ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `retry-${Date.now()}`),
    };
    const res = await api.post<ReceiptJobEnvelopeDto>(
      API_ENDPOINTS.RECEIPT_JOBS.RETRY(jobId),
      payload,
      { showErrorToast: true }
    );
    return receiptMapper.toModel(res.data.data);
  },
};
