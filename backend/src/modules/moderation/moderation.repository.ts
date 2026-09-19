import {
  AiFlagStatus,
  CommentStatus,
  ContributorDecisionType,
  ModerationDecision,
  ModerationPriority,
  ModerationTargetType,
  PostRevisionStatus,
  PostStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  Role,
  UserStatus,
  type PrismaClient,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type {
  AdminCommentsQuery,
  AdminReportsQuery,
  AdminUsersQuery,
  CreateReportInput,
  ResolveReportInput,
  ReviewDecisionInput,
  ReviewQueueQuery,
  UpdateCommentStatusInput,
  UpdateUserStatusInput,
} from './moderation.schemas.js';

const reviewerUserSelect = {
  id: true,
  displayName: true,
  role: true,
  status: true,
  contributorProfile: { select: { approvalBasis: true, revokedAt: true } },
} satisfies Prisma.UserSelect;
const reviewRevisionInclude = {
  post: { include: { author: { select: reviewerUserSelect } } },
  aiFlags: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.PostRevisionInclude;
const reportInclude = {
  reporter: { select: { id: true, displayName: true } },
  resolvedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.ReportInclude;
const adminUserInclude = {
  contributorProfile: true,
} satisfies Prisma.UserInclude;
const adminCommentInclude = {
  author: { select: reviewerUserSelect },
} satisfies Prisma.CommentInclude;

export type ReviewRevisionRecord = Prisma.PostRevisionGetPayload<{
  include: typeof reviewRevisionInclude;
}>;
export type ReportRecord = Prisma.ReportGetPayload<{ include: typeof reportInclude }>;
export type AdminUserRecord = Prisma.UserGetPayload<{ include: typeof adminUserInclude }>;
export type AdminCommentRecord = Prisma.CommentGetPayload<{ include: typeof adminCommentInclude }>;

export interface ModerationActor {
  userId: string;
  role: Role;
  hasActiveContributorProfile: boolean;
}

interface IdRow {
  id: string;
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

export class ModerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listReviewQueue(actor: ModerationActor, query: ReviewQueueQuery) {
    const statuses =
      actor.role !== Role.ADMIN
        ? Prisma.sql`ARRAY['PENDING_REVIEW']::"post_revision_status"[]`
        : query.status
          ? Prisma.sql`ARRAY[${query.status}::"post_revision_status"]`
          : Prisma.sql`ARRAY['PENDING_REVIEW', 'FLAGGED', 'QUARANTINED']::"post_revision_status"[]`;
    const typeFilter = query.type
      ? Prisma.sql`AND p."type" = ${query.type}::"post_type"`
      : Prisma.empty;
    const contributorFilter =
      actor.role === Role.ADMIN
        ? Prisma.empty
        : Prisma.sql`
            AND u."role" = 'MEMBER'::"user_role"
            AND p."status" <> 'HIDDEN'::"post_status"
            AND pr."created_by_id" <> ${actor.userId}::uuid
            AND NOT EXISTS (
              SELECT 1 FROM "ai_flags" af
              WHERE af."post_revision_id" = pr."id" AND af."status" = 'OPEN'::"ai_flag_status"
            )
            AND NOT EXISTS (
              SELECT 1 FROM "reports" r
              WHERE r."target_type" = 'POST'::"report_target_type"
                AND r."target_id" = p."id"
                AND r."status" = 'OPEN'::"report_status"
                AND r."priority" = 'HIGH'::"moderation_priority"
            )`;
    const priorityFilter =
      query.priority === ModerationPriority.HIGH
        ? Prisma.sql`AND (
            EXISTS (SELECT 1 FROM "ai_flags" af WHERE af."post_revision_id" = pr."id" AND af."risk_level" = 'HIGH'::"ai_flag_risk_level" AND af."status" = 'OPEN'::"ai_flag_status")
            OR EXISTS (SELECT 1 FROM "reports" r WHERE r."target_type" = 'POST'::"report_target_type" AND r."target_id" = p."id" AND r."status" = 'OPEN'::"report_status" AND r."priority" = 'HIGH'::"moderation_priority")
          )`
        : query.priority === ModerationPriority.NORMAL
          ? Prisma.sql`AND NOT (
              EXISTS (SELECT 1 FROM "ai_flags" af WHERE af."post_revision_id" = pr."id" AND af."risk_level" = 'HIGH'::"ai_flag_risk_level" AND af."status" = 'OPEN'::"ai_flag_status")
              OR EXISTS (SELECT 1 FROM "reports" r WHERE r."target_type" = 'POST'::"report_target_type" AND r."target_id" = p."id" AND r."status" = 'OPEN'::"report_status" AND r."priority" = 'HIGH'::"moderation_priority")
            )`
          : Prisma.empty;
    const base = Prisma.sql`
      FROM "post_revisions" pr
      INNER JOIN "posts" p ON p."id" = pr."post_id" AND p."version" = pr."version"
      INNER JOIN "users" u ON u."id" = p."author_id"
      WHERE pr."status" = ANY(${statuses})
        AND p."status" <> 'DELETED'::"post_status"
        ${typeFilter}
        ${contributorFilter}
        ${priorityFilter}
    `;
    const offset = (query.page - 1) * query.limit;
    const [countRows, rows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<Array<{ total: bigint }>>(
        Prisma.sql`SELECT COUNT(*)::bigint AS "total" ${base}`,
      ),
      this.prisma.$queryRaw<IdRow[]>(Prisma.sql`
        SELECT pr."id" ${base}
        ORDER BY
          CASE WHEN pr."status" = 'QUARANTINED'::"post_revision_status" THEN 0
               WHEN pr."status" = 'FLAGGED'::"post_revision_status" THEN 1 ELSE 2 END,
          pr."created_at" ASC,
          pr."id" ASC
        LIMIT ${query.limit} OFFSET ${offset}
      `),
    ]);
    const records = await this.hydrateRevisions(rows.map((row) => row.id));
    return {
      records,
      meta: pagination(query.page, query.limit, Number(countRows[0]?.total ?? 0n)),
    };
  }

  async reviewPost(
    actor: ModerationActor,
    postId: string,
    decision: 'APPROVE' | 'REJECT',
    input: ReviewDecisionInput,
  ): Promise<ReviewRevisionRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<IdRow[]>(Prisma.sql`
        SELECT pr."id"
        FROM "post_revisions" pr
        INNER JOIN "posts" p ON p."id" = pr."post_id" AND p."version" = pr."version"
        WHERE p."id" = ${postId}::uuid
        FOR UPDATE OF p, pr
      `);
      const revisionId = locked[0]?.id;
      if (!revisionId) throw this.notFound('Không tìm thấy post review target');
      const revision = await transaction.postRevision.findUniqueOrThrow({
        where: { id: revisionId },
        include: reviewRevisionInclude,
      });
      const reviewableStatuses: PostRevisionStatus[] = [
        PostRevisionStatus.PENDING_REVIEW,
        PostRevisionStatus.FLAGGED,
        PostRevisionStatus.QUARANTINED,
      ];
      if (!reviewableStatuses.includes(revision.status)) {
        throw this.conflict('REVIEW_ALREADY_DECIDED', 'Revision không còn ở trạng thái chờ review');
      }
      if (revision.createdById === actor.userId || revision.post.authorId === actor.userId) {
        throw new AppError({
          statusCode: 403,
          code: 'SELF_APPROVAL_FORBIDDEN',
          message: 'Không được review nội dung do chính mình tạo',
        });
      }
      const openFlags = revision.aiFlags.filter((flag) => flag.status === AiFlagStatus.OPEN);
      const hasHighReports =
        (await transaction.report.count({
          where: {
            targetType: ReportTargetType.POST,
            targetId: postId,
            status: ReportStatus.OPEN,
            priority: ModerationPriority.HIGH,
          },
        })) > 0;
      const inactiveAuthorStatuses: UserStatus[] = [UserStatus.BANNED, UserStatus.DELETED];
      if (
        decision === ModerationDecision.APPROVE &&
        inactiveAuthorStatuses.includes(revision.post.author.status)
      ) {
        throw this.conflict(
          'CONTENT_AUTHOR_INACTIVE',
          'Không thể publish nội dung của user đã bị ban hoặc xóa',
        );
      }
      if (
        actor.role !== Role.ADMIN &&
        (revision.post.author.role !== Role.MEMBER ||
          revision.post.status === PostStatus.HIDDEN ||
          revision.status !== PostRevisionStatus.PENDING_REVIEW ||
          openFlags.length > 0 ||
          hasHighReports)
      ) {
        throw new AppError({
          statusCode: 403,
          code: 'ADMIN_REVIEW_REQUIRED',
          message:
            'Flagged/quarantined/high-priority hoặc non-Member content bắt buộc Admin review',
        });
      }
      const now = new Date();
      const updated = await transaction.postRevision.updateMany({
        where: { id: revision.id, status: revision.status },
        data: {
          status:
            decision === ModerationDecision.APPROVE
              ? PostRevisionStatus.PUBLISHED
              : PostRevisionStatus.REJECTED,
          reviewNote: input.reason,
          reviewedById: actor.userId,
          reviewedAt: now,
        },
      });
      if (updated.count !== 1) {
        throw this.conflict('REVIEW_CONFLICT', 'Revision đã được reviewer khác xử lý');
      }
      if (decision === ModerationDecision.APPROVE) {
        const remainsHidden = revision.post.status === PostStatus.HIDDEN;
        await transaction.post.update({
          where: { id: postId },
          data: {
            status: remainsHidden ? PostStatus.HIDDEN : PostStatus.PUBLISHED,
            publishedRevisionId: revision.id,
            publishedAt: now,
            ...(remainsHidden ? {} : { hiddenAt: null, hiddenById: null, hiddenReason: null }),
          },
        });
      } else if (!revision.post.publishedRevisionId) {
        await transaction.post.update({
          where: { id: postId },
          data: { status: PostStatus.REJECTED },
        });
      }
      if (actor.role === Role.ADMIN && openFlags.length) {
        await transaction.aiFlag.updateMany({
          where: { id: { in: openFlags.map((flag) => flag.id) }, status: AiFlagStatus.OPEN },
          data: { status: AiFlagStatus.REVIEWED, reviewedById: actor.userId, reviewedAt: now },
        });
      }
      const auditDecision =
        actor.role === Role.ADMIN && openFlags.length
          ? decision === ModerationDecision.APPROVE
            ? ModerationDecision.NO_VIOLATION
            : ModerationDecision.HIDE
          : decision;
      await transaction.moderationAction.create({
        data: {
          actorId: actor.userId,
          decision: auditDecision,
          targetType: ModerationTargetType.POST,
          targetId: postId,
          reason: input.reason,
          relatedAiFlagIds: openFlags.map((flag) => flag.id),
          metadata: {
            revisionId: revision.id,
            revisionVersion: revision.version,
            reviewerRole: actor.role,
            unifiedContributor: actor.role === Role.CONTRIBUTOR,
            previousPostStatus: revision.post.status,
            previousRevisionStatus: revision.status,
            reviewRouteDecision: decision,
          },
        },
      });
      return transaction.postRevision.findUniqueOrThrow({
        where: { id: revision.id },
        include: reviewRevisionInclude,
      });
    });
  }

  async createReport(reporterId: string, input: CreateReportInput): Promise<ReportRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockReportTarget(transaction, input.targetType, input.targetId);
      const ownerId = await this.visibleTargetOwner(transaction, input.targetType, input.targetId);
      if (!ownerId) throw this.notFound('Target không tồn tại hoặc không còn hiển thị');
      if (ownerId === reporterId) {
        throw new AppError({
          statusCode: 403,
          code: 'SELF_REPORT_FORBIDDEN',
          message: 'Không thể report nội dung của chính mình',
        });
      }
      const report = await transaction.report.create({
        data: {
          reporterId,
          targetType: input.targetType,
          targetId: input.targetId,
          reasonCode: input.reasonCode,
          ...(input.details ? { details: input.details } : {}),
          activeKey: `${reporterId}:${input.targetType}:${input.targetId}`,
        },
        include: reportInclude,
      });
      const distinctReporters = await transaction.report.count({
        where: {
          targetType: input.targetType,
          targetId: input.targetId,
          status: ReportStatus.OPEN,
        },
      });
      if (distinctReporters >= 5) {
        await transaction.report.updateMany({
          where: {
            targetType: input.targetType,
            targetId: input.targetId,
            status: ReportStatus.OPEN,
          },
          data: { priority: ModerationPriority.HIGH },
        });
      }
      return transaction.report.findUniqueOrThrow({
        where: { id: report.id },
        include: reportInclude,
      });
    });
  }

  async listReports(query: AdminReportsQuery) {
    const where: Prisma.ReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        include: reportInclude,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
    ]);
    return { records, meta: pagination(query.page, query.limit, total) };
  }

  async resolveReport(
    actorId: string,
    reportId: string,
    input: ResolveReportInput,
  ): Promise<ReportRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const initialReport = await transaction.report.findUnique({ where: { id: reportId } });
      if (!initialReport) throw this.notFound('Không tìm thấy report');
      await this.lockReportTarget(transaction, initialReport.targetType, initialReport.targetId);
      await transaction.$queryRaw<IdRow[]>(Prisma.sql`
        SELECT "id" FROM "reports"
        WHERE "target_type" = ${initialReport.targetType}::"report_target_type"
          AND "target_id" = ${initialReport.targetId}::uuid
          AND "status" = 'OPEN'::"report_status"
        FOR UPDATE
      `);
      const report = await transaction.report.findUniqueOrThrow({ where: { id: reportId } });
      if (report.status !== ReportStatus.OPEN) {
        throw this.conflict('REPORT_ALREADY_RESOLVED', 'Report đã được xử lý');
      }
      const related = await transaction.report.findMany({
        where: {
          targetType: report.targetType,
          targetId: report.targetId,
          status: ReportStatus.OPEN,
        },
        select: { id: true },
      });
      await this.applyReportDecision(transaction, actorId, report, input);
      const now = new Date();
      await transaction.report.updateMany({
        where: { id: { in: related.map((item) => item.id) }, status: ReportStatus.OPEN },
        data: {
          status: ReportStatus.RESOLVED,
          activeKey: null,
          resolvedDecision: input.decision,
          resolvedReason: input.reason,
          resolvedById: actorId,
          resolvedAt: now,
        },
      });
      await transaction.moderationAction.create({
        data: {
          actorId,
          decision: input.decision,
          targetType:
            report.targetType === ReportTargetType.POST
              ? ModerationTargetType.POST
              : ModerationTargetType.COMMENT,
          targetId: report.targetId,
          reason: input.reason,
          relatedReportIds: related.map((item) => item.id),
          metadata: { sourceReportId: reportId, resolvedReportCount: related.length },
        },
      });
      return transaction.report.findUniqueOrThrow({
        where: { id: reportId },
        include: reportInclude,
      });
    });
  }

  async countOpenReports(targetType: ReportTargetType, targetId: string): Promise<number> {
    return this.prisma.report.count({ where: { targetType, targetId, status: ReportStatus.OPEN } });
  }

  async listUsers(query: AdminUsersQuery) {
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: 'insensitive' as const } },
              { displayName: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: adminUserInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { records, meta: pagination(query.page, query.limit, total) };
  }

  async updateUserStatus(
    actorId: string,
    userId: string,
    input: UpdateUserStatusInput,
  ): Promise<AdminUserRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<IdRow[]>(Prisma.sql`
        SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE
      `);
      if (!locked.length) throw this.notFound('Không tìm thấy user');
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: userId },
        include: adminUserInclude,
      });
      if (actorId === userId) {
        throw new AppError({
          statusCode: 403,
          code: 'SELF_MODERATION_FORBIDDEN',
          message: 'Admin không thể thay đổi trạng thái tài khoản của chính mình',
        });
      }
      if (user.role === Role.ADMIN) {
        throw new AppError({
          statusCode: 403,
          code: 'PROTECTED_ADMIN_ACCOUNT',
          message: 'Không thể moderation tài khoản Admin',
        });
      }
      if (user.status === UserStatus.DELETED) {
        throw this.conflict('USER_STATUS_CONFLICT', 'Tài khoản đã xóa không thể đổi trạng thái');
      }
      const decision = await this.applyUserStatus(transaction, actorId, user, input);
      await transaction.moderationAction.create({
        data: {
          actorId,
          decision,
          targetType: ModerationTargetType.USER,
          targetId: userId,
          reason: input.reason,
          metadata: { previousStatus: user.status, nextStatus: input.status },
        },
      });
      return transaction.user.findUniqueOrThrow({
        where: { id: userId },
        include: adminUserInclude,
      });
    });
  }

  async listComments(query: AdminCommentsQuery) {
    const where: Prisma.CommentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.postId ? { postId: query.postId } : {}),
      ...(query.authorId ? { authorId: query.authorId } : {}),
      ...(query.q ? { content: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        include: adminCommentInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.comment.count({ where }),
    ]);
    return { records, meta: pagination(query.page, query.limit, total) };
  }

  async updateCommentStatus(
    actorId: string,
    commentId: string,
    input: UpdateCommentStatusInput,
  ): Promise<AdminCommentRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const comment = await transaction.comment.findUnique({
        where: { id: commentId },
        include: { author: { select: { status: true } } },
      });
      if (!comment) throw this.notFound('Không tìm thấy comment');
      if (comment.status === CommentStatus.DELETED) {
        throw this.conflict('COMMENT_NOT_MODERATABLE', 'Comment đã bị author xóa');
      }
      if (comment.status === input.status) {
        throw this.conflict('COMMENT_STATUS_CONFLICT', 'Comment đã ở trạng thái yêu cầu');
      }
      if (
        input.status === CommentStatus.VISIBLE &&
        (comment.author.status === UserStatus.BANNED ||
          comment.author.status === UserStatus.DELETED)
      ) {
        throw this.conflict(
          'CONTENT_AUTHOR_INACTIVE',
          'Phải unban user trước khi restore comment của họ',
        );
      }
      const now = new Date();
      const hidden = input.status === CommentStatus.HIDDEN;
      await transaction.comment.update({
        where: { id: commentId },
        data: hidden
          ? {
              status: CommentStatus.HIDDEN,
              hiddenAt: now,
              hiddenById: actorId,
              hiddenReason: 'MODERATION_VIOLATION',
            }
          : {
              status: CommentStatus.VISIBLE,
              hiddenAt: null,
              hiddenById: null,
              hiddenReason: null,
            },
      });
      await transaction.moderationAction.create({
        data: {
          actorId,
          decision: hidden ? ModerationDecision.HIDE : ModerationDecision.RESTORE,
          targetType: ModerationTargetType.COMMENT,
          targetId: commentId,
          reason: input.reason,
          metadata: { previousStatus: comment.status, nextStatus: input.status },
        },
      });
      return transaction.comment.findUniqueOrThrow({
        where: { id: commentId },
        include: adminCommentInclude,
      });
    });
  }

  private async hydrateRevisions(ids: string[]): Promise<ReviewRevisionRecord[]> {
    if (!ids.length) return [];
    const records = await this.prisma.postRevision.findMany({
      where: { id: { in: ids } },
      include: reviewRevisionInclude,
    });
    const byId = new Map(records.map((record) => [record.id, record]));
    return ids.flatMap((id) => (byId.has(id) ? [byId.get(id) as ReviewRevisionRecord] : []));
  }

  private async visibleTargetOwner(
    transaction: Prisma.TransactionClient,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string | null> {
    if (targetType === ReportTargetType.POST) {
      const post = await transaction.post.findFirst({
        where: { id: targetId, status: PostStatus.PUBLISHED, deletedAt: null },
        select: { authorId: true },
      });
      return post?.authorId ?? null;
    }
    const comment = await transaction.comment.findFirst({
      where: {
        id: targetId,
        status: CommentStatus.VISIBLE,
        post: { status: PostStatus.PUBLISHED, deletedAt: null },
      },
      select: { authorId: true },
    });
    return comment?.authorId ?? null;
  }

  private async lockReportTarget(
    transaction: Prisma.TransactionClient,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<void> {
    await transaction.$queryRaw<Array<{ locked: boolean }>>(Prisma.sql`
      SELECT pg_advisory_xact_lock(hashtext(${`${targetType}:${targetId}`})) IS NULL AS "locked"
    `);
  }

  private async applyReportDecision(
    transaction: Prisma.TransactionClient,
    actorId: string,
    report: { targetType: ReportTargetType; targetId: string },
    input: ResolveReportInput,
  ): Promise<void> {
    const ownerId = await this.targetOwner(transaction, report.targetType, report.targetId);
    if (!ownerId) throw this.notFound('Moderation target không còn tồn tại');
    if (input.decision === ModerationDecision.HIDE) {
      await this.setTargetVisibility(transaction, actorId, report, false);
    } else if (input.decision === ModerationDecision.RESTORE) {
      await this.setTargetVisibility(transaction, actorId, report, true);
    } else if (input.decision === ModerationDecision.BAN) {
      const user = await transaction.user.findUniqueOrThrow({ where: { id: ownerId } });
      if (user.role === Role.ADMIN)
        throw new AppError({
          statusCode: 403,
          code: 'PROTECTED_ADMIN_ACCOUNT',
          message: 'Không thể ban Admin',
        });
      await this.banUser(transaction, actorId, ownerId);
    } else if (input.decision === ModerationDecision.DEMOTE) {
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: ownerId },
        include: { contributorProfile: true },
      });
      const profile = user.contributorProfile;
      if (user.role !== Role.CONTRIBUTOR || !profile || profile.revokedAt) {
        throw this.conflict('DEMOTION_NOT_APPLICABLE', 'Target author không phải Contributor');
      }
      const now = new Date();
      await transaction.contributorProfile.update({
        where: { userId: ownerId },
        data: { revokedAt: now, revokedById: actorId, revocationReason: input.reason },
      });
      await transaction.user.update({ where: { id: ownerId }, data: { role: Role.MEMBER } });
      await transaction.contributorDecision.create({
        data: {
          userId: ownerId,
          applicationId: profile.sourceApplicationId,
          actorId,
          decision: ContributorDecisionType.REVOKED,
          approvalBasis: profile.approvalBasis,
          evidence: profile.approvalEvidence as Prisma.InputJsonValue,
          reason: input.reason,
          createdAt: now,
        },
      });
      await this.revokeSessions(transaction, ownerId, 'ROLE_DEMOTED');
    }
  }

  private async targetOwner(
    transaction: Prisma.TransactionClient,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string | null> {
    if (targetType === ReportTargetType.POST) {
      return (
        (await transaction.post.findUnique({ where: { id: targetId }, select: { authorId: true } }))
          ?.authorId ?? null
      );
    }
    return (
      (
        await transaction.comment.findUnique({
          where: { id: targetId },
          select: { authorId: true },
        })
      )?.authorId ?? null
    );
  }

  private async setTargetVisibility(
    transaction: Prisma.TransactionClient,
    actorId: string,
    target: { targetType: ReportTargetType; targetId: string },
    visible: boolean,
  ): Promise<void> {
    const now = new Date();
    if (target.targetType === ReportTargetType.POST) {
      const post = await transaction.post.findUnique({
        where: { id: target.targetId },
        include: { author: { select: { status: true } } },
      });
      if (!post || post.status === PostStatus.DELETED)
        throw this.notFound('Post không còn moderatable');
      if (visible && !post.publishedRevisionId) {
        throw this.conflict('CONTENT_STATE_CONFLICT', 'Post chưa có published revision để restore');
      }
      if (
        visible &&
        (post.author.status === UserStatus.BANNED || post.author.status === UserStatus.DELETED)
      ) {
        throw this.conflict(
          'CONTENT_AUTHOR_INACTIVE',
          'Phải unban user trước khi restore nội dung của họ',
        );
      }
      await transaction.post.update({
        where: { id: target.targetId },
        data: visible
          ? { status: PostStatus.PUBLISHED, hiddenAt: null, hiddenById: null, hiddenReason: null }
          : {
              status: PostStatus.HIDDEN,
              hiddenAt: now,
              hiddenById: actorId,
              hiddenReason: 'MODERATION_VIOLATION',
            },
      });
      return;
    }
    const comment = await transaction.comment.findUnique({
      where: { id: target.targetId },
      include: { author: { select: { status: true } } },
    });
    if (!comment || comment.status === CommentStatus.DELETED)
      throw this.notFound('Comment không còn moderatable');
    if (
      visible &&
      (comment.author.status === UserStatus.BANNED || comment.author.status === UserStatus.DELETED)
    ) {
      throw this.conflict(
        'CONTENT_AUTHOR_INACTIVE',
        'Phải unban user trước khi restore nội dung của họ',
      );
    }
    await transaction.comment.update({
      where: { id: target.targetId },
      data: visible
        ? { status: CommentStatus.VISIBLE, hiddenAt: null, hiddenById: null, hiddenReason: null }
        : {
            status: CommentStatus.HIDDEN,
            hiddenAt: now,
            hiddenById: actorId,
            hiddenReason: 'MODERATION_VIOLATION',
          },
    });
  }

  private async applyUserStatus(
    transaction: Prisma.TransactionClient,
    actorId: string,
    user: AdminUserRecord,
    input: UpdateUserStatusInput,
  ): Promise<ModerationDecision> {
    if (user.status === input.status) {
      throw this.conflict('USER_STATUS_CONFLICT', 'User đã ở trạng thái yêu cầu');
    }
    if (input.status === UserStatus.BANNED) {
      await this.banUser(transaction, actorId, user.id);
      return ModerationDecision.BAN;
    }
    if (input.status === UserStatus.ACTIVE) {
      if (user.status === UserStatus.BANNED) {
        await transaction.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ACTIVE },
        });
        await transaction.post.updateMany({
          where: {
            authorId: user.id,
            status: PostStatus.HIDDEN,
            hiddenReason: 'USER_BANNED',
            publishedRevisionId: { not: null },
          },
          data: {
            status: PostStatus.PUBLISHED,
            hiddenAt: null,
            hiddenById: null,
            hiddenReason: null,
          },
        });
        await transaction.comment.updateMany({
          where: { authorId: user.id, status: CommentStatus.HIDDEN, hiddenReason: 'USER_BANNED' },
          data: {
            status: CommentStatus.VISIBLE,
            hiddenAt: null,
            hiddenById: null,
            hiddenReason: null,
          },
        });
        return ModerationDecision.UNBAN;
      }
      if (user.status !== UserStatus.LOCKED) {
        throw this.conflict('USER_STATUS_CONFLICT', 'Chỉ LOCKED hoặc BANNED có thể trở lại ACTIVE');
      }
      await transaction.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE, lockedUntil: null, failedLoginAttempts: 0 },
      });
      return ModerationDecision.UNLOCK;
    }
    if (input.status === UserStatus.LOCKED) {
      if (user.status !== UserStatus.ACTIVE) {
        throw this.conflict('USER_STATUS_CONFLICT', 'Chỉ ACTIVE user có thể bị khóa');
      }
      await transaction.user.update({
        where: { id: user.id },
        data: { status: UserStatus.LOCKED },
      });
      await this.revokeSessions(transaction, user.id, 'ACCOUNT_LOCKED');
      return ModerationDecision.LOCK;
    }
    const now = new Date();
    if (user.role === Role.CONTRIBUTOR && user.contributorProfile?.revokedAt === null) {
      const profile = user.contributorProfile;
      await transaction.contributorProfile.update({
        where: { userId: user.id },
        data: { revokedAt: now, revokedById: actorId, revocationReason: input.reason },
      });
      await transaction.contributorDecision.create({
        data: {
          userId: user.id,
          applicationId: profile.sourceApplicationId,
          actorId,
          decision: ContributorDecisionType.REVOKED,
          approvalBasis: profile.approvalBasis,
          evidence: profile.approvalEvidence as Prisma.InputJsonValue,
          reason: input.reason,
          createdAt: now,
        },
      });
    }
    await transaction.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.DELETED,
        role: Role.MEMBER,
        email: `deleted+${user.id}@invalid.local`,
        passwordHash: `deleted:${user.id}`,
        displayName: 'Người dùng đã xóa',
        avatarUrl: null,
        deletedAt: now,
        privateDataPurgeAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await this.revokeSessions(transaction, user.id, 'ACCOUNT_DELETED');
    return ModerationDecision.DELETE_ACCOUNT;
  }

  private async banUser(
    transaction: Prisma.TransactionClient,
    actorId: string,
    userId: string,
  ): Promise<void> {
    const now = new Date();
    await transaction.user.update({ where: { id: userId }, data: { status: UserStatus.BANNED } });
    await transaction.post.updateMany({
      where: { authorId: userId, status: PostStatus.PUBLISHED },
      data: {
        status: PostStatus.HIDDEN,
        hiddenAt: now,
        hiddenById: actorId,
        hiddenReason: 'USER_BANNED',
      },
    });
    await transaction.comment.updateMany({
      where: { authorId: userId, status: CommentStatus.VISIBLE },
      data: {
        status: CommentStatus.HIDDEN,
        hiddenAt: now,
        hiddenById: actorId,
        hiddenReason: 'USER_BANNED',
      },
    });
    await this.revokeSessions(transaction, userId, 'ACCOUNT_BANNED');
  }

  private async revokeSessions(
    transaction: Prisma.TransactionClient,
    userId: string,
    reason: string,
  ): Promise<void> {
    await transaction.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  private notFound(message: string): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message });
  }

  private conflict(code: string, message: string): AppError {
    return new AppError({ statusCode: 409, code, message });
  }
}
