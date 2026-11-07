import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { FeedbackValue } from '@/common/enums';
import { chatApi } from './chat.api';

describe('chat API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps session and message lists with their metadata', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({
        data: { data: [{ id: 's1' }], meta: { page: 2, total: 4, totalPages: 2 } },
      })
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 'm1', content: 'Xin chào' }],
          meta: { page: 1, total: 1, totalPages: 1 },
        },
      });
    const sessions = await chatApi.getSessions({ page: 2 });
    expect(sessions.items[0].id).toBe('s1');
    expect(sessions.metadata).toMatchObject({ page: 2, totalItems: 4 });
    expect((await chatApi.getMessages('s1')).items[0].content).toBe('Xin chào');
  });

  it('maps session creation and feedback', async () => {
    vi.spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { data: { id: 's1' } } })
      .mockResolvedValueOnce({ data: { data: { messageId: 'm1', value: 'UP' } } });
    expect((await chatApi.createSession()).id).toBe('s1');
    await expect(chatApi.sendFeedback('m1', FeedbackValue.UP)).resolves.toMatchObject({
      messageId: 'm1',
      value: 'UP',
    });
  });
});
