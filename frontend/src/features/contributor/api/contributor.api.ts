import api from '@/lib/axios';
import { CONTRIBUTOR_ENDPOINTS } from '@/features/contributor/constants/contributor.endpoints';
import { ADMIN_CONTRIBUTOR_ENDPOINTS } from '@/features/contributor/constants/admin-contributor.endpoints';
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
      CONTRIBUTOR_ENDPOINTS.APPLY,
      payload
    );
    return contributorMapper.toSingleApplication(res.data?.data);
  },

  /** `GET /api/v1/contributor-applications/me` */
  getMyApplications: async (
    page = 1,
    limit = 20
  ): Promise<PaginationResult<ContributorApplication>> => {
    const res = await api.get<ContributorApplicationListResponseDto>(
      CONTRIBUTOR_ENDPOINTS.MY_APPLICATIONS,
      {
        params: { page, limit },
        silent: true,
      }
    );
    return contributorMapper.toApplicationList(res.data?.data, res.data?.meta);
  },

  /** `GET /api/v1/admin/contributor-applications` */
  getQueue: async (
    params?: ContributorQueueParams
  ): Promise<PaginationResult<ContributorApplication>> => {
    const res = await api.get<ContributorApplicationListResponseDto>(
      ADMIN_CONTRIBUTOR_ENDPOINTS.LIST,
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
    return contributorMapper.toApplicationList(res.data?.data, res.data?.meta);
  },

  /** `PATCH /api/v1/admin/contributor-applications/:id/review` */
  reviewApplication: async (
    id: string,
    input: ReviewApplicationInput
  ): Promise<ContributorApplication> => {
    const payload = contributorMapper.toReviewDto(input);
    const res = await api.patch<ContributorApplicationResponseDto>(
      ADMIN_CONTRIBUTOR_ENDPOINTS.REVIEW(id),
      payload
    );
    return contributorMapper.toSingleApplication(res.data?.data);
  },

  /** `POST /api/v1/admin/contributor-invitations` */
  inviteContributor: async (userId: string, reason: string): Promise<ContributorApplication> => {
    const payload = contributorMapper.toInviteDto(userId, reason);
    const res = await api.post<ContributorApplicationResponseDto>(
      ADMIN_CONTRIBUTOR_ENDPOINTS.INVITE,
      payload
    );
    return contributorMapper.toSingleApplication(res.data?.data);
  },

  /** `PATCH /api/v1/admin/contributors/:userId/revoke` */
  revokeContributor: async (
    userId: string,
    reason: string
  ): Promise<ContributorRevocationResult> => {
    const payload = contributorMapper.toRevokeDto(reason);
    const res = await api.patch<ContributorRevocationResponseDto>(
      ADMIN_CONTRIBUTOR_ENDPOINTS.REVOKE(userId),
      payload
    );
    return contributorMapper.toRevocationResult(res.data?.data);
  },
};
