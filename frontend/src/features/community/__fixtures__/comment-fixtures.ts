import type {
  CommunityCommentListResponseDto,
  CommunityCommentResponseDto,
} from '../types/community.dto';

/**
 * Fixture thread bình luận (phase scaffold — BE community còn `PLANNED`).
 * Bám từng field `docs/api/community.md`. Ngày nối live: chuyển test-only/xóa.
 */
export const commentThreadFixture: CommunityCommentListResponseDto = {
  success: true,
  data: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      postId: '22222222-2222-4222-8222-222222222222',
      parentId: null,
      content: 'Món này mình nấu cho cả nhà, bé 3 tuổi cũng ăn được. Cảm ơn tác giả!',
      status: 'VISIBLE',
      isPlaceholder: false,
      author: { id: 'u1', displayName: 'An Chay', avatarUrl: null },
      editedAt: null,
      createdAt: '2026-09-15T08:00:00.000Z',
      replies: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          postId: '22222222-2222-4222-8222-222222222222',
          parentId: '11111111-1111-4111-8111-111111111111',
          content: 'Bạn thay nước mắm bằng xì dầu nhạt thì bé dễ ăn hơn nữa.',
          status: 'VISIBLE',
          isPlaceholder: false,
          author: { id: 'u2', displayName: 'Bếp Xanh', avatarUrl: null },
          editedAt: '2026-09-15T09:00:00.000Z',
          createdAt: '2026-09-15T08:30:00.000Z',
          replies: [],
        },
      ],
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      postId: '22222222-2222-4222-8222-222222222222',
      parentId: null,
      content: null,
      status: 'HIDDEN',
      isPlaceholder: true,
      author: null,
      editedAt: null,
      createdAt: '2026-09-14T10:00:00.000Z',
      replies: [],
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export const emptyThreadFixture: CommunityCommentListResponseDto = {
  success: true,
  data: [],
  meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

export function createdCommentFixture(
  content: string,
  parentId: string | null
): CommunityCommentResponseDto {
  return {
    success: true,
    data: {
      id: '55555555-5555-4555-8555-555555555555',
      postId: '22222222-2222-4222-8222-222222222222',
      parentId,
      content,
      status: 'VISIBLE',
      isPlaceholder: false,
      author: { id: 'me', displayName: 'Bạn', avatarUrl: null },
      editedAt: null,
      createdAt: new Date().toISOString(),
      replies: [],
    },
    meta: null,
  };
}
