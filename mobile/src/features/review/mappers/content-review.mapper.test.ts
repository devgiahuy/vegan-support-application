/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostType } from '@/common/enums';
import { contentReviewMapper } from './content-review.mapper';
import { getContentReviewErrorMessage, localizeReviewReasonError } from '../utils/content-review-errors';

const item = {
  postId: 'p1', revisionId: 'r1', revisionVersion: 2, type: 'RECIPE', postStatus: 'PENDING_REVIEW', title: 'Cơm chiên',
  excerpt: null, priority: 'HIGH', activeReporterCount: 3, canDecide: true, submittedAt: '2026-10-26T03:00:00.000Z', createdAt: '2026-10-25T03:00:00.000Z',
  author: { id: 'u1', displayName: 'Mai', role: 'CONTRIBUTOR', contributorApprovalBasis: null },
  aiFlags: [{ id: 'f1', provider: 'rules', model: 'v1', reasonCodes: ['DAIRY'], riskScore: 0.8, riskLevel: 'HIGH', status: 'OPEN' }],
};

function apiError(code: string, fields?: Record<string, unknown>) {
  return { isAxiosError: true, response: { status: 409, data: { success: false, error: { code, message: 'x', fields } } } };
}

test('queue maps backend enums, counts signals and drops rows without a revision id', () => {
  const page = contentReviewMapper.toQueuePage({ success: true, data: [item, { postId: 'orphan' }], meta: { page: 2, limit: 12, total: 13, totalPages: 2 } });
  assert.equal(page.items.length, 1);
  const first = page.items[0];
  assert.equal(first.type, PostType.RECIPE);
  assert.equal(first.priority, 'HIGH');
  assert.equal(first.isHighPriority, true);
  assert.equal(first.aiFlagCount, 1);
  assert.equal(first.reportCount, 3);
  assert.equal(first.authorRoleLabel, 'Người đóng góp');
  assert.equal(first.canDecide, true);
  assert.deepEqual([page.page, page.totalPages, page.totalItems], [2, 2, 13]);
});

test('members carry no role badge and unknown input never grants decision rights', () => {
  const model = contentReviewMapper.toQueueItem({ ...item, author: { id: 'u2', displayName: 'Huy', role: 'MEMBER' }, canDecide: undefined });
  assert.equal(model.authorRoleLabel, null);
  assert.equal(model.canDecide, false);
});

test('detail separates cover and video media and exposes the existing review note', () => {
  const detail = contentReviewMapper.toDetail({
    success: true,
    data: {
      ...item, body: 'Bước 1: chiên', tags: ['chay'], categories: [{ id: 'c', name: 'Món chính', slug: 'mon-chinh' }],
      media: [{ id: 'm1', kind: 'COVER_IMAGE', secureUrl: 'https://img/x.jpg' }, { id: 'm2', kind: 'VIDEO', secureUrl: 'https://youtu.be/abc' }],
      reviewNote: 'Thiếu định lượng', reviewedBy: { id: 'a', displayName: 'Admin', role: 'ADMIN' }, reviewedAt: '2026-10-26T04:00:00.000Z', isPublishedRevision: false,
    },
  });
  assert.equal(detail.coverUrl, 'https://img/x.jpg');
  assert.equal(detail.videoUrl, 'https://youtu.be/abc');
  assert.deepEqual(detail.categories, ['Món chính']);
  assert.equal(detail.reviewerName, 'Admin');
  assert.equal(detail.aiFlags[0].isOpen, true);
});

test('decision payload trims the reason and keeps the backend enum', () => {
  assert.deepEqual(contentReviewMapper.toDecisionDto('REJECT', '  Thiếu định lượng nguyên liệu  '), { decision: 'REJECT', reason: 'Thiếu định lượng nguyên liệu' });
});

test('business error codes map to Vietnamese guidance', () => {
  assert.match(getContentReviewErrorMessage(apiError('SELF_APPROVAL_FORBIDDEN')), /tự duyệt/);
  assert.match(getContentReviewErrorMessage(apiError('ADMIN_REVIEW_REQUIRED')), /Quản trị viên/);
  assert.match(getContentReviewErrorMessage(apiError('REVIEW_ALREADY_DECIDED')), /xử lý trước đó/);
  assert.match(getContentReviewErrorMessage(apiError('VALIDATION_ERROR', { reason: 'Too small: expected string to have >=10 characters' }), 'REJECT'), /từ chối phải có ít nhất 10/);
  assert.equal(localizeReviewReasonError('', 'APPROVE'), 'Lý do duyệt phải có ít nhất 10 ký tự.');
});
