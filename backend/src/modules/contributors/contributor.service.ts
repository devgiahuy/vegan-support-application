import { ContributorApplicationSource, Role, UserStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import {
  CONTRIBUTOR_REAPPLY_DAYS,
  ContributorTransitionError,
  contributorApprovalBasisLabel,
  type ContributorApplicationStateMachine,
} from './contributor-application.state-machine.js';
import {
  ContributorRepositoryConflictError,
  type ContributorApplicationRecord,
  type ContributorRepository,
} from './contributor.repository.js';
import {
  contributorApprovalEvidenceSchema,
  type AdminContributorApplicationsQuery,
  type ContributorApplicationOutput,
  type InviteContributorInput,
  type OwnContributorApplicationsQuery,
  type ReviewContributorApplicationInput,
  type SubmitContributorApplicationInput,
} from './contributor.schemas.js';

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

function referenceLinks(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((link): link is string => typeof link === 'string')
    : [];
}

function applicationOutput(
  application: ContributorApplicationRecord,
): ContributorApplicationOutput {
  const activeProfile =
    application.user.role === Role.CONTRIBUTOR &&
    application.user.contributorProfile?.revokedAt === null
      ? application.user.contributorProfile
      : null;
  return {
    id: application.id,
    user: {
      id: application.user.id,
      email: application.user.email,
      displayName: application.user.displayName,
      role: application.user.role,
      currentApprovalBasis: activeProfile?.approvalBasis ?? null,
    },
    claimedApprovalBasis: application.claimedApprovalBasis,
    claimedApprovalBasisLabel: contributorApprovalBasisLabel(application.claimedApprovalBasis),
    organizationClaim: application.organizationClaim,
    experience: application.experience,
    referenceLinks: referenceLinks(application.referenceLinks),
    source: application.source,
    invitedBy: application.invitedBy,
    invitationReason: application.invitationReason,
    status: application.status,
    approvalBasis: application.approvalBasis,
    approvalBasisLabel: application.approvalBasis
      ? contributorApprovalBasisLabel(application.approvalBasis)
      : null,
    reviewEvidence: application.reviewEvidence
      ? contributorApprovalEvidenceSchema.parse(application.reviewEvidence)
      : null,
    reviewNote: application.reviewNote,
    reviewedBy: application.reviewedBy,
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
          hasPendingApplication: context.user.applications.length > 0,
          reapplyEligibleAt: rejected?.reapplyEligibleAt ?? fallbackEligibleAt,
        },
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

  async invite(inviterId: string, input: InviteContributorInput) {
    if (inviterId === input.userId) {
      throw this.transitionError(new ContributorTransitionError('SELF_APPROVAL_FORBIDDEN'));
    }
    const target = await this.repository.findInvitationTarget(input.userId);
    if (
      !target ||
      target.role !== Role.MEMBER ||
      target.status !== UserStatus.ACTIVE ||
      target.applications.length > 0
    ) {
      throw new AppError({
        statusCode: 409,
        code: target?.applications.length
          ? 'CONTRIBUTOR_APPLICATION_PENDING'
          : 'CONTRIBUTOR_INVITATION_NOT_ALLOWED',
        message: 'Chỉ có thể mời Member ACTIVE chưa có application đang chờ duyệt',
      });
    }
    try {
      const data = this.stateMachine.invitedApplicationData(
        input.userId,
        inviterId,
        input.reason,
      );
      return applicationOutput(await this.repository.createApplication(data));
    } catch (error) {
      if (error instanceof ContributorRepositoryConflictError && error.kind === 'PENDING_EXISTS') {
        throw this.transitionError(new ContributorTransitionError('APPLICATION_PENDING'));
      }
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
      this.stateMachine.assertCanReview(application, reviewerId, input);
      if (application.user.role !== Role.MEMBER) {
        throw new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPLICATION_NOT_REVIEWABLE',
          message: 'Applicant không còn là Member đủ điều kiện để được duyệt',
        });
      }
      const now = new Date();
      return applicationOutput(
        await this.repository.reviewApplication(
          application.id,
          reviewerId,
          input,
          this.stateMachine,
          now,
        ),
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

  async revoke(actorId: string, userId: string, reason: string) {
    if (actorId === userId) {
      throw new AppError({
        statusCode: 403,
        code: 'SELF_APPROVAL_FORBIDDEN',
        message: 'Admin không được tự thay đổi Contributor status của chính mình',
      });
    }
    try {
      const result = await this.repository.revokeContributor(userId, actorId, reason, new Date());
      return { ...result, revokedAt: result.revokedAt.toISOString() };
    } catch (error) {
      if (
        error instanceof ContributorRepositoryConflictError &&
        error.kind === 'REVOCATION_NOT_APPLICABLE'
      ) {
        throw new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_REVOCATION_NOT_APPLICABLE',
          message: 'User không có Contributor profile đang hoạt động để thu hồi',
        });
      }
      throw error;
    }
  }

  private transitionError(error: ContributorTransitionError): AppError {
    switch (error.kind) {
      case 'APPLICATION_NOT_ALLOWED':
        return new AppError({
          statusCode: 403,
          code: 'CONTRIBUTOR_APPLICATION_NOT_ALLOWED',
          message: 'Chỉ Member mới được gửi Contributor application',
        });
      case 'APPLICATION_PENDING':
        return new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPLICATION_PENDING',
          message: 'User đã có Contributor application đang chờ duyệt',
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
          message: 'Admin không được tự duyệt hoặc tự mời chính mình',
        });
      case 'APPLICATION_ALREADY_REVIEWED':
        return new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPLICATION_ALREADY_REVIEWED',
          message: 'Contributor application đã được xử lý',
        });
      case 'APPROVAL_BASIS_NOT_ALLOWED':
        return new AppError({
          statusCode: 409,
          code: 'CONTRIBUTOR_APPROVAL_BASIS_INVALID',
          message: 'Approval basis không phù hợp với nguồn application hoặc evidence đã lưu',
        });
    }
  }
}
