import { describe, expect, it } from 'vitest';
import { communityMapper } from './community.mapper';
import type {
  CommunityBookmarkListResponseDto,
  CommunityCommentListResponseDto,
  CommunitySummaryResponseDto,
} from '../types/community.dto';
import { CommentStatus } from '@/common/enums';

const threadEnvelope: CommunityCommentListResponseDto = {
  success: true,
  data: [
    {
      id: 'c1',
      postId: 'p1',
      parentId: null,
      content: 'Món này ngon!',
      status: 'VISIBLE',
      isPlaceholder: false,
      author: { id: 'u1', displayName: 'An Chay', avatarUrl: null },
      editedAt: null,
      createdAt: '2026-09-16T10:00:00.000Z',
      replies: [
        {
          id: 'c2',
          postId: 'p1',
          parent_id: 'c1',
          content: 'Đồng ý!',
          status: 'VISIBLE',
          author: null,
          replies: [{ id: 'c-evil', content: 'tầng 3' }],
        },
        null,
      ],
    },
    { id: 'c3', post_id: 'p1', content: null, status: 'HIDDEN', isPlaceholder: true },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

describe('CommunityMapper comments', () => {
  it('map thread: root + reply 1 tầng, author null → ẩn danh', () => {
    const result = communityMapper.toThreadModel(threadEnvelope);
    expect(result.items).toHaveLength(2);
    const root = result.items[0];
    expect(root.author?.displayName).toBe('An Chay');
    // null trong replies bị loại qua toModel defaults? kiểm tra reply hợp lệ còn lại
    expect(root.replies.map((r) => r.id)).toContain('c2');
    const reply = root.replies.find((r) => r.id === 'c2');
    expect(reply?.parentId).toBe('c1');
    expect(reply?.author).toBeNull();
  });

  it('loại reply tầng 2 (chỉ giữ trực tiếp có id)', () => {
    const result = communityMapper.toThreadModel(threadEnvelope);
    const allIds: string[] = [];
    for (const item of result.items) {
      allIds.push(item.id, ...item.replies.map((r) => r.id));
    }
    expect(allIds).not.toContain('c-evil');
  });

  it('placeholder null-content + meta snake_case', () => {
    const result = communityMapper.toThreadModel({
      success: true,
      data: [{ id: 'c9', status: 'DELETED', is_placeholder: true, content: null }],
      meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });
    expect(result.items[0].content).toBeNull();
    expect(result.items[0].isPlaceholder).toBe(true);
    expect(result.metadata.totalItems).toBe(1);
  });

  it('envelope null → thread rỗng', () => {
    const result = communityMapper.toThreadModel(null);
    expect(result.items).toEqual([]);
    expect(result.metadata.totalItems).toBe(0);
  });

  it('status lạ → VISIBLE, author rỗng → ẩn danh', () => {
    const comment = communityMapper.toSingleComment({
      success: true,
      data: { id: 'cx', status: 'GHOST', author: { id: '', displayName: '' } },
      meta: null,
    });
    expect(comment.status).toBe(CommentStatus.VISIBLE);
    expect(comment.author?.displayName).toBe('Người dùng ẩn danh');
  });

  it('toCreateDto/toUpdateDto chỉ gửi field cho phép', () => {
    expect(communityMapper.toCreateDto('  hay  ')).toEqual({ content: '  hay  ' });
    expect(communityMapper.toCreateDto('a', 'c1')).toEqual({ content: 'a', parentId: 'c1' });
    expect(communityMapper.toUpdateDto('b')).toEqual({ content: 'b' });
  });
});

describe('CommunityMapper summary/vote/rating/bookmark', () => {
  it('summary null-safe cho guest', () => {
    const summary = communityMapper.toSummaryModel({
      success: true,
      data: { postId: 'p1', voteCount: '12', rating: null, viewer: null },
      meta: null,
    });
    expect(summary).toMatchObject({
      voteCount: 12,
      ratingCount: 0,
      tasteAverage: null,
      viewerVoted: false,
      viewerBookmarked: false,
    });
  });

  it('summary đủ aggregate + viewer', () => {
    const envelope: CommunitySummaryResponseDto = {
      success: true,
      data: {
        postId: 'p1',
        voteCount: 12,
        rating: { count: 4, tasteAverage: 4.5, difficultyAverage: 3 },
        viewer: { voted: true, bookmarked: false, rating: { taste: 5, difficulty: 2 } },
      },
      meta: null,
    };
    const summary = communityMapper.toSummaryModel(envelope);
    expect(summary.tasteAverage).toBe(4.5);
    expect(summary.viewerTaste).toBe(5);
    expect(summary.viewerBookmarked).toBe(false);
  });

  it('summary rating là mảng → lấy phần tử đầu tiên', () => {
    const envelope = {
      success: true,
      data: {
        postId: 'e91cc243-cd9b-4cfc-b610-126a5ea15d5c',
        voteCount: 1,
        rating: [
          { count: 1, tasteAverage: 4, difficultyAverage: 3 },
          { count: 9, tasteAverage: 2, difficultyAverage: 1 },
        ],
        viewer: null,
      },
      meta: null,
    };
    const summary = communityMapper.toSummaryModel(
      envelope as unknown as CommunitySummaryResponseDto
    );
    expect(summary.ratingCount).toBe(1);
    expect(summary.tasteAverage).toBe(4);
    expect(summary.difficultyAverage).toBe(3);
  });

  it('vote idempotent + rating thiếu 1 chiều → giữ 0', () => {
    expect(
      communityMapper.toVoteModel({
        success: true,
        data: { postId: 'p', voted: true, voteCount: 7 },
        meta: null,
      })
    ).toEqual({ postId: 'p', voted: true, voteCount: 7 });
    const rating = communityMapper.toRatingModel({
      success: true,
      data: { postId: 'p', rating: { taste: 5 }, aggregate: null },
      meta: null,
    });
    expect(rating.difficulty).toBe(0);
    expect(rating.aggregateCount).toBe(0);
    expect(communityMapper.toRatingDto(4, 3)).toEqual({ taste: 4, difficulty: 3 });
  });

  it('bookmark toggle + list lọc rỗng', () => {
    expect(
      communityMapper.toBookmarkModel({
        success: true,
        data: { postId: 'p', bookmarked: false },
        meta: null,
      })
    ).toEqual({ postId: 'p', bookmarked: false });
    const envelope: CommunityBookmarkListResponseDto = {
      success: true,
      data: [
        {
          postId: 'p1',
          type: 'RECIPE',
          slug: 's',
          title: 'Món 1',
          bookmarkedAt: '2026-09-16T10:00:00.000Z',
        },
        { postId: '', title: 'rác' },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    const result = communityMapper.toBookmarksList(envelope);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Món 1');
  });

  it('thread lọc item rỗng id + meta snake_case', () => {
    const result = communityMapper.toThreadModel({
      success: true,
      data: [
        { id: '', content: 'rác' },
        { id: 'c1', content: 'giữ' },
      ],
      meta: { page: 2, limit: 5, total: 11, total_pages: 3 },
    });
    expect(result.items.map((i) => i.id)).toEqual(['c1']);
    expect(result.metadata).toMatchObject({
      page: 2,
      totalItems: 11,
      totalPages: 3,
      hasNextPage: true,
    });
  });

  it('summary viewer rating null khi khách', () => {
    const summary = communityMapper.toSummaryModel({
      success: true,
      data: { postId: 'p', voteCount: 0, rating: { count: 0 }, viewer: { voted: false } },
      meta: null,
    });
    expect(summary.viewerTaste).toBeNull();
    expect(summary.viewerDifficulty).toBeNull();
    expect(summary.tasteAverage).toBeNull();
  });
});
