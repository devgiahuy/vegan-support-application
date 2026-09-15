import { PostRevisionStatus, PostStatus } from '@prisma/client';
import type { ContentActor } from './content.service.js';

export interface SubmissionDecision {
  postStatus: PostStatus;
  revisionStatus: PostRevisionStatus;
}

export interface ContentPublicationPolicy {
  decideInitialSubmission(actor: ContentActor): SubmissionDecision;
}

export class Phase04PendingReviewPolicy implements ContentPublicationPolicy {
  decideInitialSubmission(_actor: ContentActor): SubmissionDecision {
    // Phase 07 may replace this only after approved contributor profiles exist.
    // Phase 08 must add moderation before API submissions can auto-publish.
    return {
      postStatus: PostStatus.PENDING_REVIEW,
      revisionStatus: PostRevisionStatus.PENDING_REVIEW,
    };
  }
}
