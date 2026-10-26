import { formatIsoDate, isMonday } from './meal-program-date.utils';

export function missingScheduledWeeks(
  startDate: string,
  horizonWeeks: number,
  scheduleDates: string[]
) {
  if (!isMonday(startDate)) return [];
  const selected = new Set(scheduleDates);
  return Array.from({ length: Math.min(12, Math.max(0, horizonWeeks)) }, (_, index) => {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    start.setUTCDate(start.getUTCDate() + index * 7);
    const days = Array.from({ length: 7 }, (_, offset) => {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + offset);
      return formatIsoDate(day);
    });
    return {
      weekNumber: index + 1,
      startDate: days[0],
      endDate: days[6],
      covered: days.some((day) => selected.has(day)),
    };
  }).filter((week) => !week.covered);
}
