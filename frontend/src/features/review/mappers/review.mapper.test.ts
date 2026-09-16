import { describe, it, expect } from 'vitest';
import { reviewMapper } from './review.mapper';
import { ModerationPriority, ReviewItemStatus } from '@/common/enums';
import type { ReviewQueueItemDto } from '../types/review.dto';

function backendQueueItem(): ReviewQueueItemDto {
  return {
    postId: 'post-1',
    type: 'RECIPE',
    slug: 'dau-hu-sot-ca',
    postStatus: 'PENDING_REVIEW',
    revisionId: 'rev-1',
    revisionVersion: 2,
    revisionStatus: 'PENDING_REVIEW',
    title: 'Đậu hũ sốt cà',
    excerpt: 'Món chay thanh đạm',
    author: { id: 'usr-1', displayName: 'Nguyễn Văn A', role: 'MEMBER' },
    aiFlags: [
      { id: 'flag-1', reasonCodes: ['UNVERIFIED_NUTRITION'], riskScore: 0.72, riskLevel: 'HIGH' },
    ],
    priority: 'HIGH',
    activeReporterCount: 2,
    canDecide: true,
    createdAt: '2026-09-16T10:00:00Z',
  };
}

describe('ReviewMapper', () => {
  it('maps backend queue item to ReviewQueueItem correctly', () => {
    const model = reviewMapper.toModel(backendQueueItem());

    expect(model.postId).toBe('post-1');
    expect(model.title).toBe('Đậu hũ sốt cà');
    expect(model.status).toBe(ReviewItemStatus.PENDING_REVIEW);
    expect(model.statusLabel).toBe('Chờ duyệt');
    expect(model.revisionVersion).toBe(2);
    expect(model.author.name).toBe('Nguyễn Văn A');
    expect(model.priority).toBe(ModerationPriority.HIGH);
    expect(model.priorityLabel).toBe('Cao');
    expect(model.activeReporterCount).toBe(2);
    expect(model.canDecide).toBe(true);
    expect(model.aiFlags).toHaveLength(1);
    expect(model.aiFlags[0].reasonCodes).toEqual(['UNVERIFIED_NUTRITION']);
  });

  it('handles null dto with safe fallbacks', () => {
    const model = reviewMapper.toModel(null);

    expect(model.postId).toBe('');
    expect(model.title).toBe('Bài viết chưa có tiêu đề');
    expect(model.status).toBe(ReviewItemStatus.PENDING_REVIEW);
    expect(model.canDecide).toBe(false);
    expect(model.aiFlags).toEqual([]);
    expect(model.createdAt).toBeNull();
  });

  it('maps Vietnamese labels for all statuses and priorities', () => {
    expect(reviewMapper.toModel({ postStatus: 'FLAGGED' }).statusLabel).toBe('Cờ cảnh báo');
    expect(reviewMapper.toModel({ postStatus: 'QUARANTINED' }).statusLabel).toBe('Tạm giữ');
    expect(reviewMapper.toModel({ postStatus: 'WEIRD' }).status).toBe(
      ReviewItemStatus.PENDING_REVIEW
    );
    expect(reviewMapper.toModel({ priority: 'URGENT' }).priorityLabel).toBe('Khẩn cấp');
    expect(reviewMapper.toModel({ priority: 'MEDIUM' }).priorityLabel).toBe('Trung bình');
    expect(reviewMapper.toModel({ priority: 'LOW' }).priorityLabel).toBe('Thấp');
  });

  it('builds decision DTO with trimmed reason', () => {
    expect(reviewMapper.toDecisionDto('  Lý do hợp lệ  ')).toEqual({ reason: 'Lý do hợp lệ' });
  });

  it('maps pagination envelope correctly', () => {
    const page = reviewMapper.toPaginationFromEnvelope([backendQueueItem()], {
      page: 1,
      limit: 20,
      total: 5,
      totalPages: 1,
    });
    expect(page.items).toHaveLength(1);
    expect(page.metadata.totalItems).toBe(5);
  });
});
