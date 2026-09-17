import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  PublicAnswerDto,
  PublicAnswerListResponseDto,
  SharedAnswerDto,
  ShareAnswerResponseDto,
  VerifyAnswerRequestDto,
  VerifyAnswerResponseDto,
} from '../types/chat-sharing.dto';
import type { AnswerVerification, PublicAnswer, SharedAnswer } from '../types/chat-sharing.model';

const VERIFIER_ROLE_LABELS: Record<string, string> = {
  NUTRITION_EXPERT: 'Chuyên gia dinh dưỡng',
  ADMIN: 'Quản trị viên',
};

function emptyPageMeta() {
  return { page: 1, limit: 10, totalItems: 0, totalPages: 0 };
}

/**
 * ChatSharingMapper: share/revoke, public list, verification.
 * DTO SUY LUẬN (không schema swagger) — mọi field optional + fallback.
 * Envelope `{success, data, meta}` đọc trực tiếp.
 */
export class ChatSharingMapper extends BaseMapper<SharedAnswerDto, SharedAnswer> {
  toModel(dto: SharedAnswerDto | null | undefined): SharedAnswer {
    const shareId = safeString(pickField(dto, ['shareId', 'share_id'], ''));
    return {
      messageId: safeString(pickField(dto, ['messageId', 'message_id'], '')),
      shareId,
      shareUrl: shareId.length > 0 ? `/assistant/public?share=${shareId}` : '',
      shared: pickField<boolean>(dto, ['shared'], false),
      sharedAt: safeDate(pickField(dto, ['sharedAt', 'shared_at'], null)),
    };
  }

  /** `PATCH /chat/messages/:id/share` → trạng thái chia sẻ. */
  toSharedAnswer(dto: ShareAnswerResponseDto | null | undefined): SharedAnswer {
    const data = pickField(dto, ['data'], null) as SharedAnswerDto | null;
    return this.toModel(data);
  }

  toVerification(
    dto: PublicAnswerDto['verification'] | null | undefined,
    messageId: string
  ): AnswerVerification | null {
    if (!dto || typeof dto !== 'object') return null;
    const role = safeString(pickField(dto, ['verifierRole', 'verifier_role'], ''));
    return {
      messageId,
      verifierName: safeString(pickField(dto, ['verifierName', 'verifier_name'], ''), 'Chuyên gia'),
      verifierRole: role,
      verifierRoleLabel: VERIFIER_ROLE_LABELS[role.toUpperCase()] ?? role,
      note: safeString(pickField(dto, ['note'], '')) || null,
      verifiedAt: safeDate(pickField(dto, ['verifiedAt', 'verified_at'], null)),
    };
  }

  toPublicAnswer(dto: PublicAnswerDto | null | undefined): PublicAnswer {
    const messageId = safeString(pickField(dto, ['messageId'], ''));
    return {
      shareId: safeString(pickField(dto, ['shareId', 'share_id'], '')),
      messageId: safeString(pickField(dto, ['messageId', 'message_id'], '')),
      question: safeString(pickField(dto, ['question'], '')),
      answer: safeString(pickField(dto, ['answer', 'content'], '')),
      disclaimer: safeString(pickField(dto, ['disclaimer'], '')) || null,
      authorLabel:
        safeString(pickField(dto, ['authorLabel', 'author_label'], '')) || 'Thành viên cộng đồng',
      sharedAt: safeDate(pickField(dto, ['sharedAt'], null)),
      verification: this.toVerification(
        pickField(dto, ['verification'], null) as PublicAnswerDto['verification'],
        messageId
      ),
    };
  }

  /** `GET /chat/public` → mảng mục + meta. */
  toPublicList(
    dto: PublicAnswerListResponseDto | null | undefined
  ): PaginationResult<PublicAnswer> {
    const rawItems = pickField(dto, ['data'], null) as (PublicAnswerDto | null)[] | null;
    const items = safeArray<PublicAnswerDto | null, PublicAnswer>(rawItems, (item) =>
      this.toPublicAnswer(item)
    ).filter((item) => item.shareId.length > 0);
    const meta = pickField(dto, ['meta'], null) as PublicAnswerListResponseDto['meta'];
    const page = safeNumber(pickField(meta, ['page'], 1));
    const limit = safeNumber(pickField(meta, ['limit'], 10));
    const totalItems = safeNumber(pickField(meta, ['total'], items.length));
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
    return {
      items,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /** `POST /chat/messages/:id/verification` → kiểm chứng. */
  toVerificationModel(dto: VerifyAnswerResponseDto | null | undefined): AnswerVerification | null {
    const data = pickField(dto, ['data'], null) as VerifyAnswerResponseDto['data'];
    if (!data || typeof data !== 'object') return null;
    const role = safeString(pickField(data, ['verifierRole'], ''));
    return {
      messageId: safeString(pickField(data, ['messageId'], '')),
      verifierName: safeString(pickField(data, ['verifierName'], '')) || 'Chuyên gia',
      verifierRole: role,
      verifierRoleLabel: VERIFIER_ROLE_LABELS[role.toUpperCase()] ?? role,
      note: safeString(pickField(data, ['note'], '')) || null,
      verifiedAt: safeDate(pickField(data, ['verifiedAt'], null)),
    };
  }

  toVerifyDto(note: string): VerifyAnswerRequestDto {
    return { note };
  }
}

export const chatSharingMapper = new ChatSharingMapper();
