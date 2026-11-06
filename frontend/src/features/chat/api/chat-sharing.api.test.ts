import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetSharingFixtures, chatSharingApi } from './chat-sharing.api';

describe('chat sharing fixture response mapping', () => {
  afterEach(() => {
    __resetSharingFixtures();
    vi.useRealTimers();
  });

  it('maps fixture items and pagination metadata', async () => {
    vi.useFakeTimers();
    const pending = chatSharingApi.getPublicAnswers({ page: 2, limit: 10 });
    await vi.advanceTimersByTimeAsync(300);
    const result = await pending;
    expect(result.items[0].shareId).toBe('share-1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 2 });
  });

  it('maps the revoked sharing state', async () => {
    vi.useFakeTimers();
    const pending = chatSharingApi.setShared('msg-1', false);
    await vi.advanceTimersByTimeAsync(300);
    await expect(pending).resolves.toMatchObject({ messageId: 'msg-1', shared: false });
  });
});
