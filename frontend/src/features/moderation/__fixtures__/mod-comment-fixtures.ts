import type {
  AdminModerationCommentListResponseDto,
  AdminModerationCommentResponseDto,
} from '../types/moderation.dto';

/** Fixture kiểm duyệt bình luận (phase scaffold). */
export const moderationCommentsFixture: AdminModerationCommentListResponseDto = {
  success: true,
  data: [
    {
      id: 'cmt-1',
      postId: 'post-1',
      postTitle: 'Bún bò Huế chay',
      parentId: null,
      content: 'Nội dung công kích, cần ẩn.',
      status: 'VISIBLE',
      author: { id: 'u-violator', displayName: 'Spam Bot' },
      hiddenReason: null,
      hiddenById: null,
      deletedAt: null,
      createdAt: '2026-09-15T09:00:00.000Z',
    },
    {
      id: 'cmt-2',
      postId: 'post-2',
      content: null,
      status: 'DELETED',
      author: null,
      deletedAt: '2026-09-15T10:00:00.000Z',
      createdAt: '2026-09-14T10:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export function updatedModCommentFixture(
  id: string,
  status: 'VISIBLE' | 'HIDDEN'
): AdminModerationCommentResponseDto {
  return {
    success: true,
    data: { id, status, updatedAt: new Date().toISOString() },
    meta: null,
  };
}
