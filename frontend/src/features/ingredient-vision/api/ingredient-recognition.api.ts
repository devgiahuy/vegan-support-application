import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  RecognitionJobEnvelopeDto,
  RecognitionConfirmationEnvelopeDto,
} from '../types/ingredient-recognition.dto';
import type {
  RecognitionJob,
  RecognitionConfirmationDiff,
  UpdateCandidateInput,
} from '../types/ingredient-recognition.model';
import { ingredientRecognitionMapper } from '../mappers/ingredient-recognition.mapper';

export const ingredientRecognitionApi = {
  /**
   * Tạo tác vụ nhận diện thực phẩm tủ lạnh từ các ảnh đã commit
   */
  createJob: async (imageAssetIds: string[], idempotencyKey?: string): Promise<RecognitionJob> => {
    const key = idempotencyKey || crypto.randomUUID();
    const payload = ingredientRecognitionMapper.toCreateJobDto({
      imageAssetIds,
      idempotencyKey: key,
    });

    const res = await api.post<RecognitionJobEnvelopeDto>(
      API_ENDPOINTS.INGREDIENT_RECOGNITION.JOBS,
      payload,
      { showErrorToast: true }
    );
    return ingredientRecognitionMapper.toModel(res.data.data);
  },

  /**
   * Lấy chi tiết tiến trình và danh sách ứng viên nhận diện
   */
  getJob: async (id: string): Promise<RecognitionJob> => {
    const res = await api.get<RecognitionJobEnvelopeDto>(
      API_ENDPOINTS.INGREDIENT_RECOGNITION.JOB_DETAIL(id),
      { silent: true }
    );
    return ingredientRecognitionMapper.toModel(res.data.data);
  },

  /**
   * Cập nhật thông tin hoặc loại bỏ một ứng viên
   */
  updateCandidate: async (
    jobId: string,
    candidateId: string,
    input: UpdateCandidateInput
  ): Promise<RecognitionJob> => {
    const payload = ingredientRecognitionMapper.toUpdateCandidateDto(input);
    const res = await api.patch<RecognitionJobEnvelopeDto>(
      API_ENDPOINTS.INGREDIENT_RECOGNITION.UPDATE_CANDIDATE(jobId, candidateId),
      payload,
      { showErrorToast: true }
    );
    return ingredientRecognitionMapper.toModel(res.data.data);
  },

  /**
   * Điểm chốt xác nhận: áp dụng các ứng viên đã chọn vào kho Tủ bếp
   */
  confirmJob: async (
    jobId: string,
    candidates: { id: string; expectedVersion: number }[],
    idempotencyKey?: string
  ): Promise<RecognitionConfirmationDiff> => {
    const key = idempotencyKey || crypto.randomUUID();
    const payload = ingredientRecognitionMapper.toConfirmDto({
      candidates,
      idempotencyKey: key,
    });

    const res = await api.post<RecognitionConfirmationEnvelopeDto>(
      API_ENDPOINTS.INGREDIENT_RECOGNITION.CONFIRM(jobId),
      payload,
      { showErrorToast: true }
    );
    return ingredientRecognitionMapper.toConfirmationModel(res.data.data);
  },

  /**
   * Hủy bỏ tác vụ nhận diện chưa xác nhận
   */
  cancelJob: async (jobId: string): Promise<RecognitionJob> => {
    const res = await api.post<RecognitionJobEnvelopeDto>(
      API_ENDPOINTS.INGREDIENT_RECOGNITION.CANCEL(jobId),
      {},
      { showErrorToast: true }
    );
    return ingredientRecognitionMapper.toModel(res.data.data);
  },

  /**
   * Thử lại tác vụ nhận diện khi gặp lỗi
   */
  retryJob: async (jobId: string, idempotencyKey?: string): Promise<RecognitionJob> => {
    const key = idempotencyKey || crypto.randomUUID();
    const payload = ingredientRecognitionMapper.toRetryDto({ idempotencyKey: key });

    const res = await api.post<RecognitionJobEnvelopeDto>(
      API_ENDPOINTS.INGREDIENT_RECOGNITION.RETRY(jobId),
      payload,
      { showErrorToast: true }
    );
    return ingredientRecognitionMapper.toModel(res.data.data);
  },
};
