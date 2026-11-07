import { AI_ARTIFACTS_ENDPOINTS } from '@/features/ai-artifacts/constants/ai-artifacts.endpoints';
import { AI_VERIFICATIONS_ADMIN_ENDPOINTS } from '@/features/ai-artifacts/constants/ai-verifications-admin.endpoints';
import api from '@/lib/axios';
import { aiArtifactMapper } from '../mappers/ai-artifact.mapper';
import { aiVerificationMapper } from '../mappers/ai-verification.mapper';
import type {
  AdminAiVerificationActionFormData,
  CreateAiVerificationFormData,
} from '../schemas/ai-verification.schema';
import type { AiArtifact } from '../types/ai-artifact.model';
import type { AiVerificationEnvelopeDto } from '../types/ai-verification.dto';
import type { AiVerification } from '../types/ai-verification.model';

export const aiVerificationApi = {
  /**
   * Thẩm định & kiểm chứng một AI Artifact công khai (dành cho Contributor / Admin).
   */
  async verify(
    artifactId: string,
    data: CreateAiVerificationFormData
  ): Promise<{ artifact: AiArtifact; verification: AiVerification }> {
    const res = await api.post<AiVerificationEnvelopeDto>(
      AI_ARTIFACTS_ENDPOINTS.VERIFICATIONS(artifactId),
      data
    );
    return {
      artifact: aiArtifactMapper.toModel(res.data.data.artifact),
      verification: aiVerificationMapper.toModel(res.data.data.verification),
    };
  },

  /**
   * Quản trị viên ghi đè (OVERRIDE) hoặc thu hồi (REVOKE) kiểm chứng với lý do kiểm toán bắt buộc.
   */
  async adminAction(
    verificationId: string,
    data: AdminAiVerificationActionFormData
  ): Promise<{ artifact: AiArtifact; verification: AiVerification }> {
    const res = await api.patch<AiVerificationEnvelopeDto>(
      AI_VERIFICATIONS_ADMIN_ENDPOINTS.ACTION(verificationId),
      data
    );
    return {
      artifact: aiArtifactMapper.toModel(res.data.data.artifact),
      verification: aiVerificationMapper.toModel(res.data.data.verification),
    };
  },
};
