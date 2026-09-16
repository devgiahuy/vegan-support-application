import { AiFlagRiskLevel, PostRevisionStatus, PostStatus, Role } from '@prisma/client';
import type { ContentActor } from './content.service.js';
import type {
  RuleModerationFlag,
  RuleModerationInput,
  RuleModerationService,
} from '../moderation/rule-moderation.service.js';

export interface SubmissionDecision {
  postStatus: PostStatus;
  revisionStatus: PostRevisionStatus;
  moderationFlag: RuleModerationFlag | null;
}

export interface ContentPublicationPolicy {
  decideSubmission(actor: ContentActor, input: RuleModerationInput): SubmissionDecision;
}

export class ModeratedPublicationPolicy implements ContentPublicationPolicy {
  constructor(private readonly moderation: RuleModerationService) {}

  decideSubmission(actor: ContentActor, input: RuleModerationInput): SubmissionDecision {
    const moderationFlag = this.moderation.moderate(input);
    if (moderationFlag?.riskLevel === AiFlagRiskLevel.HIGH) {
      return {
        postStatus: PostStatus.QUARANTINED,
        revisionStatus: PostRevisionStatus.QUARANTINED,
        moderationFlag,
      };
    }
    if (actor.role === Role.MEMBER || (actor.role === Role.CONTRIBUTOR && !actor.contributorType)) {
      return {
        postStatus: PostStatus.PENDING_REVIEW,
        revisionStatus: PostRevisionStatus.PENDING_REVIEW,
        moderationFlag,
      };
    }
    if (moderationFlag) {
      return {
        postStatus: PostStatus.FLAGGED,
        revisionStatus: PostRevisionStatus.FLAGGED,
        moderationFlag,
      };
    }
    return {
      postStatus: PostStatus.PUBLISHED,
      revisionStatus: PostRevisionStatus.PUBLISHED,
      moderationFlag: null,
    };
  }
}
