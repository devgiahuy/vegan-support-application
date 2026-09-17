import { describe, expect, it } from 'vitest';
import { chatSharingMapper } from './chat-sharing.mapper';
import type { PublicAnswerListResponseDto } from '../types/chat-sharing.dto';

describe('ChatSharingMapper share', () => {
  it('map share đang mở + ghép shareUrl', () => {
    const shared = chatSharingMapper.toSharedAnswer({
      success: true,
      data: { messageId: 'm1', shareId: 'sh-1', shared: true },
      meta: null,
    });
    expect(shared.shareId).toBe('sh-1');
    expect(shared.shareUrl).toBe('/assistant/public?share=sh-1');
    expect(shared.shared).toBe(true);
  });

  it('revoke shared=false + shareId rỗng → url rỗng', () => {
    const shared = chatSharingMapper.toSharedAnswer({
      success: true,
      data: { message_id: 'm1', shared: false },
      meta: null,
    });
    expect(shared.shared).toBe(false);
    expect(shared.shareUrl).toBe('');
  });

  it('envelope null → defaults an toàn', () => {
    const shared = chatSharingMapper.toSharedAnswer(null);
    expect(shared).toMatchObject({ messageId: '', shareId: '', shared: false });
  });
});

describe('ChatSharingMapper public', () => {
  it('map mục công khai + verify + ẩn danh', () => {
    const envelope: PublicAnswerListResponseDto = {
      success: true,
      data: [
        {
          shareId: 'sh-1',
          question: 'Ăn chay thiếu đạm không?',
          answer: 'Không nếu đủ đậu.',
          disclaimer: 'Tham khảo.',
          verification: { verifierRole: 'NUTRITION_EXPERT', note: 'Chuẩn.' },
        },
        { share_id: 'sh-2', question: 'Q2', content: 'A2' },
        null,
      ],
      meta: { page: 1, limit: 10, total: 2, total_pages: 1 },
    };
    const result = chatSharingMapper.toPublicList(envelope);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].verification?.verifierRoleLabel).toBe('Chuyên gia dinh dưỡng');
    expect(result.items[0].authorLabel).toBe('Thành viên cộng đồng');
    expect(result.items[1].answer).toBe('A2');
    expect(result.metadata.totalItems).toBe(2);
  });

  it('role lạ giữ nguyên văn, thiếu verification → null', () => {
    const result = chatSharingMapper.toPublicList({
      success: true,
      data: [{ shareId: 's', verification: { verifierRole: 'MYSTERY' } }],
      meta: null,
    });
    expect(result.items[0].verification?.verifierRoleLabel).toBe('MYSTERY');
  });

  it('envelope null → list rỗng', () => {
    const result = chatSharingMapper.toPublicList(null);
    expect(result.items).toEqual([]);
  });
});

describe('ChatSharingMapper verification', () => {
  it('map kiểm chứng đủ field', () => {
    const verification = chatSharingMapper.toVerificationModel({
      success: true,
      data: { messageId: 'm1', verifierName: 'BS. Lan', verifierRole: 'ADMIN', note: 'OK' },
      meta: null,
    });
    expect(verification).toMatchObject({
      messageId: 'm1',
      verifierName: 'BS. Lan',
      verifierRoleLabel: 'Quản trị viên',
      note: 'OK',
    });
  });

  it('data null → null, note rỗng → null', () => {
    expect(chatSharingMapper.toVerificationModel(null)).toBeNull();
    const verification = chatSharingMapper.toVerificationModel({
      success: true,
      data: { messageId: 'm', note: '   ' },
      meta: null,
    });
    expect(verification?.note).toBeNull();
    expect(verification?.verifierName).toBe('Chuyên gia');
  });

  it('toVerification inline của public item', () => {
    expect(chatSharingMapper.toVerification(null, 'm')).toBeNull();
    expect(chatSharingMapper.toVerification('x' as unknown as null, 'm')).toBeNull();
  });

  it('toVerifyDto chỉ gửi note', () => {
    expect(chatSharingMapper.toVerifyDto('Chuẩn')).toEqual({ note: 'Chuẩn' });
  });

  it('shareUrl theo đúng route public', () => {
    const shared = chatSharingMapper.toSharedAnswer({
      success: true,
      data: { share_id: 'abc' },
      meta: null,
    });
    expect(shared.shareUrl).toBe('/assistant/public?share=abc');
  });

  it('question/answer rỗng → chuỗi rỗng (UI xử lý empty)', () => {
    const result = chatSharingMapper.toPublicList({
      success: true,
      data: [{ shareId: 's' }],
      meta: null,
    });
    expect(result.items[0].question).toBe('');
    expect(result.items[0].disclaimer).toBeNull();
  });
});
