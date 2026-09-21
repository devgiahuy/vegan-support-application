export function createIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getMondayDateString(base = new Date()): string {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateOnly(date);
}

export function shiftWeek(dateOnly: string, weeks: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date();
  date.setDate(date.getDate() + weeks * 7);
  return toDateOnly(date);
}

function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}
