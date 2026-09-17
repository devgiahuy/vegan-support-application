import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  AdminModerationCommentListResponseDto,
  AdminModerationCommentResponseDto,
  AdminModerationUserListResponseDto,
  AdminModerationUserResponseDto,
  ModerationReportListResponseDto,
  ModerationReportResponseDto,
} from '../types/moderation.dto';
import type {
  ModeratedComment,
  ModeratedUser,
  ModerationQueryParams,
  ModerationReport,
} from '../types/moderation.model';
import type { MemberStatus, ModerationDecision } from '@/common/enums';
import { moderationMapper } from '../mappers/moderation.mapper';

export const USE_FIXTURES = false;

export const moderationApi = {
  /** `GET /admin/reports` */
  getReports: async (
    params?: ModerationQueryParams
  ): Promise<PaginationResult<ModerationReport>> => {
    const res = await api.get<ModerationReportListResponseDto>(
      API_ENDPOINTS.MODERATION_ADMIN.REPORTS,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          status: params?.status || undefined,
        },
        silent: true,
      }
    );
    return moderationMapper.toReportsList(res.data);
  },

  /** `PATCH /admin/reports/:id/resolve` (đóng các báo cáo cùng target). */
  resolveReport: async (
    id: string,
    decision: ModerationDecision,
    reason: string
  ): Promise<ModerationReport> => {
    const payload = moderationMapper.toResolveDto(decision, reason);
    const res = await api.patch<ModerationReportResponseDto>(
      API_ENDPOINTS.MODERATION_ADMIN.REPORT_RESOLVE(id),
      payload
    );
    return moderationMapper.toResolvedReport(res.data);
  },

  /** `GET /admin/users` */
  getUsers: async (params?: ModerationQueryParams): Promise<PaginationResult<ModeratedUser>> => {
    const res = await api.get<AdminModerationUserListResponseDto>(
      API_ENDPOINTS.MODERATION_ADMIN.USERS,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          status: params?.status || undefined,
          q: params?.q || undefined,
        },
        silent: true,
      }
    );
    return moderationMapper.toUsersList(res.data);
  },

  /** `PATCH /admin/users/:id/status` */
  updateUserStatus: async (
    id: string,
    status: MemberStatus,
    reason: string
  ): Promise<ModeratedUser> => {
    const payload = moderationMapper.toUserStatusDto(status, reason);
    const res = await api.patch<AdminModerationUserResponseDto>(
      API_ENDPOINTS.MODERATION_ADMIN.USER_STATUS(id),
      payload
    );
    return moderationMapper.toSingleUser(res.data);
  },

  /** `GET /admin/comments` */
  getModComments: async (
    params?: ModerationQueryParams
  ): Promise<PaginationResult<ModeratedComment>> => {
    const res = await api.get<AdminModerationCommentListResponseDto>(
      API_ENDPOINTS.MODERATION_ADMIN.COMMENTS,
      {
        params: {
          page: params?.page,
          limit: params?.limit,
          status: params?.status || undefined,
          q: params?.q || undefined,
        },
        silent: true,
      }
    );
    return moderationMapper.toModCommentsList(res.data);
  },

  /** `PATCH /admin/comments/:id/status` */
  updateCommentStatus: async (
    id: string,
    status: 'VISIBLE' | 'HIDDEN',
    reason: string
  ): Promise<ModeratedComment> => {
    const payload = moderationMapper.toCommentStatusDto(status, reason);
    const res = await api.patch<AdminModerationCommentResponseDto>(
      API_ENDPOINTS.MODERATION_ADMIN.COMMENT_STATUS(id),
      payload
    );
    return moderationMapper.toSingleModComment(res.data);
  },
};
