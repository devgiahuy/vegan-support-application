/** Tiện ích ngày cho lộ trình: ngày bắt đầu phải là Thứ hai (đầu tuần dinh dưỡng). */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidDateOnly(value: string): boolean {
  return parseDateOnly(value) !== null;
}

export function isMonday(value: string): boolean {
  return parseDateOnly(value)?.getDay() === 1;
}

/** Thứ hai tiếp theo tính từ ngày cho trước (nếu đúng Thứ hai thì lấy chính ngày đó). */
export function snapToNextMonday(value: string): string {
  const date = parseDateOnly(value) ?? new Date();
  const day = date.getDay();
  const offset = day === 1 ? 0 : (8 - day) % 7;
  date.setDate(date.getDate() + offset);
  return toDateOnly(date);
}

/** Danh sách `count` ngày Thứ hai sắp tới, bắt đầu từ Thứ hai gần nhất (kể cả hôm nay nếu là Thứ hai). */
export function getUpcomingMondays(count: number, from = new Date()): string[] {
  const first = snapToNextMonday(toDateOnly(from));
  const base = parseDateOnly(first) as Date;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index * 7);
    return toDateOnly(date);
  });
}

/** `29/09/2026` từ `2026-09-29`. */
export function formatDateVi(value: string): string {
  const match = DATE_ONLY.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
