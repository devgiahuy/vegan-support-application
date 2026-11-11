/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostStatus } from '@/common/enums';
import { revisionStatusFromDto } from '../mappers/post-shared';
import { getSubmitFeedback, getSubmitOutcome } from './submit-outcome';

test('revision status decides the submit outcome', () => {
  assert.equal(getSubmitOutcome(PostStatus.PUBLISHED), 'PUBLISHED');
  assert.equal(getSubmitOutcome(PostStatus.PENDING_REVIEW), 'IN_REVIEW');
  assert.equal(getSubmitOutcome(PostStatus.FLAGGED), 'IN_REVIEW');
  assert.equal(getSubmitOutcome(PostStatus.QUARANTINED), 'IN_REVIEW');
  assert.equal(getSubmitOutcome(PostStatus.DRAFT), 'DRAFT');
});

test('revision status wins over the post status and falls back to it when absent', () => {
  // Published post whose new revision is still waiting for review (Member editing a live post).
  assert.equal(
    revisionStatusFromDto({ status: 'PUBLISHED', revision: { status: 'PENDING_REVIEW' } }),
    PostStatus.PENDING_REVIEW
  );
  // A failed submit leaves the new revision as a draft even though the post stays published.
  assert.equal(
    getSubmitOutcome(revisionStatusFromDto({ status: 'PUBLISHED', revision: { status: 'DRAFT' } })),
    'DRAFT'
  );
  assert.equal(revisionStatusFromDto({ status: 'PENDING_REVIEW', revision: null }), PostStatus.PENDING_REVIEW);
  assert.equal(revisionStatusFromDto({ status: 'PUBLISHED', revision: { status: 'NOT_A_STATUS' } }), PostStatus.DRAFT);
  assert.equal(revisionStatusFromDto(undefined), PostStatus.DRAFT);
});

test('feedback never claims review for an auto-published item or publication for a draft', () => {
  const published = getSubmitFeedback('PUBLISHED', 'công thức');
  assert.match(published.message, /xuất bản/);
  assert.doesNotMatch(published.message, /kiểm duyệt|chờ duyệt/);
  const review = getSubmitFeedback('IN_REVIEW', 'bài viết');
  assert.match(review.message, /kiểm duyệt/);
  const draft = getSubmitFeedback('DRAFT', 'video', true);
  assert.match(draft.message, /chưa gửi được/);
  assert.doesNotMatch(draft.message, /xuất bản/);
});
