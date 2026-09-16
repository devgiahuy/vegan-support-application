import { describe, it, expect } from 'vitest';
import { shouldFallbackToFixtures, createNotFoundError } from './api-fallback';

function axiosErrorWithStatus(status?: number): unknown {
  return {
    isAxiosError: true,
    request: {},
    response: status === undefined ? undefined : { status, data: {} },
  };
}

function networkError(): unknown {
  return { isAxiosError: true, request: {}, response: undefined };
}

describe('shouldFallbackToFixtures', () => {
  it('falls back on network errors (backend chưa chạy / mất mạng)', () => {
    expect(shouldFallbackToFixtures(networkError(), 'list')).toBe(true);
    expect(shouldFallbackToFixtures(networkError(), 'detail')).toBe(true);
    expect(shouldFallbackToFixtures(networkError(), 'mutation')).toBe(true);
  });

  it('falls back on 404 list (route chưa tồn tại khi endpoint PLANNED)', () => {
    expect(shouldFallbackToFixtures(axiosErrorWithStatus(404), 'list')).toBe(true);
  });

  it('never falls back on detail 404 (trang [id] phải hiện 404 thật)', () => {
    expect(shouldFallbackToFixtures(axiosErrorWithStatus(404), 'detail')).toBe(false);
  });

  it('rethrows business 4xx (validation, quyền...) để UI hiện lỗi thật', () => {
    for (const status of [400, 401, 403, 422]) {
      expect(shouldFallbackToFixtures(axiosErrorWithStatus(status), 'list')).toBe(false);
      expect(shouldFallbackToFixtures(axiosErrorWithStatus(status), 'detail')).toBe(false);
      expect(shouldFallbackToFixtures(axiosErrorWithStatus(status), 'mutation')).toBe(false);
    }
  });

  it('falls back on 5xx để UI demo không sập', () => {
    expect(shouldFallbackToFixtures(axiosErrorWithStatus(500), 'list')).toBe(true);
    expect(shouldFallbackToFixtures(axiosErrorWithStatus(500), 'detail')).toBe(true);
  });
});

describe('createNotFoundError', () => {
  it('creates a 404 NOT_FOUND error with Vietnamese label', () => {
    const err = createNotFoundError({ resourceLabel: 'Công thức' }) as Error & {
      status?: number;
      code?: string;
    };
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toContain('Công thức');
  });
});
