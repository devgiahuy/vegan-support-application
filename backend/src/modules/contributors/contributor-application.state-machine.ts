import {
  ContributorApplicationStatus,
  ContributorType,
  Role,
  type ContributorApplicationSource,
} from '@prisma/client';

export const CONTRIBUTOR_REAPPLY_DAYS = 30;

export function contributorTypeLabel(type: ContributorType): string {
  return type === ContributorType.NUTRITION_EXPERT
    ? 'Chuyên gia dinh dưỡng'
    : 'Người thực hành có kinh nghiệm';
}

export function approvedContributorTypeLabel(type: ContributorType): string {
  return `${contributorTypeLabel(type)} được Admin duyệt`;
}

export interface ContributorSubmission {
  requestedType: ContributorType;
  experience: string;
  referenceLinks: string[];
}

export interface ContributorSubmissionContext {
  role: Role;
  currentType: ContributorType | null;
  hasPendingApplication: boolean;
  reapplyEligibleAt: Date | null;
}

export type ContributorTransitionErrorKind =
  | 'APPLICATION_NOT_ALLOWED'
  | 'APPLICATION_PENDING'
  | 'TYPE_UNCHANGED'
  | 'REAPPLY_NOT_ALLOWED'
  | 'SELF_APPROVAL_FORBIDDEN'
  | 'APPLICATION_ALREADY_REVIEWED';

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
      contributorType: ContributorType;
      approvalBasis: string;
      reviewNote: string;
    }
  | { decision: 'REJECT'; reviewNote: string };

export class ContributorApplicationStateMachine {
  pendingApplicationData(
    userId: string,
    source: ContributorApplicationSource,
    input: ContributorSubmission,
  ) {
    return {
      userId,
      requestedType: input.requestedType,
      experience: input.experience,
      referenceLinks: input.referenceLinks,
      source,
      status: ContributorApplicationStatus.PENDING,
    };
  }

  assertCanSubmit(
    context: ContributorSubmissionContext,
    requestedType: ContributorType,
    now: Date,
  ): void {
    if (context.role === Role.ADMIN) {
      throw new ContributorTransitionError('APPLICATION_NOT_ALLOWED');
    }
    if (context.hasPendingApplication) {
      throw new ContributorTransitionError('APPLICATION_PENDING');
    }
    if (context.currentType === requestedType) {
      throw new ContributorTransitionError('TYPE_UNCHANGED');
    }
    if (context.reapplyEligibleAt && context.reapplyEligibleAt > now) {
      throw new ContributorTransitionError('REAPPLY_NOT_ALLOWED', context.reapplyEligibleAt);
    }
  }

  assertCanReview(
    application: { userId: string; status: ContributorApplicationStatus },
    reviewerId: string,
  ): void {
    if (application.userId === reviewerId) {
      throw new ContributorTransitionError('SELF_APPROVAL_FORBIDDEN');
    }
    if (application.status !== ContributorApplicationStatus.PENDING) {
      throw new ContributorTransitionError('APPLICATION_ALREADY_REVIEWED');
    }
  }

  reviewData(reviewerId: string, input: ContributorReviewInput, now: Date) {
    if (input.decision === 'APPROVE') {
      return {
        status: ContributorApplicationStatus.APPROVED,
        approvedType: input.contributorType,
        approvalBasis: input.approvalBasis,
        reviewNote: input.reviewNote,
        reviewedById: reviewerId,
        reviewedAt: now,
        reapplyEligibleAt: null,
      };
    }
    return {
      status: ContributorApplicationStatus.REJECTED,
      approvedType: null,
      approvalBasis: null,
      reviewNote: input.reviewNote,
      reviewedById: reviewerId,
      reviewedAt: now,
      reapplyEligibleAt: new Date(now.getTime() + CONTRIBUTOR_REAPPLY_DAYS * 86_400_000),
    };
  }
}
