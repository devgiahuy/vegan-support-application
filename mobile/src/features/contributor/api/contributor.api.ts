import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { contributorMapper } from '../mappers/contributor.mapper';
import type {
  ContributorApplicationListResponseDto,
  ContributorApplicationResponseDto,
  SubmitContributorApplicationRequestDto,
} from '../types/contributor.dto';
import type { ContributorApplicationDetail } from '../types/contributor.model';
import type { PaginationResult } from '@/types/api';

export interface SubmitContributorApplicationInput {
  claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD';
  organizationClaim?: string;
  experience: string;
  referenceLinks?: string[];
}

export const contributorApi = {
  /** `GET /contributor-applications/me` — mọi đơn nguyện vọng của user hiện tại. */
  getMyApplications: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<ContributorApplicationDetail>> => {
    const res = await api.get<ContributorApplicationListResponseDto>(
      API_ENDPOINTS.CONTRIBUTOR.APPLICATIONS_ME,
      { params: { page: params?.page ?? 1, limit: params?.limit ?? 20 }, silent: true }
    );
    return contributorMapper.toApplicationListModel(res.data);
  },

  /** `POST /contributor-applications` — Member đã đăng ký gửi nguyện vọng Contributor
   * (khác lúc đăng ký tài khoản: đây là gửi sau khi đã có tài khoản Member). */
  submitApplication: async (
    input: SubmitContributorApplicationInput
  ): Promise<ContributorApplicationDetail> => {
    const payload: SubmitContributorApplicationRequestDto = {
      claimedApprovalBasis: input.claimedApprovalBasis,
      experience: input.experience,
      referenceLinks: input.referenceLinks ?? [],
    };
    if (input.claimedApprovalBasis === 'ORGANIZATION_AFFILIATION' && input.organizationClaim) {
      payload.organizationClaim = input.organizationClaim;
    }
    const res = await api.post<ContributorApplicationResponseDto>(
      API_ENDPOINTS.CONTRIBUTOR.APPLICATIONS,
      payload
    );
    return contributorMapper.toSingleApplicationModel(res.data);
  },
};
