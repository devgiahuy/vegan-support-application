import { describe, it, expect } from 'vitest';
import { localizeReviewReasonError } from './review-error';

describe('localizeReviewReasonError', () => {
  it('translates Zod min 10 characters error for approve', () => {
    const raw = 'Too small: expected string to have >=10 characters';
    expect(localizeReviewReasonError(raw, true)).toBe('Lý do duyệt phải có ít nhất 10 ký tự.');
  });

  it('translates Zod min 10 characters error for reject', () => {
    const raw = 'Too small: expected string to have >=10 characters';
    expect(localizeReviewReasonError(raw, false)).toBe('Lý do từ chối phải có ít nhất 10 ký tự.');
  });

  it('translates alternate Zod min format "String must contain at least 10 character(s)"', () => {
    const raw = 'String must contain at least 10 character(s)';
    expect(localizeReviewReasonError(raw, true)).toBe('Lý do duyệt phải có ít nhất 10 ký tự.');
  });

  it('translates Zod max 2000 characters error', () => {
    const raw = 'Too big: expected string to have <=2000 characters';
    expect(localizeReviewReasonError(raw, true)).toBe('Lý do không được vượt quá 2000 ký tự.');
  });

  it('translates required / null / undefined error', () => {
    const raw = 'Invalid input: expected string, received null';
    expect(localizeReviewReasonError(raw, true)).toBe(
      'Vui lòng nhập lý do duyệt (tối thiểu 10 ký tự).'
    );
    expect(localizeReviewReasonError(raw, false)).toBe(
      'Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự).'
    );
  });

  it('preserves clean Vietnamese text if already provided', () => {
    const raw = 'Lý do chưa đủ thông tin cần thiết';
    expect(localizeReviewReasonError(raw, true)).toBe('Lý do chưa đủ thông tin cần thiết');
  });

  it('provides safe fallback for unknown english errors', () => {
    const raw = 'invalid value';
    expect(localizeReviewReasonError(raw, true)).toBe('Lý do duyệt phải có ít nhất 10 ký tự.');
    expect(localizeReviewReasonError(raw, false)).toBe('Lý do từ chối phải có ít nhất 10 ký tự.');
  });
});
