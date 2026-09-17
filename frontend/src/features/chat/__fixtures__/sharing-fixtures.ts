import type {
  PublicAnswerListResponseDto,
  ShareAnswerResponseDto,
  VerifyAnswerResponseDto,
} from '../types/chat-sharing.dto';

/** Fixture chia sẻ/kiểm chứng (phase scaffold — BE còn `PLANNED`, DTO suy luận). */
export const sharedOpenFixture: ShareAnswerResponseDto = {
  success: true,
  data: {
    messageId: 'msg-1',
    shareId: 'share-1',
    shared: true,
    sharedAt: '2026-09-17T10:00:00.000Z',
  },
  meta: null,
};

export const sharedRevokedFixture: ShareAnswerResponseDto = {
  success: true,
  data: { messageId: 'msg-1', shareId: 'share-1', shared: false, sharedAt: null },
  meta: null,
};

export const publicListFixture: PublicAnswerListResponseDto = {
  success: true,
  data: [
    {
      shareId: 'share-1',
      messageId: 'msg-1',
      question: 'Người mới ăn chay cần bổ sung đạm từ đâu?',
      answer: 'Đậu hũ, đậu lăng, đậu gà và quinoa là nguồn đạm tốt...',
      disclaimer: 'Thông tin chỉ mang tính tham khảo.',
      authorLabel: 'Thành viên cộng đồng',
      sharedAt: '2026-09-17T10:00:00.000Z',
      verification: {
        verifierName: 'BS. Lan Anh',
        verifierRole: 'NUTRITION_EXPERT',
        note: 'Nội dung chính xác.',
        verifiedAt: '2026-09-17T11:00:00.000Z',
      },
    },
    {
      shareId: 'share-2',
      messageId: 'msg-2',
      question: 'Ăn chay có thiếu B12 không?',
      answer: 'Có thể thiếu, nên xét nghiệm và bổ sung theo chỉ định...',
      disclaimer: 'Thông tin chỉ mang tính tham khảo.',
      sharedAt: '2026-09-16T10:00:00.000Z',
      verification: null,
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export function verifiedFixture(messageId: string, note: string): VerifyAnswerResponseDto {
  return {
    success: true,
    data: {
      messageId,
      verifierName: 'Quản trị viên Demo',
      verifierRole: 'ADMIN',
      note,
      verifiedAt: new Date().toISOString(),
    },
    meta: null,
  };
}
