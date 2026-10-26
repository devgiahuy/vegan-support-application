import { describe, it, expect } from 'vitest';
import { reviewDecisionSchema, adminContentReviewDecisionSchema } from './review-decision.schema';
import { ReviewDecisionEnum } from '../types/content-review.model';

describe('reviewDecisionSchema', () => {
  it('allows empty reason string (does not block min 10 characters)', () => {
    const emptyResult = reviewDecisionSchema.safeParse({ reason: '' });
    expect(emptyResult.success).toBe(true);
    if (emptyResult.success) {
      expect(emptyResult.data.reason).toBe('');
    }
  });

  it('allows short reason with fewer than 10 characters', () => {
    const result = reviewDecisionSchema.safeParse({ reason: 'Duyệt bài' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe('Duyệt bài');
    }
  });

  it('accepts long valid reason up to 1000 characters', () => {
    const reasonText = 'Nội dung đạt chuẩn thuần chay, hình ảnh rõ nét.'.repeat(10);
    const result = reviewDecisionSchema.safeParse({ reason: reasonText });
    expect(result.success).toBe(true);
  });

  it('rejects reason exceeding 1000 characters', () => {
    const tooLong = 'a'.repeat(1001);
    const result = reviewDecisionSchema.safeParse({ reason: tooLong });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('không được vượt quá 1000 ký tự');
    }
  });
});

describe('adminContentReviewDecisionSchema', () => {
  it('allows approval decision with short reason', () => {
    const result = adminContentReviewDecisionSchema.safeParse({
      decision: ReviewDecisionEnum.APPROVE,
      reason: 'Hợp lệ',
    });
    expect(result.success).toBe(true);
  });

  it('allows rejection decision with short reason', () => {
    const result = adminContentReviewDecisionSchema.safeParse({
      decision: ReviewDecisionEnum.REJECT,
      reason: 'Ảnh mờ',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid decision enum', () => {
    const result = adminContentReviewDecisionSchema.safeParse({
      decision: 'INVALID_DECISION',
      reason: 'Lý do kiểm duyệt',
    });
    expect(result.success).toBe(false);
  });
});
