import { describe, expect, it } from 'vitest';
import { adminAuditMapper } from './admin-audit.mapper';

describe('admin audit mapper', () => {
  it('labels automatic moderation and admin actions, keeping the cursor and original time', () => {
    const occurredAt = '2026-11-19T10:20:30.000Z';
    const result = adminAuditMapper.toModel({
      items: [
        { id: 'a', source: 'AI_FLAG', action: 'FLAGGED', actor: null, occurredAt },
        {
          id: 'a',
          source: 'MODERATION',
          action: 'APPROVE',
          targetType: 'POST',
          targetId: 'post-1',
          actor: { id: 'admin', displayName: 'Quản trị viên' },
          occurredAt,
        },
      ],
      nextCursor: 'next-page',
    });
    expect(result.nextCursor).toBe('next-page');
    expect(result.rows[0]).toMatchObject({
      key: 'AI_FLAG:a',
      actorLabel: 'Hệ thống',
      actionLabel: 'Gắn cờ cần xem xét',
      occurredAt,
    });
    expect(result.rows[0].timeLabel).toContain('17:20:30');
    expect(result.rows[1]).toMatchObject({
      key: 'MODERATION:a',
      actorLabel: 'Quản trị viên',
      targetLabel: 'Bài viết',
      targetId: 'post-1',
    });
  });

  it('uses neutral labels for unfamiliar codes and skips rows without an ID or valid time', () => {
    const result = adminAuditMapper.toModel({
      items: [
        { id: 'a', occurredAt: 'invalid' },
        { occurredAt: '2026-11-19T10:20:30.000Z' },
        {
          id: 'b',
          source: 'constructor',
          action: 'UNKNOWN',
          occurredAt: '2026-11-19T10:20:30.000Z',
        },
      ],
    });
    expect(result.nextCursor).toBeNull();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      sourceLabel: 'Nguồn khác',
      actorLabel: 'Tài khoản không rõ',
      actionLabel: 'Thao tác khác',
    });
  });
});
