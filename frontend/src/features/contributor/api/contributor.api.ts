import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  ContributorApplicationListResponseDto,
  ContributorApplicationResponseDto,
} from '../types/contributor.dto';
import type {
  ContributorApplication,
  ContributorQueueParams,
  ReviewApplicationInput,
} from '../types/contributor.model';
import type { ContributorType } from '@/common/enums';
import { contributorMapper } from '../mappers/contributor.mapper';

export const USE_FIXTURES = false;

export const contributorApi = {
  /** `POST /contributor-applications` */
  submitApplication: async (
    requestedType: ContributorType,
    experience: string,
    referenceLinks: string[]
  ): Promise<ContributorApplication> => {
    const payload = contributorMapper.toSubmitDto(requestedType, experience, referenceLinks);
    const res = await api.post<ContributorApplicationResponseDto>(
      API_ENDPOINTS.CONTRIBUTOR.APPLY,
      payload
    );
    return contributorMapper.toSingleApplication(res.data);
  },

  /** `GET /contributor-applications/me` */
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

  /** `GET /admin/contributor-applications` */
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
          requestedType: params?.requestedType || undefined,
          source: params?.source || undefined,
          q: params?.q || undefined,
        },
        silent: true,
      }
    );
    return contributorMapper.toApplicationList(res.data);
  },

  /** `PATCH /admin/contributor-applications/:id/review` */
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
};
