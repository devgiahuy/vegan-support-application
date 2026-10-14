import { describe, expect, it } from 'vitest';
import { chatMapper, extractDeltaText, parseSseEvent } from './chat.mapper';
import type { ChatMessageListResponseDto, ChatSessionListResponseDto } from '../types/chat.dto';
import { ChatMessageStatus, ChatOwnerType, ChatRole, FeedbackValue } from '@/common/enums';

describe('ChatMapper sessions', () => {
  it('map phiên guest + hết hạn', () => {
    const session = chatMapper.toSingleSession({
      success: true,
      data: {
        id: 's1',
        title: '',
        ownerType: 'GUEST',
        expiresAt: '2020-01-01T00:00:00.000Z',
      },
      meta: null,
    });
    expect(session.title).toBe('Đoạn chat mới');
    expect(session.ownerType).toBe(ChatOwnerType.GUEST);
    expect(session.ownerTypeLabel).toBe('Khách');
    expect(session.isExpired).toBe(true);
  });

  it('envelope null → defaults an toàn', () => {
    const session = chatMapper.toSingleSession(null);
    expect(session.id).toBe('');
    expect(session.ownerType).toBe(ChatOwnerType.AUTHENTICATED);
    expect(session.isExpired).toBe(false);
  });

  it('toSessionList chuẩn hóa meta + đọc snake_case', () => {
    const envelope: ChatSessionListResponseDto = {
      success: true,
      data: [{ id: 'a', title: 'Hỏi đạm', owner_type: 'AUTHENTICATED' }, null],
      meta: { page: 1, limit: 20, total: 2, total_pages: 1 },
    };
    const result = chatMapper.toSessionList(envelope);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].ownerTypeLabel).toBe('Cá nhân');
    expect(result.metadata.totalItems).toBe(2);
    expect(result.metadata.hasNextPage).toBe(false);
  });
});

describe('ChatMapper messages', () => {
  it('map tin nhắn assistant kèm feedback + fallback', () => {
    const envelope: ChatMessageListResponseDto = {
      success: true,
      data: [
        {
          id: 'm1',
          sessionId: 's1',
          role: 'ASSISTANT',
          status: 'COMPLETE',
          content: 'Ăn đậu hũ nhé.',
          fallback: true,
          disclaimer: 'Tham khảo.',
          feedback: { value: 'UP' },
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    const result = chatMapper.toMessageList(envelope);
    const message = result.items[0];
    expect(message.role).toBe(ChatRole.ASSISTANT);
    expect(message.roleLabel).toBe('Trợ lý');
    expect(message.isFallback).toBe(true);
    expect(message.feedback).toBe(FeedbackValue.UP);
    expect(message.disclaimer).toBe('Tham khảo.');
  });

  it('feedback không hợp lệ → null, content trim viền giữ khoảng trắng giữa', () => {
    const message = chatMapper.toMessage({
      id: 'm2',
      role: 'USER',
      content: '  đạm   từ đâu?  ',
      feedback: { value: 'WEIRD' },
    });
    expect(message.feedback).toBeNull();
    expect(message.content).toBe('đạm   từ đâu?');
  });

  it('status lạ → COMPLETE, role lạ → USER', () => {
    const message = chatMapper.toMessage({ id: 'm3', role: 'SYSTEM', status: 'GHOST' });
    expect(message.role).toBe(ChatRole.USER);
    expect(message.status).toBe(ChatMessageStatus.COMPLETE);
  });
});

describe('ChatMapper feedback + quota + dto', () => {
  it('toFeedbackModel đọc messageId + value', () => {
    const feedback = chatMapper.toFeedbackModel({
      success: true,
      data: { messageId: 'm1', value: 'DOWN', reason: null },
      meta: null,
    });
    expect(feedback).toMatchObject({ messageId: 'm1', value: 'DOWN', reason: null });
  });

  it('toQuotaState tính remaining + exhausted, fallback khi thiếu', () => {
    expect(chatMapper.toQuotaState({ used: 5, limit: 5 })).toMatchObject({
      remaining: 0,
      exhausted: true,
    });
    const fallback = chatMapper.toQuotaState({});
    expect(fallback).toMatchObject({ used: 0, limit: 5, remaining: 5, exhausted: false });
    expect(fallback.resetAtLabel).toBe('nửa đêm');
    // Shape thật live: resetAt ISO → label giờ Việt, không hiện ISO thô.
    const live = chatMapper.toQuotaState({
      limit: 20,
      used: 2,
      remaining: 18,
      resetAt: '2026-09-17T17:00:00.000Z',
    });
    expect(live.remaining).toBe(18);
    expect(live.resetAtLabel).not.toContain('T17:00');
  });

  it('toSendDto/toFeedbackDto chỉ gửi field BE cho phép', () => {
    expect(chatMapper.toSendDto({ sessionId: 's', content: 'hi', idempotencyKey: 'k' })).toEqual({
      content: 'hi',
      idempotencyKey: 'k',
    });
    expect(chatMapper.toFeedbackDto(FeedbackValue.UP)).toEqual({ value: 'UP' });
  });
});

describe('parseSseEvent', () => {
  it('parse content_delta chuẩn + alias delta/text', () => {
    const event = parseSseEvent('event: content_delta\ndata: {"content": "Xin chào"}');
    expect(event.type).toBe('content_delta');
    expect(extractDeltaText(event.payload)).toBe('Xin chào');
    expect(extractDeltaText({ delta: 'a' })).toBe('a');
    expect(extractDeltaText({ text: 'b' })).toBe('b');
  });

  it('parse message_complete + quota + error', () => {
    expect(parseSseEvent('event: message_complete\ndata: {"messageId": "m1"}').type).toBe(
      'message_complete'
    );
    const quota = parseSseEvent('event: quota\ndata: {"used": 3, "limit": 20}');
    expect(quota.type).toBe('quota');
    expect(chatMapper.toQuotaState(quota.payload, 20).remaining).toBe(17);
    const error = parseSseEvent('event: error\ndata: {"code": "AI_QUOTA_EXCEEDED"}');
    expect(error.type).toBe('error');
    expect(error.payload['code']).toBe('AI_QUOTA_EXCEEDED');
  });

  it('event lạ và JSON lỗi không throw', () => {
    expect(parseSseEvent('event: mystery\ndata: {}').type).toBe('unknown');
    expect(parseSseEvent('event: content_delta\ndata: {oops').payload).toEqual({});
    expect(parseSseEvent('').type).toBe('unknown');
  });
});
