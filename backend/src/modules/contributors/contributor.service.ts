import { ContributorApplicationSource, Role } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import {
  CONTRIBUTOR_REAPPLY_DAYS,
  ContributorTransitionError,
  approvedContributorTypeLabel,
  contributorTypeLabel,
  type ContributorApplicationStateMachine,
} from './contributor-application.state-machine.js';
import {
  ContributorRepositoryConflictError,
  type ContributorApplicationRecord,
  type ContributorRepository,
} from './contributor.repository.js';
import type {
  AdminContributorApplicationsQuery,
  ContributorApplicationOutput,
  OwnContributorApplicationsQuery,
  ReviewContributorApplicationInput,
  SubmitContributorApplicationInput,
} from './contributor.schemas.js';

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

function applicationOutput(
  application: ContributorApplicationRecord,
): ContributorApplicationOutput {
  const referenceLinks = Array.isArray(application.referenceLinks)
    ? application.referenceLinks.filter((link): link is string => typeof link === 'string')
    : [];
  return {
    id: application.id,
    user: {
      id: application.user.id,
      email: application.user.email,
      displayName: application.user.displayName,
      role: application.user.role,
      currentContributorType: application.user.contributorProfile?.contributorType ?? null,
    },
    requestedType: application.requestedType,
    requestedTypeLabel: contributorTypeLabel(application.requestedType),
    experience: application.experience,
    referenceLinks,
    source: application.source,
    status: application.status,
    approvedType: application.approvedType,
    approvedTypeLabel: application.approvedType
      ? approvedContributorTypeLabel(application.approvedType)
      : null,
    approvalBasis: application.approvalBasis,
    reviewNote: application.reviewNote,
    reviewedBy: application.reviewedBy
      ? { id: application.reviewedBy.id, displayName: application.reviewedBy.displayName }
      : null,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    reapplyEligibleAt: application.reapplyEligibleAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

export class ContributorService {
  constructor(
    private readonly repository: ContributorRepository,
    private readonly stateMachine: ContributorApplicationStateMachine,
  ) {}

  async submit(userId: string, input: SubmitContributorApplicationInput) {
    const now = new Date();
    const context = await this.repository.findSubmissionContext(userId);
    if (!context.user) {
      throw new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy user' });
    }
    const rejected = context.latestRejected;
    const fallbackEligibleAt = rejected
      ? new Date(
          (rejected.reviewedAt ?? rejected.updatedAt).getTime() +
            CONTRIBUTOR_REAPPLY_DAYS * 86_400_000,
        )
      : null;
    try {
      this.stateMachine.assertCanSubmit(
        {
          role: context.user.role,
          currentType: context.user.contributorProfile?.contributorType ?? null,
          hasPendingApplication: context.user.applications.length > 0,
          reapplyEligibleAt: rejected?.reapplyEligibleAt ?? fallbackEligibleAt,
        },
        input.requestedType,
        now,
      );
      const data = this.stateMachine.pendingApplicationData(
        userId,
        ContributorApplicationSource.PROFILE,
        input,
      );
      return applicationOutput(await this.repository.createApplication(data));
    } catch (error) {
      if (error instanceof ContributorRepositoryConflictError && error.kind === 'PENDING_EXISTS') {
        throw this.transitionError(new ContributorTransitionError('APPLICATION_PENDING'));
      }
      if (error instanceof ContributorTransitionError) throw this.transitionError(error);
      throw error;
    }
  }

  async listOwn(userId: string, query: OwnContributorApplicationsQuery) {
    const result = await this.repository.listOwn(userId, query);
    return {
      data: result.records.map(applicationOutput),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async listAdmin(query: AdminContributorApplicationsQuery) {
    const result = await this.repository.listAdmin(query);
    return {
      data: result.records.map(applicationOutput),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async review(
    reviewerId: string,
    applicationId: string,
    input: ReviewContributorApplicationInput,
  ) {
    const application = await this.repository.findApplication(applicationId);
    if (!application) {
      throw new AppError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Không tìm thấy Contributor application',
      });
    }
    try {
      this.stateMachine.assertCanReview(application, reviewerId);
      if (application.user.role === Role.ADMIN) {
        throw new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPLICATION_NOT_REVIEWABLE',
          message: 'Không thể chuyển tài khoản Admin thành Contributor qua application',
        });
      }
      const now = new Date();
      const data = this.stateMachine.reviewData(reviewerId, input, now);
      return applicationOutput(
        await this.repository.reviewApplication(application, reviewerId, input, data, now),
      );
    } catch (error) {
      if (
        error instanceof ContributorRepositoryConflictError &&
        error.kind === 'ALREADY_REVIEWED'
      ) {
        throw this.transitionError(new ContributorTransitionError('APPLICATION_ALREADY_REVIEWED'));
      }
      if (error instanceof ContributorRepositoryConflictError && error.kind === 'NOT_REVIEWABLE') {
        throw new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPLICATION_NOT_REVIEWABLE',
          message: 'Applicant không còn đủ điều kiện để được chuyển thành Contributor',
        });
      }
      if (error instanceof ContributorTransitionError) throw this.transitionError(error);
      throw error;
    }
  }

  private transitionError(error: ContributorTransitionError): AppError {
    switch (error.kind) {
      case 'APPLICATION_NOT_ALLOWED':
        return new AppError({
          statusCode: 403,
          code: 'CONTRIBUTOR_APPLICATION_NOT_ALLOWED',
          message: 'Chỉ Member hoặc Contributor yêu cầu đổi subtype mới được gửi application',
        });
      case 'APPLICATION_PENDING':
        return new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPLICATION_PENDING',
          message: 'Bạn đã có Contributor application đang chờ duyệt',
        });
      case 'TYPE_UNCHANGED':
        return new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_TYPE_UNCHANGED',
          message: 'Contributor type yêu cầu trùng với profile hiện tại',
        });
      case 'REAPPLY_NOT_ALLOWED':
        return new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_REAPPLY_NOT_ALLOWED',
          message: 'Chưa đủ 30 ngày kể từ lần application bị từ chối',
          ...(error.eligibleAt
            ? { fields: { reapplyEligibleAt: [error.eligibleAt.toISOString()] } }
            : {}),
        });
      case 'SELF_APPROVAL_FORBIDDEN':
        return new AppError({
          statusCode: 403,
          code: 'SELF_APPROVAL_FORBIDDEN',
          message: 'Admin không được tự duyệt application của chính mình',
        });
      case 'APPLICATION_ALREADY_REVIEWED':
        return new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPLICATION_ALREADY_REVIEWED',
          message: 'Contributor application đã được xử lý',
        });
    }
  }
}
