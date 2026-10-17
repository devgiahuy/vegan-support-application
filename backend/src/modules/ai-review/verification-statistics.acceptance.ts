import assert from 'node:assert/strict';
import { AiVerificationStatus } from '@prisma/client';
import { effectiveVerificationStatistics } from './ai-review.service.js';

const ownerId = 'owner';
const active = (reviewerId: string) => ({
  status: AiVerificationStatus.ACTIVE,
  artifactVersion: 3,
  reviewerId,
});

const five = ['reviewer-1', 'reviewer-2', 'reviewer-3', 'reviewer-4', 'reviewer-5'].map(active);
assert.deepEqual(effectiveVerificationStatistics(3, ownerId, five), {
  verificationCount: 5,
  verifiedByUserCount: 5,
});

const historyWithDuplicateReviewer = [
  ...five,
  { ...active('reviewer-1'), status: AiVerificationStatus.SUPERSEDED },
  { ...active('reviewer-1'), status: AiVerificationStatus.REVOKED },
  { ...active('reviewer-1'), artifactVersion: 2 },
  active(ownerId),
];
const statistics = effectiveVerificationStatistics(3, ownerId, historyWithDuplicateReviewer);
assert.deepEqual(statistics, { verificationCount: 5, verifiedByUserCount: 5 });
assert.deepEqual(Object.keys(statistics).sort(), ['verificationCount', 'verifiedByUserCount']);
assert(!JSON.stringify(statistics).includes('reviewer-1'), 'statistics must not expose reviewer IDs');

console.info(
  'Verification statistics acceptance passed: five distinct effective reviewers, no duplicate/revoked/superseded/stale/self counts, and no reviewer IDs.',
);
