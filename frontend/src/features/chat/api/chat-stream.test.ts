import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamChatMessage } from './chat-stream';

const auth = vi.hoisted(() => ({ token: null as string | null, user: null as unknown }));
const refresh = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth-token', () => ({ getAccessToken: () => auth.token }));
vi.mock('@/lib/auth-refresh', () => ({ sharedRefresh: refresh }));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: { getState: () => ({ token: auth.token, user: auth.user }) },
}));

function sse(body: string): Response {
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  auth.token = null;
  auth.user = null;
});

describe('chat stream authentication and completion', () => {
  it('sends the access token and handles quota after completion', async () => {
    auth.token = 'access';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sse(
          'event: content_delta\ndata: {"delta":"Chào bạn"}\n\n' +
            'event: message_complete\ndata: {}\n\n' +
            'event: quota\ndata: {"used":1,"limit":5}\n\n'
        )
      );
    vi.stubGlobal('fetch', fetchMock);
    const onQuota = vi.fn();
    const result = await streamChatMessage(
      'session',
      'Xin chào',
      'key',
      new AbortController().signal,
      { onQuota }
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer access');
    expect(result).toMatchObject({ completed: true, content: 'Chào bạn' });
    expect(onQuota).toHaveBeenCalledOnce();
  });

  it('refreshes once on an authenticated 401 and retries the same request', async () => {
    auth.token = 'expired';
    refresh.mockResolvedValue('new-token');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(sse('event: message_complete\ndata: {}\n\n'));
    vi.stubGlobal('fetch', fetchMock);
    const result = await streamChatMessage(
      'session',
      'Xin chào',
      'key',
      new AbortController().signal
    );
    expect(result.completed).toBe(true);
    expect(refresh).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer new-token');
    expect(fetchMock.mock.calls[1][1].body).toBe(fetchMock.mock.calls[0][1].body);
  });

  it('does not refresh a guest and reports an interrupted stream', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(sse('event: content_delta\ndata: {"delta":"partial"}\n\n'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      streamChatMessage('session', 'Xin chào', 'key', new AbortController().signal)
    ).rejects.toThrow();
    expect(refresh).not.toHaveBeenCalled();
    await expect(
      streamChatMessage('session', 'Xin chào', 'key', new AbortController().signal)
    ).rejects.toThrow('trước khi hoàn tất');
  });
});
