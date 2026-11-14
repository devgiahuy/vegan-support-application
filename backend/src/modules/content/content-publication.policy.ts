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
  /** Trusted recipe author (approved Contributor or Admin) published without the review queue. */
  autoPublished: boolean;
}

export interface ContentPublicationPolicy {
  draft(): SubmissionDecision;
  decideSubmission(
    actor: ContentActor,
    input: RuleModerationInput,
    options?: { autoPublish: boolean },
  ): SubmissionDecision;
}

export class ModeratedPublicationPolicy implements ContentPublicationPolicy {
  constructor(private readonly moderation: RuleModerationService) {}

  draft(): SubmissionDecision {
    return {
      postStatus: PostStatus.DRAFT,
      revisionStatus: PostRevisionStatus.DRAFT,
      moderationFlag: null,
      autoPublished: false,
    };
  }

  decideSubmission(
    _actor: ContentActor,
    input: RuleModerationInput,
    options: { autoPublish: boolean } = { autoPublish: false },
  ): SubmissionDecision {
    const moderationFlag = this.moderation.moderate(input);
    // A moderation signal always routes to the Admin queue, even for trusted authors.
    if (options.autoPublish && !moderationFlag) {
      return {
        postStatus: PostStatus.PUBLISHED,
        revisionStatus: PostRevisionStatus.PUBLISHED,
        moderationFlag: null,
        autoPublished: true,
      };
    }
    return {
      postStatus: PostStatus.PENDING_REVIEW,
      revisionStatus: PostRevisionStatus.PENDING_REVIEW,
      moderationFlag,
      autoPublished: false,
    };
  }
}
