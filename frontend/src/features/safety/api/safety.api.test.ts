import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportReasonCode, ReportTargetKind } from '@/common/enums';
import api from '@/lib/axios';
import { __resetSafetyFixtures, safetyApi } from './safety.api';

describe('safety API response mapping', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __resetSafetyFixtures();
  });

  it('maps the report and deleted count from response envelopes', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { success: true, data: { id: 'report-1', reasonCode: 'SPAM' } },
    });
    vi.spyOn(api, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { deletedCount: 3 } },
    });
    const report = await safetyApi.submitReport({
      targetId: '11111111-1111-4111-8111-111111111111',
      targetKind: ReportTargetKind.POST,
      reasonCode: ReportReasonCode.SPAM,
    });
    expect(report.id).toBe('report-1');
    await expect(safetyApi.deleteBehaviorHistory()).resolves.toEqual({ deletedCount: 3 });
  });
});
