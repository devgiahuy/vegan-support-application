import type { PaginationResult } from '@/types/api';
import type { PublicAnswerDto, SharedAnswerDto } from '../types/chat-sharing.dto';
import type {
  AnswerVerification,
  PublicAnswer,
  PublicAnswerQueryParams,
  SharedAnswer,
} from '../types/chat-sharing.model';
import { chatSharingMapper } from '../mappers/chat-sharing.mapper';
import {
  publicListFixture,
  sharedOpenFixture,
  sharedRevokedFixture,
  verifiedFixture,
} from '../__fixtures__/sharing-fixtures';

/**
 * API chia sẻ/kiểm chứng chat — PHASE SCAFFOLD: đọc fixture, 0 request mạng.
 * Backend còn `PLANNED` (không có schema swagger) nên 3 hàm dưới MÔ PHỎNG
 * đúng signature dự kiến live.
 *
 * Ngày nối live (TODO(BE-READY)): reconfirm shape 3 endpoint với swagger thật,
 * sửa mapper nếu lệch, thay thân hàm bằng axios qua `API_ENDPOINTS.CHAT_SHARING`,
 * giữ nguyên chữ ký + kiểu trả về — queries/components KHÔNG đổi.
 * Đồng thời chuyển `__fixtures__` sang test-only hoặc xóa khỏi bundle.
 */
export const USE_FIXTURES = true;

const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Trạng thái chia sẻ trong bộ nhớ (revoke đổi trạng thái, share lại sinh shareId mới).
const shareStates = new Map<string, { shared: boolean; shareId: string }>([
  ['msg-1', { shared: true, shareId: 'share-1' }],
]);
let publicStore: (PublicAnswerDto | null)[] = clone(publicListFixture.data ?? []);

export function __resetSharingFixtures(): void {
  shareStates.clear();
  shareStates.set('msg-1', { shared: true, shareId: 'share-1' });
  publicStore = clone(publicListFixture.data ?? []);
}

export const chatSharingApi = {
  /** `PATCH /chat/messages/:id/share` (fixture). Revoke rồi share lại sinh shareId mới. */
  setShared: async (messageId: string, shared: boolean): Promise<SharedAnswer> => {
    await delay();
    const current = shareStates.get(messageId);
    if (!shared) {
      shareStates.set(messageId, { shared: false, shareId: current?.shareId ?? '' });
      return chatSharingMapper.toSharedAnswer({
        ...clone(sharedRevokedFixture),
        data: { ...(sharedRevokedFixture.data ?? {}), messageId },
      });
    }
    const shareId = current?.shared ? current.shareId : `share-${Date.now().toString(36)}`;
    shareStates.set(messageId, { shared: true, shareId });
    return chatSharingMapper.toSharedAnswer({
      ...clone(sharedOpenFixture),
      data: { ...(sharedOpenFixture.data ?? {}), messageId, shareId },
    });
  },

  /** `GET /chat/public` (fixture, tìm kiếm client). */
  getPublicAnswers: async (
    params?: PublicAnswerQueryParams
  ): Promise<PaginationResult<PublicAnswer>> => {
    await delay();
    const query = (params?.q ?? '').trim().toLowerCase();
    const source = clone(publicStore).filter((item) => {
      if (!query) return true;
      const haystack = `${item?.question ?? ''} ${item?.answer ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
    return chatSharingMapper.toPublicList({
      success: true,
      data: source,
      meta: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        total: source.length,
        totalPages: 1,
      },
    });
  },

  /** Xem 1 mục công khai theo shareId (fixture, lọc client). */
  getPublicAnswer: async (shareId: string): Promise<PublicAnswer | null> => {
    await delay();
    const found = clone(publicStore).find((item) => item?.shareId === shareId) ?? null;
    if (!found) return null;
    return chatSharingMapper.toPublicAnswer(found);
  },

  /** `POST /chat/messages/:id/verification` (fixture). */
  verifyAnswer: async (messageId: string, note: string): Promise<AnswerVerification | null> => {
    await delay();
    return chatSharingMapper.toVerificationModel(verifiedFixture(messageId, note));
  },
};
