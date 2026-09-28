import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  ContributorApplicationListResponseDto,
  ContributorApplicationResponseDto,
  ContributorRevocationResponseDto,
} from '../types/contributor.dto';
import type {
  ContributorApplication,
  ContributorQueueParams,
  ContributorRevocationResult,
  ReviewApplicationInput,
} from '../types/contributor.model';
import { contributorMapper } from '../mappers/contributor.mapper';

export const contributorApi = {
  /** `POST /api/v1/contributor-applications` */
  submitApplication: async (
    claimedApprovalBasis: 'ORGANIZATION_AFFILIATION' | 'PLATFORM_TRACK_RECORD',
    experience: string,
    organizationClaim?: string,
    referenceLinks?: string[]
  ): Promise<ContributorApplication> => {
    const payload = contributorMapper.toSubmitDto(
      claimedApprovalBasis,
      experience,
      organizationClaim,
      referenceLinks
    );
    const res = await api.post<ContributorApplicationResponseDto>(
      API_ENDPOINTS.CONTRIBUTOR.APPLY,
      payload
    );
    return contributorMapper.toSingleApplication(res.data);
  },

  /** `GET /api/v1/contributor-applications/me` */
  getMyApplications: async (
    page = 1,
    limit = 20
  ): Promise<PaginationResult<ContributorApplication>> => {
    const res = await api.get<ContributorApplicationListResponseDto>(
      API_ENDPOINTS.CONTRIBUTOR.MY_APPLICATIONS,
      {
        params: { page, limit },
        silent: true,
      }
    );
    return contributorMapper.toApplicationList(res.data);
  },

  /** `GET /api/v1/admin/contributor-applications` */
  getQueue: async (
    params?: ContributorQueueParams
  ): Promise<PaginationResult<ContributorApplication>> => {
    const res = await api.get<ContributorApplicationListResponseDto>(
      API_ENDPOINTS.ADMIN_CONTRIBUTOR.LIST,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          status: params?.status || undefined,
          claimedApprovalBasis: params?.claimedApprovalBasis || undefined,
          source: params?.source || undefined,
          q: params?.q || undefined,
        },
        silent: true,
      }
    );
    return contributorMapper.toApplicationList(res.data);
  },

  /** `PATCH /api/v1/admin/contributor-applications/:id/review` */
  reviewApplication: async (
    id: string,
    input: ReviewApplicationInput
  ): Promise<ContributorApplication> => {
    const payload = contributorMapper.toReviewDto(input);
    const res = await api.patch<ContributorApplicationResponseDto>(
      API_ENDPOINTS.ADMIN_CONTRIBUTOR.REVIEW(id),
      payload
    );
    return contributorMapper.toSingleApplication(res.data);
  },

  /** `POST /api/v1/admin/contributor-invitations` */
  inviteContributor: async (userId: string, reason: string): Promise<ContributorApplication> => {
    const payload = contributorMapper.toInviteDto(userId, reason);
    const res = await api.post<ContributorApplicationResponseDto>(
      API_ENDPOINTS.ADMIN_CONTRIBUTOR.INVITE,
      payload
    );
    return contributorMapper.toSingleApplication(res.data);
  },

  /** `PATCH /api/v1/admin/contributors/:userId/revoke` */
  revokeContributor: async (
    userId: string,
    reason: string
  ): Promise<ContributorRevocationResult> => {
    const payload = contributorMapper.toRevokeDto(reason);
    const res = await api.patch<ContributorRevocationResponseDto>(
      API_ENDPOINTS.ADMIN_CONTRIBUTOR.REVOKE(userId),
      payload
    );
    return contributorMapper.toRevocationResult(res.data);
  },
};
