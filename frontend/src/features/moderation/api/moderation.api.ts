import api from '@/lib/axios';
import { MODERATION_ADMIN_ENDPOINTS } from '@/features/moderation/constants/moderation-admin.endpoints';
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
    const res = await api.get<ModerationReportListResponseDto>(MODERATION_ADMIN_ENDPOINTS.REPORTS, {
      params: {
        page: params?.page,
        limit: params?.limit,
        status: params?.status || undefined,
      },
      silent: true,
    });
    return moderationMapper.toReportsList(res.data?.data, res.data?.meta);
  },

  /** `PATCH /admin/reports/:id/resolve` (đóng các báo cáo cùng target). */
  resolveReport: async (
    id: string,
    decision: ModerationDecision,
    reason: string
  ): Promise<ModerationReport> => {
    const payload = moderationMapper.toResolveDto(decision, reason);
    const res = await api.patch<ModerationReportResponseDto>(
      MODERATION_ADMIN_ENDPOINTS.REPORT_RESOLVE(id),
      payload
    );
    return moderationMapper.toResolvedReport(res.data?.data);
  },

  /** `GET /admin/users` */
  getUsers: async (params?: ModerationQueryParams): Promise<PaginationResult<ModeratedUser>> => {
    const res = await api.get<AdminModerationUserListResponseDto>(
      MODERATION_ADMIN_ENDPOINTS.USERS,
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
    return moderationMapper.toUsersList(res.data?.data, res.data?.meta);
  },

  /** `PATCH /admin/users/:id/status` */
  updateUserStatus: async (
    id: string,
    status: MemberStatus,
    reason: string
  ): Promise<ModeratedUser> => {
    const payload = moderationMapper.toUserStatusDto(status, reason);
    const res = await api.patch<AdminModerationUserResponseDto>(
      MODERATION_ADMIN_ENDPOINTS.USER_STATUS(id),
      payload
    );
    return moderationMapper.toSingleUser(res.data?.data);
  },

  /** `GET /admin/comments` */
  getModComments: async (
    params?: ModerationQueryParams
  ): Promise<PaginationResult<ModeratedComment>> => {
    const res = await api.get<AdminModerationCommentListResponseDto>(
      MODERATION_ADMIN_ENDPOINTS.COMMENTS,
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
    return moderationMapper.toModCommentsList(res.data?.data, res.data?.meta);
  },

  /** `PATCH /admin/comments/:id/status` */
  updateCommentStatus: async (
    id: string,
    status: 'VISIBLE' | 'HIDDEN',
    reason: string
  ): Promise<ModeratedComment> => {
    const payload = moderationMapper.toCommentStatusDto(status, reason);
    const res = await api.patch<AdminModerationCommentResponseDto>(
      MODERATION_ADMIN_ENDPOINTS.COMMENT_STATUS(id),
      payload
    );
    return moderationMapper.toSingleModComment(res.data?.data);
  },
};
