import { describe, it, expect } from 'vitest';
import {
  contentReviewMapper,
  formatVideoDuration,
  getModerationPriorityLabel,
  getPostReviewStatusLabel,
  getPostTypeLabel,
  parseModerationPriority,
  parsePostReviewStatus,
  parsePostType,
} from './content-review.mapper';
import { PostReviewStatus, ReviewDecisionEnum } from '../types/content-review.model';
import { ModerationPriority, PostType } from '@/common/enums';
import type {
  AdminContentReviewDetailDto,
  ContentReviewHistoryResponseDto,
  ReviewQueueItemDto,
  ReviewQueueListResponseDto,
  SubmitPostResponseDataDto,
} from '../types/content-review.dto';

describe('ContentReviewMapper', () => {
  // Test 1: Fallback khi DTO null hoặc undefined
  it('1. maps null or undefined queue item to default safe model', () => {
    const model = contentReviewMapper.toModel(null);

    expect(model.postId).toBe('');
    expect(model.title).toBe('Bản nháp chưa có tiêu đề');
    expect(model.type).toBe(PostType.BLOG);
    expect(model.typeLabel).toBe('Bài viết');
    expect(model.postStatus).toBe(PostReviewStatus.DRAFT);
    expect(model.postStatusLabel).toBe('Bản nháp riêng tư');
    expect(model.revisionStatus).toBe(PostReviewStatus.PENDING_REVIEW);
    expect(model.author.displayName).toBe('Tác giả ẩn danh');
    expect(model.author.role).toBe('MEMBER');
    expect(model.aiFlags).toEqual([]);
    expect(model.aiFlagsCount).toBe(0);
    expect(model.hasAiFlags).toBe(false);
    expect(model.priority).toBe(ModerationPriority.LOW);
    expect(model.isHighPriority).toBe(false);
    expect(model.canDecide).toBe(false);
    expect(model.submittedAt).toBeNull();
  });

  // Test 2: Map đầy đủ thông tin queue item
  it('2. maps valid queue item with all fields populated', () => {
    const dto: ReviewQueueItemDto = {
      postId: 'post-123',
      type: 'RECIPE',
      slug: 'canh-chua-chay',
      postStatus: 'PENDING_REVIEW',
      revisionId: 'rev-456',
      revisionVersion: 2,
      revisionStatus: 'PENDING_REVIEW',
      title: 'Canh chua chay thanh mát',
      excerpt: 'Món canh thơm ngon ngày hè',
      author: {
        id: 'author-789',
        displayName: 'Chef Tuệ',
        role: 'CONTRIBUTOR',
        contributorApprovalBasis: 'PLATFORM_TRACK_RECORD',
      },
      aiFlags: [
        {
          id: 'flag-1',
          provider: 'GEMINI',
          model: 'gemini-1.5-pro',
          reasonCodes: ['NON_VEGAN_SUSPICION'],
          riskScore: 35,
          riskLevel: 'LOW',
        },
      ],
      priority: 'HIGH',
      activeReporterCount: 2,
      canDecide: true,
      submittedAt: '2026-09-23T10:00:00.000Z',
      createdAt: '2026-09-23T08:00:00.000Z',
    };

    const model = contentReviewMapper.toModel(dto);

    expect(model.postId).toBe('post-123');
    expect(model.type).toBe(PostType.RECIPE);
    expect(model.typeLabel).toBe('Công thức');
    expect(model.title).toBe('Canh chua chay thanh mát');
    expect(model.postStatus).toBe(PostReviewStatus.PENDING_REVIEW);
    expect(model.postStatusLabel).toBe('Đang chờ duyệt');
    expect(model.revisionId).toBe('rev-456');
    expect(model.revisionVersion).toBe(2);
    expect(model.author.displayName).toBe('Chef Tuệ');
    expect(model.author.role).toBe('CONTRIBUTOR');
    expect(model.author.contributorApprovalBasis).toBe('PLATFORM_TRACK_RECORD');
    expect(model.aiFlagsCount).toBe(1);
    expect(model.hasAiFlags).toBe(true);
    expect(model.priority).toBe(ModerationPriority.HIGH);
    expect(model.priorityLabel).toBe('Ưu tiên cao');
    expect(model.isHighPriority).toBe(true);
    expect(model.activeReporterCount).toBe(2);
    expect(model.hasReports).toBe(true);
    expect(model.canDecide).toBe(true);
    expect(model.submittedAt).toBeInstanceOf(Date);
  });

  // Test 3: Quy đổi trạng thái xuất bản sang tiếng Việt
  it('3. converts post review statuses to human-readable Vietnamese labels', () => {
    expect(getPostReviewStatusLabel(PostReviewStatus.DRAFT)).toBe('Bản nháp riêng tư');
    expect(getPostReviewStatusLabel(PostReviewStatus.PENDING_REVIEW)).toBe('Đang chờ duyệt');
    expect(getPostReviewStatusLabel(PostReviewStatus.PUBLISHED)).toBe('Đã xuất bản');
    expect(getPostReviewStatusLabel(PostReviewStatus.REJECTED)).toBe('Bị từ chối');
    expect(getPostReviewStatusLabel(PostReviewStatus.FLAGGED)).toBe('Bị cảnh báo');

    expect(parsePostReviewStatus('draft')).toBe(PostReviewStatus.DRAFT);
    expect(parsePostReviewStatus('PENDING_REVIEW')).toBe(PostReviewStatus.PENDING_REVIEW);
    expect(parsePostReviewStatus('unknown_status')).toBe(PostReviewStatus.DRAFT);
  });

  // Test 4: Quy đổi loại nội dung sang tiếng Việt
  it('4. converts content types to human-readable Vietnamese labels', () => {
    expect(getPostTypeLabel(PostType.RECIPE)).toBe('Công thức');
    expect(getPostTypeLabel(PostType.BLOG)).toBe('Bài viết');
    expect(getPostTypeLabel(PostType.VIDEO)).toBe('Video nấu ăn');

    expect(parsePostType('recipe')).toBe(PostType.RECIPE);
    expect(parsePostType('VIDEO')).toBe(PostType.VIDEO);
    expect(parsePostType('invalid')).toBe(PostType.BLOG);
  });

  // Test 5: Quy đổi mức độ ưu tiên
  it('5. converts priority levels to appropriate badges and labels', () => {
    expect(getModerationPriorityLabel(ModerationPriority.HIGH)).toBe('Ưu tiên cao');
    expect(getModerationPriorityLabel(ModerationPriority.MEDIUM)).toBe('Trung bình');
    expect(getModerationPriorityLabel(ModerationPriority.LOW)).toBe('Bình thường');

    expect(parseModerationPriority('HIGH')).toBe(ModerationPriority.HIGH);
    expect(parseModerationPriority('urgent')).toBe(ModerationPriority.HIGH);
    expect(parseModerationPriority('medium')).toBe(ModerationPriority.MEDIUM);
    expect(parseModerationPriority(null)).toBe(ModerationPriority.LOW);
  });

  // Test 6: Phân trang hàng chờ duyệt (Pagination Result)
  it('6. maps review queue list response to pagination result', () => {
    const dto: ReviewQueueListResponseDto = {
      success: true,
      data: [
        {
          postId: 'post-1',
          title: 'Bài 1',
          type: 'BLOG',
          postStatus: 'PENDING_REVIEW',
        },
        {
          postId: 'post-2',
          title: 'Bài 2',
          type: 'VIDEO',
          postStatus: 'PENDING_REVIEW',
        },
      ],
      meta: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    };

    const result = contentReviewMapper.toQueuePagination(dto.data, dto.meta);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].postId).toBe('post-1');
    expect(result.items[1].postId).toBe('post-2');
    expect(result.metadata.page).toBe(2);
    expect(result.metadata.limit).toBe(10);
    expect(result.metadata.totalItems).toBe(25);
    expect(result.metadata.totalPages).toBe(3);
  });

  // Test 7: Map chi tiết thẩm định kèm công thức nấu ăn
  it('7. maps admin content review detail with recipe data', () => {
    const dto: AdminContentReviewDetailDto = {
      postId: 'post-recipe-1',
      title: 'Phở nấm chay',
      type: 'RECIPE',
      body: 'Các bước nấu chi tiết...',
      tags: ['pho', 'nam', 'thanh-dam'],
      categories: [{ id: 'cat-1', name: 'Món nước', slug: 'mon-nuoc' }],
      media: [{ id: 'm-1', url: 'https://example.com/pho.jpg', type: 'IMAGE' }],
      recipe: {
        prepTimeMinutes: 15,
        cookTimeMinutes: 45,
        servings: 4,
        difficulty: 'MEDIUM',
        ingredients: [
          { name: 'Nấm hương', amount: 200, unit: 'g', notes: 'ngâm mềm' },
          { name: 'Bánh phở', amount: 500, unit: 'g' },
        ],
        instructions: [
          { stepNumber: 1, description: 'Sơ chế nấm' },
          { stepNumber: 2, description: 'Hầm nước dùng' },
        ],
      },
    };

    const model = contentReviewMapper.toDetailModel(dto);

    expect(model.postId).toBe('post-recipe-1');
    expect(model.type).toBe(PostType.RECIPE);
    expect(model.body).toBe('Các bước nấu chi tiết...');
    expect(model.categories).toHaveLength(1);
    expect(model.categories[0].name).toBe('Món nước');
    expect(model.recipe).toBeDefined();
    expect(model.recipe?.servings).toBe(4);
    expect(model.recipe?.ingredients).toHaveLength(2);
    expect(model.recipe?.ingredients[0].name).toBe('Nấm hương');
    expect(model.recipe?.instructions).toHaveLength(2);
  });

  // Test 8: Map chi tiết thẩm định kèm Video nấu ăn
  it('8. maps admin content review detail with video player data', () => {
    const dto: AdminContentReviewDetailDto = {
      postId: 'post-video-1',
      title: 'Video làm chả giò chay',
      type: 'VIDEO',
      video: {
        source: 'UPLOAD',
        externalUrl: null,
        durationSeconds: 125,
        mediaAssetId: 'asset-video-1',
      },
      media: [
        {
          id: 'asset-video-1',
          url: 'https://res.cloudinary.com/demo/video/upload/cha-gio.mp4',
          type: 'VIDEO',
        },
      ],
    };

    const model = contentReviewMapper.toDetailModel(dto);

    expect(model.type).toBe(PostType.VIDEO);
    expect(model.video).toBeDefined();
    expect(model.video?.source).toBe('UPLOAD');
    expect(model.video?.durationSeconds).toBe(125);
    expect(model.video?.durationFormatted).toBe('02:05');
    expect(model.video?.videoPlayerUrl).toBe(
      'https://res.cloudinary.com/demo/video/upload/cha-gio.mp4'
    );
  });

  // Test 9: Format video duration helper
  it('9. correctly formats video duration into mm:ss', () => {
    expect(formatVideoDuration(0)).toBe('00:00');
    expect(formatVideoDuration(45)).toBe('00:45');
    expect(formatVideoDuration(65)).toBe('01:05');
    expect(formatVideoDuration(360)).toBe('06:00');
    expect(formatVideoDuration(null)).toBe('00:00');
  });

  // Test 10: Map lịch sử duyệt bài viết (History Timeline)
  it('10. maps review history with revisions, rejection reasons and active published revision', () => {
    const dto: ContentReviewHistoryResponseDto = {
      success: true,
      data: {
        postId: 'post-100',
        type: 'RECIPE',
        postStatus: 'PUBLISHED',
        version: 3,
        publishedRevisionId: 'rev-2',
        revisions: [
          {
            revisionId: 'rev-3',
            revisionVersion: 3,
            revisionStatus: 'PENDING_REVIEW',
            submittedAt: '2026-09-23T11:00:00.000Z',
          },
          {
            revisionId: 'rev-2',
            revisionVersion: 2,
            revisionStatus: 'PUBLISHED',
            submittedAt: '2026-09-22T08:00:00.000Z',
            reviewedAt: '2026-09-22T09:30:00.000Z',
            reviewedBy: 'admin-1',
            reviewNote: 'Công thức rất chuẩn.',
          },
          {
            revisionId: 'rev-1',
            revisionVersion: 1,
            revisionStatus: 'REJECTED',
            submittedAt: '2026-09-21T10:00:00.000Z',
            reviewedAt: '2026-09-21T11:20:00.000Z',
            reviewedBy: 'admin-2',
            reviewNote: 'Ảnh bìa bị vỡ nét, vui lòng thay ảnh rõ hơn.',
          },
        ],
      },
      meta: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    };

    const history = contentReviewMapper.toHistoryModel(dto.data);

    expect(history.postId).toBe('post-100');
    expect(history.postStatus).toBe(PostReviewStatus.PUBLISHED);
    expect(history.revisions).toHaveLength(3);
    expect(history.hasPendingRevision).toBe(true);
    expect(history.pendingRevisionVersion).toBe(3);

    // Kiểm tra bản revision 2 là bản đang công khai
    expect(history.revisions[1].revisionId).toBe('rev-2');
    expect(history.revisions[1].isCurrentPublished).toBe(true);
    expect(history.revisions[1].reviewNote).toBe('Công thức rất chuẩn.');

    // Kiểm tra bản revision 1 bị từ chối kèm lý do
    expect(history.revisions[2].status).toBe(PostReviewStatus.REJECTED);
    expect(history.revisions[2].statusLabel).toBe('Bị từ chối');
    expect(history.revisions[2].reviewNote).toBe('Ảnh bìa bị vỡ nét, vui lòng thay ảnh rõ hơn.');
  });

  // Test 11: Chuyển đổi payload quyết định duyệt / từ chối
  it('11. converts decision enum and reason to DecisionDto', () => {
    const approveDto = contentReviewMapper.toDecisionDto(
      ReviewDecisionEnum.APPROVE,
      '  Đạt chuẩn chất lượng xuất bản  '
    );
    expect(approveDto).toEqual({
      decision: 'APPROVE',
      reason: 'Đạt chuẩn chất lượng xuất bản',
    });

    const rejectDto = contentReviewMapper.toDecisionDto(
      ReviewDecisionEnum.REJECT,
      'Nội dung chưa đủ nguyên liệu.'
    );
    expect(rejectDto).toEqual({
      decision: 'REJECT',
      reason: 'Nội dung chưa đủ nguyên liệu.',
    });
  });

  // Test 12: Map kết quả submitPost tự động xuất bản (Contributor)
  it('12. maps auto-published submit post result when Contributor publishes cleanly', () => {
    const dto: SubmitPostResponseDataDto = {
      id: 'post-recipe-9',
      type: 'RECIPE',
      slug: 'dau-hu-xao-nam-rom',
      status: 'PUBLISHED',
      version: 1,
      publishedRevisionVersion: 1,
      publishedAt: '2026-11-10T04:15:00.000Z',
      revision: {
        id: 'rev-recipe-9',
        version: 1,
        status: 'PUBLISHED',
        title: 'Đậu hũ xào nấm rơm',
        submittedAt: '2026-11-10T04:15:00.000Z',
      },
    };

    const result = contentReviewMapper.toSubmitResult(dto);

    expect(result.postId).toBe('post-recipe-9');
    expect(result.type).toBe(PostType.RECIPE);
    expect(result.slug).toBe('dau-hu-xao-nam-rom');
    expect(result.title).toBe('Đậu hũ xào nấm rơm');
    expect(result.postStatus).toBe(PostReviewStatus.PUBLISHED);
    expect(result.postStatusLabel).toBe('Đã xuất bản');
    expect(result.revisionStatus).toBe(PostReviewStatus.PUBLISHED);
    expect(result.revisionStatusLabel).toBe('Đã xuất bản');
    expect(result.revisionId).toBe('rev-recipe-9');
    expect(result.revisionVersion).toBe(1);
    expect(result.publishedRevisionVersion).toBe(1);
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(result.isAutoPublished).toBe(true);
  });

  // Test 13: Dual-revision không tự động xuất bản (ví dụ Member/Admin gửi bản sửa v2)
  it('13. maps dual-revision submit post result without marking isAutoPublished', () => {
    const dto: SubmitPostResponseDataDto = {
      id: 'post-recipe-10',
      type: 'RECIPE',
      slug: 'canh-chua',
      status: 'PUBLISHED',
      version: 2,
      publishedRevisionVersion: 1,
      publishedAt: '2026-10-01T00:00:00.000Z',
      revision: {
        id: 'rev-recipe-10-v2',
        version: 2,
        status: 'PENDING_REVIEW',
        title: 'Canh chua chay v2',
      },
    };

    const result = contentReviewMapper.toSubmitResult(dto);

    expect(result.postStatus).toBe(PostReviewStatus.PUBLISHED);
    expect(result.revisionStatus).toBe(PostReviewStatus.PENDING_REVIEW);
    expect(result.revisionStatusLabel).toBe('Đang chờ duyệt');
    expect(result.publishedRevisionVersion).toBe(1);
    expect(result.isAutoPublished).toBe(false);
  });

  // Test 14: Nội dung bị gắn cờ / tạm giữ khi submit không được đánh dấu isAutoPublished
  it('14. maps flagged or quarantined submit post result with isAutoPublished = false', () => {
    const dto: SubmitPostResponseDataDto = {
      id: 'post-blog-5',
      type: 'BLOG',
      status: 'QUARANTINED',
      version: 1,
      publishedRevisionVersion: null,
      revision: {
        id: 'rev-blog-5',
        version: 1,
        status: 'FLAGGED',
        title: 'Bài cần rà soát',
      },
    };

    const result = contentReviewMapper.toSubmitResult(dto);

    expect(result.postStatus).toBe(PostReviewStatus.QUARANTINED);
    expect(result.revisionStatus).toBe(PostReviewStatus.FLAGGED);
    expect(result.publishedRevisionVersion).toBeNull();
    expect(result.isAutoPublished).toBe(false);
  });

  // Test 15: Fallback an toàn khi dto null hoặc thiếu revision
  it('15. maps null or missing submit post revision safely using fallback status', () => {
    const nullResult = contentReviewMapper.toSubmitResult(null);
    expect(nullResult.postId).toBe('');
    expect(nullResult.postStatus).toBe(PostReviewStatus.DRAFT);
    expect(nullResult.revisionStatus).toBe(PostReviewStatus.DRAFT);
    expect(nullResult.publishedRevisionVersion).toBeNull();
    expect(nullResult.isAutoPublished).toBe(false);

    const noRevisionResult = contentReviewMapper.toSubmitResult({
      id: 'post-v1',
      status: 'PENDING_REVIEW',
      version: 1,
    });
    expect(noRevisionResult.revisionStatus).toBe(PostReviewStatus.PENDING_REVIEW);
    expect(noRevisionResult.revisionVersion).toBe(1);
    expect(noRevisionResult.isAutoPublished).toBe(false);
  });
});
