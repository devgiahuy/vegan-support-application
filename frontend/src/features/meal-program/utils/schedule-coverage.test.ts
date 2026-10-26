import { describe, expect, it } from 'vitest';
import { missingScheduledWeeks } from './schedule-coverage';

describe('program schedule coverage', () => {
  it('identifies missing later weeks instead of accepting only week one', () => {
    expect(
      missingScheduledWeeks('2026-10-26', 4, ['2026-10-26']).map((week) => week.weekNumber)
    ).toEqual([2, 3, 4]);
  });
  it('accepts a separately selected date in every week across a month boundary', () => {
    expect(
      missingScheduledWeeks('2026-10-26', 4, [
        '2026-11-01',
        '2026-11-08',
        '2026-11-15',
        '2026-11-22',
      ])
    ).toEqual([]);
  });
  it('does not count dates outside the requested horizon', () => {
    expect(missingScheduledWeeks('2026-10-26', 2, ['2026-10-25', '2026-11-09'])).toHaveLength(2);
  });
});
