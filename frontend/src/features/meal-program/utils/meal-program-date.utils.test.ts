import { describe, expect, it } from 'vitest';
import {
  formatIsoDate,
  formatVietnameseDate,
  getNextMonday,
  getUpcomingMondays,
  isMonday,
  snapToNextMonday,
} from './meal-program-date.utils';

describe('meal-program-date.utils', () => {
  it('formatIsoDate should format UTC date properly', () => {
    const d = new Date(Date.UTC(2026, 8, 28)); // 2026-09-28
    expect(formatIsoDate(d)).toBe('2026-09-28');
  });

  it('formatVietnameseDate should format to DD/MM/YYYY', () => {
    expect(formatVietnameseDate('2026-09-28')).toBe('28/09/2026');
    expect(formatVietnameseDate('')).toBe('');
  });

  it('isMonday should correctly identify Mondays', () => {
    // 2026-09-28 is Monday
    expect(isMonday('2026-09-28')).toBe(true);
    // 2026-09-25 is Friday
    expect(isMonday('2026-09-25')).toBe(false);
    // 2026-09-27 is Sunday
    expect(isMonday('2026-09-27')).toBe(false);
    // Invalid strings
    expect(isMonday('')).toBe(false);
    expect(isMonday('invalid-date')).toBe(false);
  });

  it('snapToNextMonday should return same date if already Monday, or jump to next Monday', () => {
    // Already Monday
    expect(snapToNextMonday('2026-09-28')).toBe('2026-09-28');
    // Friday 2026-09-25 -> Next Monday is 2026-09-28
    expect(snapToNextMonday('2026-09-25')).toBe('2026-09-28');
    // Sunday 2026-09-27 -> Next Monday is 2026-09-28
    expect(snapToNextMonday('2026-09-27')).toBe('2026-09-28');
    // Tuesday 2026-09-29 -> Next Monday is 2026-10-05
    expect(snapToNextMonday('2026-09-29')).toBe('2026-10-05');
  });

  it('getNextMonday should return upcoming Monday from Thursday 2026-09-24', () => {
    const thursday = new Date(Date.UTC(2026, 8, 24)); // 2026-09-24
    const nextMon = getNextMonday(thursday);
    expect(nextMon).toBe('2026-09-28');
    expect(isMonday(nextMon)).toBe(true);
  });

  it('getUpcomingMondays should return 3 consecutive valid Mondays', () => {
    const thursday = new Date(Date.UTC(2026, 8, 24));
    const upcoming = getUpcomingMondays(3, thursday);
    expect(upcoming.length).toBe(3);
    expect(upcoming[0].dateStr).toBe('2026-09-28');
    expect(upcoming[1].dateStr).toBe('2026-10-05');
    expect(upcoming[2].dateStr).toBe('2026-10-12');

    upcoming.forEach((item) => {
      expect(isMonday(item.dateStr)).toBe(true);
    });
  });
});
