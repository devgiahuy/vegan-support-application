import { lockDocument } from '../../database/locking.js';
import type { Prisma } from '@prisma/client';
import {
  AiFlagStatus,
  CommentStatus,
  ContributorDecisionType,
  ModerationDecision,
  ModerationPriority,
  ModerationTargetType,
  PostRevisionStatus,
  PostStatus,
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
  reviewedBy: { select: reviewerUserSelect },
  categories: { include: { category: true }, orderBy: { category: { name: 'asc' } } },
  tags: { orderBy: { normalizedTag: 'asc' } },
  media: { orderBy: { position: 'asc' } },
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

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

export class ModerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listReviewQueue(actor: ModerationActor, query: ReviewQueueQuery) {
    const highReports = await this.prisma.report.findMany({
      where: {
        targetType: ReportTargetType.POST,
        status: ReportStatus.OPEN,
        priority: ModerationPriority.HIGH,
      },
      select: { targetId: true },
    });
    const highIds = highReports.map((report) => report.targetId);
    const highWhere: Prisma.PostRevisionWhereInput = {
      OR: [
        { aiFlags: { some: { riskLevel: 'HIGH', status: AiFlagStatus.OPEN } } },
        { postId: { in: highIds } },
      ],
    };
    const where: Prisma.PostRevisionWhereInput = {
      status:
        actor.role !== Role.ADMIN
          ? PostRevisionStatus.PENDING_REVIEW
          : (query.status ?? {
              in: [
                PostRevisionStatus.PENDING_REVIEW,
                PostRevisionStatus.FLAGGED,
                PostRevisionStatus.QUARANTINED,
              ],
            }),
      post: {
        status: { notIn: [PostStatus.HIDDEN, PostStatus.DELETED] },
        ...(query.type ? { type: query.type } : {}),
        ...(actor.role !== Role.ADMIN ? { author: { role: Role.MEMBER } } : {}),
      },
      ...(actor.role !== Role.ADMIN
        ? {
            createdById: { not: actor.userId },
            aiFlags: { none: { status: AiFlagStatus.OPEN } },
            postId: { notIn: highIds },
          }
        : {}),
      ...(query.priority === ModerationPriority.HIGH
        ? highWhere
        : query.priority === ModerationPriority.NORMAL
          ? { NOT: highWhere }
          : {}),
    };
    // A post's current version must match the submitted revision. Prisma cannot
    // express equality across two joined documents, so select current post IDs first.
    const posts = await this.prisma.post.findMany({
      where: { status: { notIn: [PostStatus.HIDDEN, PostStatus.DELETED] } },
      select: { id: true, version: true },
    });
    const current = posts.map((post) => ({ postId: post.id, version: post.version }));
    const matchedWhere = { AND: [where, { OR: current }] };
    const candidates = await this.prisma.postRevision.findMany({
      where: matchedWhere,
      select: { id: true, status: true, createdAt: true },
    });
    const rank = (status: PostRevisionStatus) =>
      status === PostRevisionStatus.QUARANTINED ? 0 : status === PostRevisionStatus.FLAGGED ? 1 : 2;
    candidates.sort(
      (left, right) =>
        rank(left.status) - rank(right.status) ||
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    );
    const page = candidates.slice((query.page - 1) * query.limit, query.page * query.limit);
    return {
      records: await this.hydrateRevisions(page.map((row) => row.id)),
      meta: pagination(query.page, query.limit, candidates.length),
    };
  }

  async reviewPost(
    actor: ModerationActor,
    postId: string,
    decision: 'APPROVE' | 'REJECT',
    input: ReviewDecisionInput,
  ): Promise<ReviewRevisionRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'post', { id: postId });
      const post = await transaction.post.findUnique({
        where: { id: postId },
        select: { version: true },
      });
      const current = post
        ? await transaction.postRevision.findFirst({
            where: { postId, version: post.version },
            select: { id: true },
          })
        : null;
      const revisionId = current?.id;
      if (revisionId) await lockDocument(transaction, 'postRevision', { id: revisionId });
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

  findReviewRevision(revisionId: string): Promise<ReviewRevisionRecord | null> {
    return this.prisma.postRevision.findUnique({
      where: { id: revisionId },
      include: reviewRevisionInclude,
    });
  }

  async reviewRevisionAdmin(
    actor: ModerationActor,
    revisionId: string,
    decision: 'APPROVE' | 'REJECT',
    input: ReviewDecisionInput,
  ): Promise<ReviewRevisionRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'postRevision', { id: revisionId });
      const candidate = await transaction.postRevision.findUnique({
        where: { id: revisionId },
        include: { post: true },
      });
      if (!candidate || candidate.version !== candidate.post.version)
        throw this.notFound('Không tìm thấy revision review target');
      await lockDocument(transaction, 'post', { id: candidate.postId });
      const revision = await transaction.postRevision.findUniqueOrThrow({
        where: { id: revisionId },
        include: reviewRevisionInclude,
      });
      if (actor.role !== Role.ADMIN) {
        throw new AppError({
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Chỉ Admin được đưa ra quyết định publication cuối cùng',
        });
      }
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
          message: 'Admin không được review nội dung do chính mình tạo',
        });
      }
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
      const unavailablePostStatuses: PostStatus[] = [PostStatus.HIDDEN, PostStatus.DELETED];
      if (unavailablePostStatuses.includes(revision.post.status)) {
        throw this.conflict(
          'CONTENT_STATE_CONFLICT',
          'Nội dung đang bị ẩn hoặc đã xóa; review evidence được giữ nhưng không thể quyết định publication',
        );
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
        throw this.conflict('REVIEW_CONFLICT', 'Revision đã được Admin khác xử lý');
      }
      if (decision === ModerationDecision.APPROVE) {
        await transaction.post.update({
          where: { id: revision.postId },
          data: {
            status: PostStatus.PUBLISHED,
            publishedRevisionId: revision.id,
            publishedAt: now,
            hiddenAt: null,
            hiddenById: null,
            hiddenReason: null,
          },
        });
      } else if (!revision.post.publishedRevisionId) {
        await transaction.post.update({
          where: { id: revision.postId },
          data: { status: PostStatus.REJECTED },
        });
      }
      const openFlags = revision.aiFlags.filter((flag) => flag.status === AiFlagStatus.OPEN);
      if (openFlags.length) {
        await transaction.aiFlag.updateMany({
          where: { id: { in: openFlags.map((flag) => flag.id) }, status: AiFlagStatus.OPEN },
          data: { status: AiFlagStatus.REVIEWED, reviewedById: actor.userId, reviewedAt: now },
        });
      }
      await transaction.moderationAction.create({
        data: {
          actorId: actor.userId,
          decision,
          targetType: ModerationTargetType.POST,
          targetId: revision.postId,
          reason: input.reason,
          relatedAiFlagIds: openFlags.map((flag) => flag.id),
          metadata: {
            revisionId: revision.id,
            revisionVersion: revision.version,
            reviewerRole: actor.role,
            previousPostStatus: revision.post.status,
            previousRevisionStatus: revision.status,
            reviewRouteDecision: decision,
            automatedDecision: false,
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
    const [records, total] = await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.report.findMany({
          where,
          include: reportInclude,
          orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        transaction.report.count({ where }),
      ]),
    );
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
      await transaction.report.updateMany({
        where: {
          targetType: initialReport.targetType,
          targetId: initialReport.targetId,
          status: ReportStatus.OPEN,
        },
        data: { lockVersion: { increment: 1 } },
      });
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
    const [records, total] = await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.user.findMany({
          where,
          include: adminUserInclude,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        transaction.user.count({ where }),
      ]),
    );
    return { records, meta: pagination(query.page, query.limit, total) };
  }

  async updateUserStatus(
    actorId: string,
    userId: string,
    input: UpdateUserStatusInput,
  ): Promise<AdminUserRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const locked = await lockDocument(transaction, 'user', { id: userId });
      if (!locked) throw this.notFound('Không tìm thấy user');
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
    const [records, total] = await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.comment.findMany({
          where,
          include: adminCommentInclude,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        transaction.comment.count({ where }),
      ]),
    );
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
    await lockDocument(transaction, targetType === ReportTargetType.POST ? 'post' : 'comment', {
      id: targetId,
    });
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
