import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import type { PaginationResult } from '@/types/api';
import { aiArtifactMapper } from '../mappers/ai-artifact.mapper';
import type {
  CreateAiArtifactFormData,
  SubmitAiArtifactFormData,
  UpdateAiArtifactVisibilityFormData,
} from '../schemas/ai-artifact.schema';
import type {
  AiArtifactEnvelopeDto,
  PublicAiArtifactListResponseDto,
} from '../types/ai-artifact.dto';
import type { AiArtifact, PublicAiArtifactsQuery } from '../types/ai-artifact.model';

export const aiArtifactApi = {
  /**
   * Lưu đầu ra AI hợp lệ thành AI Artifact bất biến (DRAFT, PRIVATE).
   */
  async create(data: CreateAiArtifactFormData): Promise<AiArtifact> {
    const res = await api.post<AiArtifactEnvelopeDto>(API_ENDPOINTS.AI_ARTIFACTS.BASE, data);
    return aiArtifactMapper.toModel(res.data.data);
  },

  /**
   * Cập nhật chế độ hiển thị (PUBLIC / PRIVATE).
   */
  async updateVisibility(
    id: string,
    data: UpdateAiArtifactVisibilityFormData
  ): Promise<AiArtifact> {
    const res = await api.patch<AiArtifactEnvelopeDto>(
      API_ENDPOINTS.AI_ARTIFACTS.VISIBILITY(id),
      data
    );
    return aiArtifactMapper.toModel(res.data.data);
  },

  /**
   * Gửi artifact để Người đóng góp (Contributor) thẩm định chuyên môn.
   */
  async submit(id: string, data: SubmitAiArtifactFormData): Promise<AiArtifact> {
    const res = await api.post<AiArtifactEnvelopeDto>(API_ENDPOINTS.AI_ARTIFACTS.SUBMIT(id), data);
    return aiArtifactMapper.toModel(res.data.data);
  },

  /**
   * Lấy danh sách tri thức AI công khai theo phân trang và bộ lọc loại.
   */
  async listPublic(query?: PublicAiArtifactsQuery): Promise<PaginationResult<AiArtifact>> {
    const res = await api.get<PublicAiArtifactListResponseDto>(API_ENDPOINTS.AI_ARTIFACTS.PUBLIC, {
      params: query,
    });
    return aiArtifactMapper.toPaginationModel(res.data);
  },
};
