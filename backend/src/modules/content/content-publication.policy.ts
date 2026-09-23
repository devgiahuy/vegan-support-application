import { PostRevisionStatus, PostStatus } from '@prisma/client';
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
  draft(): SubmissionDecision;
  decideSubmission(actor: ContentActor, input: RuleModerationInput): SubmissionDecision;
}

export class ModeratedPublicationPolicy implements ContentPublicationPolicy {
  constructor(private readonly moderation: RuleModerationService) {}

  draft(): SubmissionDecision {
    return {
      postStatus: PostStatus.DRAFT,
      revisionStatus: PostRevisionStatus.DRAFT,
      moderationFlag: null,
    };
  }

  decideSubmission(_actor: ContentActor, input: RuleModerationInput): SubmissionDecision {
    const moderationFlag = this.moderation.moderate(input);
    return {
      postStatus: PostStatus.PENDING_REVIEW,
      revisionStatus: PostRevisionStatus.PENDING_REVIEW,
      moderationFlag,
    };
  }
}
