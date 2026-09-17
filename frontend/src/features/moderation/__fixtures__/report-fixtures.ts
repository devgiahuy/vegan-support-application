import type {
  ModerationReportListResponseDto,
  ModerationReportResponseDto,
} from '../types/moderation.dto';

/** Fixture hàng chờ báo cáo (phase scaffold — BE còn `PLANNED`). */
export const reportListFixture: ModerationReportListResponseDto = {
  success: true,
  data: [
    {
      id: 'rep-1',
      targetId: 'post-1',
      targetType: 'POST',
      targetTitle: 'Bài viết nghi spam link',
      targetExcerpt: 'Mua ngay giá rẻ...',
      openCount: 3,
      reasons: ['Spam', 'Nội dung lừa đảo'],
      status: 'OPEN',
      priority: 'HIGH',
      reporterCount: 3,
      createdAt: '2026-09-15T08:00:00.000Z',
      resolvedAt: null,
      resolution: null,
    },
    {
      id: 'rep-2',
      targetId: 'cmt-1',
      targetType: 'COMMENT',
      targetTitle: 'Bình luận trong “Bún bò Huế chay”',
      targetExcerpt: null,
      openCount: 1,
      reasons: ['Ngôn từ công kích'],
      status: 'OPEN',
      priority: 'MEDIUM',
      reporterCount: 1,
      createdAt: '2026-09-14T10:00:00.000Z',
      resolvedAt: null,
      resolution: null,
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

export function resolvedReportFixture(
  id: string,
  decision: string,
  reason: string
): ModerationReportResponseDto {
  return {
    success: true,
    data: {
      id,
      targetId: 'post-1',
      targetType: 'POST',
      status: 'RESOLVED',
      openCount: 0,
      resolvedAt: new Date().toISOString(),
      resolution: {
        decision,
        reason,
        resolvedBy: 'Admin Demo',
        resolvedAt: new Date().toISOString(),
      },
    },
    meta: null,
  };
}
