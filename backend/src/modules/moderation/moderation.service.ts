import {
  AiFlagRiskLevel,
  ModerationPriority,
  PostRevisionStatus,
  Prisma,
  ReportTargetType,
  Role,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type {
  AdminCommentRecord,
  AdminUserRecord,
  ModerationActor,
  ModerationRepository,
  ReportRecord,
  ReviewRevisionRecord,
} from './moderation.repository.js';
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

function jsonStringList(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export class ModerationService {
  constructor(private readonly repository: ModerationRepository) {}

  async listReviewQueue(actor: ModerationActor, query: ReviewQueueQuery) {
    const result = await this.repository.listReviewQueue(actor, query);
    return {
      data: await Promise.all(result.records.map((record) => this.reviewOutput(record, actor))),
      meta: result.meta,
    };
  }

  async reviewPost(
    actor: ModerationActor,
    postId: string,
    decision: 'APPROVE' | 'REJECT',
    input: ReviewDecisionInput,
  ) {
    try {
      return await this.reviewOutput(
        await this.repository.reviewPost(actor, postId, decision, input),
        actor,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' || error.code === 'P2025')
      ) {
        throw new AppError({
          statusCode: 409,
          code: 'REVIEW_CONFLICT',
          message: 'Revision đã được reviewer khác xử lý',
        });
      }
      throw error;
    }
  }

  async createReport(reporterId: string, input: CreateReportInput) {
    try {
      return await this.reportOutput(await this.repository.createReport(reporterId, input));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError({
          statusCode: 409,
          code: 'DUPLICATE_ACTIVE_REPORT',
          message: 'Bạn đã có report chưa xử lý cho target này',
        });
      }
      throw error;
    }
  }

  async listReports(query: AdminReportsQuery) {
    const result = await this.repository.listReports(query);
    return {
      data: await Promise.all(result.records.map((record) => this.reportOutput(record))),
      meta: result.meta,
    };
  }

  async resolveReport(actorId: string, reportId: string, input: ResolveReportInput) {
    try {
      return await this.reportOutput(await this.repository.resolveReport(actorId, reportId, input));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new AppError({
          statusCode: 409,
          code: 'REPORT_REVIEW_CONFLICT',
          message: 'Report đã được Admin khác xử lý',
        });
      }
      throw error;
    }
  }

  async listUsers(query: AdminUsersQuery) {
    const result = await this.repository.listUsers(query);
    return { data: result.records.map((record) => this.userOutput(record)), meta: result.meta };
  }

  async updateUserStatus(actorId: string, userId: string, input: UpdateUserStatusInput) {
    return this.userOutput(await this.repository.updateUserStatus(actorId, userId, input));
  }

  async listComments(query: AdminCommentsQuery) {
    const result = await this.repository.listComments(query);
    return { data: result.records.map((record) => this.commentOutput(record)), meta: result.meta };
  }

  async updateCommentStatus(actorId: string, commentId: string, input: UpdateCommentStatusInput) {
    return this.commentOutput(await this.repository.updateCommentStatus(actorId, commentId, input));
  }

  private async reviewOutput(record: ReviewRevisionRecord, actor: ModerationActor) {
    const activeReporterCount = await this.repository.countOpenReports(
      ReportTargetType.POST,
      record.postId,
    );
    const aiFlags = record.aiFlags.map((flag) => ({
      id: flag.id,
      provider: flag.provider,
      model: flag.model,
      ruleVersion: flag.ruleVersion,
      reasonCodes: jsonStringList(flag.reasonCodes),
      riskScore: Number(flag.riskScore),
      riskLevel: flag.riskLevel,
      status: flag.status,
      createdAt: flag.createdAt.toISOString(),
    }));
    const hasHighFlag = record.aiFlags.some(
      (flag) => flag.riskLevel === AiFlagRiskLevel.HIGH && flag.status === 'OPEN',
    );
    const canDecide =
      record.status === PostRevisionStatus.PUBLISHED ||
      record.status === PostRevisionStatus.REJECTED
        ? false
        : actor.role === Role.ADMIN ||
          (record.post.author.role === Role.MEMBER &&
            record.createdById !== actor.userId &&
            !record.aiFlags.some((flag) => flag.status === 'OPEN') &&
            activeReporterCount < 5 &&
            record.status === PostRevisionStatus.PENDING_REVIEW);
    return {
      postId: record.postId,
      type: record.post.type,
      slug: record.post.slug,
      postStatus: record.post.status,
      revisionId: record.id,
      revisionVersion: record.version,
      revisionStatus: record.status,
      title: record.title,
      excerpt: record.excerpt,
      author: {
        id: record.post.author.id,
        displayName: record.post.author.displayName,
        role: record.post.author.role,
        contributorType: record.post.author.contributorProfile?.contributorType ?? null,
      },
      aiFlags,
      priority:
        hasHighFlag || activeReporterCount >= 5
          ? ModerationPriority.HIGH
          : ModerationPriority.NORMAL,
      activeReporterCount,
      canDecide,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private async reportOutput(record: ReportRecord) {
    return {
      id: record.id,
      reporterId: record.reporterId,
      targetType: record.targetType,
      targetId: record.targetId,
      reasonCode: record.reasonCode,
      details: record.details,
      status: record.status,
      priority: record.priority,
      activeReporterCount: await this.repository.countOpenReports(
        record.targetType,
        record.targetId,
      ),
      resolvedDecision: record.resolvedDecision,
      resolvedReason: record.resolvedReason,
      resolvedById: record.resolvedById,
      resolvedAt: record.resolvedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private userOutput(record: AdminUserRecord) {
    return {
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      role: record.role,
      status: record.status,
      contributorType: record.contributorProfile?.contributorType ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt?.toISOString() ?? null,
      privateDataPurgeAt: record.privateDataPurgeAt?.toISOString() ?? null,
    };
  }

  private commentOutput(record: AdminCommentRecord) {
    return {
      id: record.id,
      postId: record.postId,
      parentId: record.parentId,
      content: record.content,
      status: record.status,
      author: {
        id: record.author.id,
        displayName: record.author.displayName,
        role: record.author.role,
        contributorType: record.author.contributorProfile?.contributorType ?? null,
      },
      hiddenReason: record.hiddenReason,
      hiddenById: record.hiddenById,
      hiddenAt: record.hiddenAt?.toISOString() ?? null,
      deletedAt: record.deletedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
