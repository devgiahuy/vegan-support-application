import {
  ContributorApplicationSource,
  ContributorApplicationStatus,
  ContributorApprovalBasis,
  Role,
} from '@prisma/client';

export const CONTRIBUTOR_REAPPLY_DAYS = 30;

export function contributorApprovalBasisLabel(basis: ContributorApprovalBasis): string {
  switch (basis) {
    case ContributorApprovalBasis.ORGANIZATION_AFFILIATION:
      return 'Liên kết tổ chức';
    case ContributorApprovalBasis.PLATFORM_TRACK_RECORD:
      return 'Lịch sử đóng góp trên nền tảng';
    case ContributorApprovalBasis.ADMIN_INVITED:
      return 'Được Admin mời';
  }
}

export interface ContributorSubmission {
  claimedApprovalBasis:
    | typeof ContributorApprovalBasis.ORGANIZATION_AFFILIATION
    | typeof ContributorApprovalBasis.PLATFORM_TRACK_RECORD;
  organizationClaim?: string | undefined;
  experience: string;
  referenceLinks: string[];
}

export interface ContributorSubmissionContext {
  role: Role;
  hasPendingApplication: boolean;
  reapplyEligibleAt: Date | null;
}

export type ContributorTransitionErrorKind =
  | 'APPLICATION_NOT_ALLOWED'
  | 'APPLICATION_PENDING'
  | 'REAPPLY_NOT_ALLOWED'
  | 'SELF_APPROVAL_FORBIDDEN'
  | 'APPLICATION_ALREADY_REVIEWED'
  | 'APPROVAL_BASIS_NOT_ALLOWED';

export class ContributorTransitionError extends Error {
  constructor(
    readonly kind: ContributorTransitionErrorKind,
    readonly eligibleAt?: Date,
  ) {
    super(kind);
    this.name = 'ContributorTransitionError';
  }
}

export type ContributorReviewInput =
  | {
      decision: 'APPROVE';
      approvalBasis: ContributorApprovalBasis;
      reviewNote: string;
    }
  | { decision: 'REJECT'; reviewNote: string };

export class ContributorApplicationStateMachine {
  pendingApplicationData(
    userId: string,
    source:
      | typeof ContributorApplicationSource.REGISTRATION
      | typeof ContributorApplicationSource.PROFILE,
    input: ContributorSubmission,
  ) {
    return {
      userId,
      claimedApprovalBasis: input.claimedApprovalBasis,
      organizationClaim: input.organizationClaim ?? null,
      experience: input.experience,
      referenceLinks: input.referenceLinks,
      source,
      status: ContributorApplicationStatus.PENDING,
    };
  }

  invitedApplicationData(userId: string, inviterId: string, invitationReason: string) {
    return {
      userId,
      claimedApprovalBasis: ContributorApprovalBasis.ADMIN_INVITED,
      organizationClaim: null,
      experience: invitationReason,
      referenceLinks: [],
      source: ContributorApplicationSource.ADMIN_INVITATION,
      invitedById: inviterId,
      invitationReason,
      status: ContributorApplicationStatus.PENDING,
    };
  }

  assertCanSubmit(context: ContributorSubmissionContext, now: Date): void {
    if (context.role !== Role.MEMBER) {
      throw new ContributorTransitionError('APPLICATION_NOT_ALLOWED');
    }
    if (context.hasPendingApplication) {
      throw new ContributorTransitionError('APPLICATION_PENDING');
    }
    if (context.reapplyEligibleAt && context.reapplyEligibleAt > now) {
      throw new ContributorTransitionError('REAPPLY_NOT_ALLOWED', context.reapplyEligibleAt);
    }
  }

  assertCanReview(
    application: {
      userId: string;
      status: ContributorApplicationStatus;
      source: ContributorApplicationSource;
      organizationClaim: string | null;
    },
    reviewerId: string,
    input: ContributorReviewInput,
  ): void {
    if (application.userId === reviewerId) {
      throw new ContributorTransitionError('SELF_APPROVAL_FORBIDDEN');
    }
    if (application.status !== ContributorApplicationStatus.PENDING) {
      throw new ContributorTransitionError('APPLICATION_ALREADY_REVIEWED');
    }
    if (input.decision !== 'APPROVE') return;

    if (
      application.source === ContributorApplicationSource.ADMIN_INVITATION &&
      input.approvalBasis !== ContributorApprovalBasis.ADMIN_INVITED
    ) {
      throw new ContributorTransitionError('APPROVAL_BASIS_NOT_ALLOWED');
    }
    if (
      application.source !== ContributorApplicationSource.ADMIN_INVITATION &&
      input.approvalBasis === ContributorApprovalBasis.ADMIN_INVITED
    ) {
      throw new ContributorTransitionError('APPROVAL_BASIS_NOT_ALLOWED');
    }
    if (
      input.approvalBasis === ContributorApprovalBasis.ORGANIZATION_AFFILIATION &&
      !application.organizationClaim
    ) {
      throw new ContributorTransitionError('APPROVAL_BASIS_NOT_ALLOWED');
    }
  }

  reviewData(
    reviewerId: string,
    input: ContributorReviewInput,
    evidence: object | null,
    now: Date,
  ) {
    if (input.decision === 'APPROVE') {
      return {
        status: ContributorApplicationStatus.APPROVED,
        approvalBasis: input.approvalBasis,
        reviewEvidence: evidence,
        reviewNote: input.reviewNote,
        reviewedById: reviewerId,
        reviewedAt: now,
        reapplyEligibleAt: null,
      };
    }
    return {
      status: ContributorApplicationStatus.REJECTED,
      approvalBasis: null,
      reviewEvidence: null,
      reviewNote: input.reviewNote,
      reviewedById: reviewerId,
      reviewedAt: now,
      reapplyEligibleAt: new Date(now.getTime() + CONTRIBUTOR_REAPPLY_DAYS * 86_400_000),
    };
  }
}
