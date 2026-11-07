import { AI_ARTIFACTS_ENDPOINTS } from '@/features/ai-artifacts/constants/ai-artifacts.endpoints';
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
    const res = await api.post<AiArtifactEnvelopeDto>(AI_ARTIFACTS_ENDPOINTS.BASE, data);
    return aiArtifactMapper.toModel(res.data.data);
  },

  /**
   * Cập nhật chế độ hiển thị (PUBLIC / PRIVATE).
   */
  async updateVisibility(
    id: string,
    data: UpdateAiArtifactVisibilityFormData
  ): Promise<AiArtifact> {
    const res = await api.patch<AiArtifactEnvelopeDto>(AI_ARTIFACTS_ENDPOINTS.VISIBILITY(id), data);
    return aiArtifactMapper.toModel(res.data.data);
  },

  /**
   * Gửi artifact để Người đóng góp (Contributor) thẩm định chuyên môn.
   */
  async submit(id: string, data: SubmitAiArtifactFormData): Promise<AiArtifact> {
    const res = await api.post<AiArtifactEnvelopeDto>(AI_ARTIFACTS_ENDPOINTS.SUBMIT(id), data);
    return aiArtifactMapper.toModel(res.data.data);
  },

  /**
   * Lấy danh sách tri thức AI công khai theo phân trang và bộ lọc loại.
   */
  async listPublic(query?: PublicAiArtifactsQuery): Promise<PaginationResult<AiArtifact>> {
    const res = await api.get<PublicAiArtifactListResponseDto>(AI_ARTIFACTS_ENDPOINTS.PUBLIC, {
      params: query,
    });
    if (!res.data) return aiArtifactMapper.toPaginationModel(null);
    return aiArtifactMapper.toPublicListModel(res.data.data, res.data.meta);
  },
};
