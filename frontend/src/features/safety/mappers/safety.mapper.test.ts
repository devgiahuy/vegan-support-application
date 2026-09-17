import { describe, expect, it } from 'vitest';
import { safetyMapper } from './safety.mapper';
import type { ViolationReportResponseDto } from '../types/safety.dto';
import { ReportReasonCode, ReportTargetKind } from '@/common/enums';

describe('SafetyMapper reports', () => {
  it('map báo cáo đủ field + label Việt', () => {
    const envelope: ViolationReportResponseDto = {
      success: true,
      data: {
        id: 'rep-1',
        targetId: '11111111-1111-4111-8111-111111111111',
        targetType: 'POST',
        reasonCode: 'SPAM',
        details: 'Link rác',
        status: 'OPEN',
      },
      meta: null,
    };
    const report = safetyMapper.toSingleReport(envelope);
    expect(report.targetKind).toBe(ReportTargetKind.POST);
    expect(report.targetKindLabel).toBe('Bài viết');
    expect(report.reasonCode).toBe(ReportReasonCode.SPAM);
    expect(report.reasonLabel).toBe('Spam');
    expect(report.details).toBe('Link rác');
    expect(report.statusLabel).toBe('Đang mở');
  });

  it('COMMENT + snake_case + RESOLVED', () => {
    const report = safetyMapper.toSingleReport({
      success: true,
      data: {
        id: 'r',
        target_id: 'a',
        target_type: 'COMMENT',
        reason_code: 'HARASSMENT',
        status: 'RESOLVED',
      },
      meta: null,
    });
    expect(report.targetKindLabel).toBe('Bình luận');
    expect(report.reasonLabel).toBe('Quấy rối');
    expect(report.statusLabel).toBe('Đã xử lý');
  });

  it('mã lạ → fallback OTHER/POST, details rỗng → null', () => {
    const report = safetyMapper.toSingleReport({
      success: true,
      data: { id: 'r', targetType: 'GHOST', reasonCode: 'GHOST', details: '   ' },
      meta: null,
    });
    expect(report.targetKind).toBe(ReportTargetKind.POST);
    expect(report.reasonCode).toBe(ReportReasonCode.OTHER);
    expect(report.details).toBeNull();
  });

  it('envelope null → defaults an toàn', () => {
    const report = safetyMapper.toSingleReport(null);
    expect(report.id).toBe('');
    expect(report.details).toBeNull();
  });

  it('đủ 6 nhãn lý do Việt', () => {
    const codes = [
      'SPAM',
      'HARMFUL_HEALTH',
      'HARASSMENT',
      'MISINFORMATION',
      'COPYRIGHT',
      'OTHER',
    ] as const;
    const labels = codes.map(
      (code) =>
        safetyMapper.toSingleReport({
          success: true,
          data: { id: 'r', reasonCode: code },
          meta: null,
        }).reasonLabel
    );
    expect(labels).toEqual([
      'Spam',
      'Gây hại sức khỏe',
      'Quấy rối',
      'Thông tin sai lệch',
      'Vi phạm bản quyền',
      'Lý do khác',
    ]);
  });
});

describe('SafetyMapper submit/delete', () => {
  const uuid = '11111111-1111-4111-8111-111111111111';

  it('toSubmitDto đủ shape, bỏ details rỗng', () => {
    expect(
      safetyMapper.toSubmitDto({
        targetKind: ReportTargetKind.COMMENT,
        targetId: uuid,
        reasonCode: ReportReasonCode.COPYRIGHT,
        details: '  ',
      })
    ).toEqual({ targetType: 'COMMENT', targetId: uuid, reasonCode: 'COPYRIGHT' });
  });

  it('toSubmitDto giữ details có nội dung', () => {
    expect(
      safetyMapper.toSubmitDto({
        targetKind: ReportTargetKind.POST,
        targetId: uuid,
        reasonCode: ReportReasonCode.OTHER,
        details: 'abc',
      })
    ).toEqual({ targetType: 'POST', targetId: uuid, reasonCode: 'OTHER', details: 'abc' });
  });

  it('UUID sai → null (không gửi)', () => {
    expect(
      safetyMapper.toSubmitDto({
        targetKind: ReportTargetKind.POST,
        targetId: 'not-uuid',
        reasonCode: ReportReasonCode.SPAM,
      })
    ).toBeNull();
  });

  it('toDeletionResult đọc deletedCount, thiếu → 0', () => {
    expect(
      safetyMapper.toDeletionResult({ success: true, data: { deletedCount: 42 }, meta: null })
    ).toEqual({ deletedCount: 42 });
    expect(safetyMapper.toDeletionResult(null)).toEqual({ deletedCount: 0 });
    expect(safetyMapper.toDeletionResult({ success: true, data: {}, meta: null })).toEqual({
      deletedCount: 0,
    });
  });

  it('createdAt ISO parse đúng', () => {
    const report = safetyMapper.toSingleReport({
      success: true,
      data: { id: 'r', created_at: '2026-09-17T10:00:00.000Z' },
      meta: null,
    });
    expect(report.createdAt).not.toBeNull();
  });

  it('status rỗng → Đang mở', () => {
    const report = safetyMapper.toSingleReport({ success: true, data: { id: 'r' }, meta: null });
    expect(report.statusLabel).toBe('Đang mở');
  });

  it('status lowercase resolved vẫn nhận diện', () => {
    const report = safetyMapper.toSingleReport({
      success: true,
      data: { id: 'r', status: 'resolved' },
      meta: null,
    });
    expect(report.statusLabel).toBe('Đã xử lý');
  });
});
