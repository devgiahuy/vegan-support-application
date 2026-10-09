import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import api from '@/lib/axios';
import { aiArtifactMapper } from '../mappers/ai-artifact.mapper';
import type {
  AiArtifactResponseDto,
  PublicAiArtifactListResponseDto,
} from '../types/ai-artifact.dto';
import type {
  AiArtifact,
  AiArtifactListResult,
  CreateAiArtifactInput,
  PublicAiArtifactsQuery,
} from '../types/ai-artifact.model';

export const aiArtifactApi = {
  /** Lưu đầu ra AI hợp lệ thành bản ghi bất biến (DRAFT, PRIVATE). */
  create: async (input: CreateAiArtifactInput): Promise<AiArtifact> => {
    const res = await api.post<AiArtifactResponseDto>(API_ENDPOINTS.AI_ARTIFACTS.BASE, aiArtifactMapper.toCreateDto(input), {
      silent: true,
    });
    return aiArtifactMapper.toSingle(res.data);
  },

  /** Chia sẻ công khai / thu hồi về riêng tư — gửi kèm `expectedLifecycleVersion`. */
  updateVisibility: async (
    id: string,
    visibility: 'PRIVATE' | 'PUBLIC',
    expectedLifecycleVersion: number
  ): Promise<AiArtifact> => {
    const res = await api.patch<AiArtifactResponseDto>(
      API_ENDPOINTS.AI_ARTIFACTS.VISIBILITY(id),
      aiArtifactMapper.toVisibilityDto(visibility, expectedLifecycleVersion),
      { silent: true }
    );
    return aiArtifactMapper.toSingle(res.data);
  },

  /** Gửi bản ghi để Contributor/Admin thẩm định. */
  submit: async (id: string, expectedLifecycleVersion: number): Promise<AiArtifact> => {
    const res = await api.post<AiArtifactResponseDto>(
      API_ENDPOINTS.AI_ARTIFACTS.SUBMIT(id),
      aiArtifactMapper.toSubmitDto(expectedLifecycleVersion),
      { silent: true }
    );
    return aiArtifactMapper.toSingle(res.data);
  },

  /** Danh sách tri thức AI công khai (không cần đăng nhập). */
  listPublic: async (query: PublicAiArtifactsQuery = {}): Promise<AiArtifactListResult> => {
    const res = await api.get<PublicAiArtifactListResponseDto>(API_ENDPOINTS.AI_ARTIFACTS.PUBLIC, {
      params: {
        limit: query.limit ?? 50,
        ...(query.page ? { page: query.page } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      silent: true,
    });
    return aiArtifactMapper.toListResult(res.data);
  },
};
