/**
 * Các hàm tiện ích xử lý ngày tháng cho module Meal Program
 * Quy chuẩn: Ngày bắt đầu của một lộ trình dinh dưỡng BẮT BUỘC phải là Thứ Hai (UTC Day = 1)
 */

/**
 * Định dạng đối tượng Date thành chuỗi chuẩn ISO YYYY-MM-DD dựa trên UTC
 */
export function formatIsoDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Chuyển đổi định dạng YYYY-MM-DD sang định dạng ngày hiển thị tiếng Việt DD/MM/YYYY
 */
export function formatVietnameseDate(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return isoDateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Kiểm tra xem một chuỗi ngày (YYYY-MM-DD) có thực sự là Thứ Hai hay không
 */
export function isMonday(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return !isNaN(d.getTime()) && d.getUTCDay() === 1;
}

/**
 * Lấy chuỗi ngày Thứ Hai tiếp theo tính từ một mốc thời gian nhất định (Mặc định: ngày hiện tại)
 */
export function getNextMonday(fromDate = new Date()): string {
  const d = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()));
  const day = d.getUTCDay();
  // Nếu hôm nay là Thứ Hai, trả về Thứ Hai tuần tới (sau 7 ngày)
  const daysToAdd = day === 1 ? 7 : day === 0 ? 1 : 8 - day;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return formatIsoDate(d);
}

/**
 * Nếu ngày truyền vào không phải là Thứ Hai, tự động điều chỉnh nhảy tới Thứ Hai kế tiếp gần nhất
 */
export function snapToNextMonday(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return getNextMonday();
  }
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (isNaN(d.getTime())) return getNextMonday();
  const day = d.getUTCDay();
  if (day === 1) return dateStr;
  const daysToAdd = day === 0 ? 1 : 8 - day;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return formatIsoDate(d);
}

/**
 * Danh sách gợi ý các ngày Thứ Hai sắp tới để người dùng chọn nhanh 1 cú click
 */
export interface MondayQuickOption {
  dateStr: string;
  label: string;
  formatted: string;
}

export function getUpcomingMondays(count = 3, fromDate = new Date()): MondayQuickOption[] {
  const results: MondayQuickOption[] = [];
  const baseDate = new Date(
    Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  );
  const day = baseDate.getUTCDay();
  const firstMondayOffset = day === 1 ? 7 : day === 0 ? 1 : 8 - day;

  for (let i = 0; i < count; i++) {
    const monday = new Date(baseDate);
    monday.setUTCDate(baseDate.getUTCDate() + firstMondayOffset + i * 7);
    const dateStr = formatIsoDate(monday);
    const formatted = formatVietnameseDate(dateStr);
    let label = `Thứ Hai, ${formatted}`;
    if (i === 0) label = `Thứ Hai tới (${formatted})`;
    else if (i === 1) label = `Thứ Hai tuần sau (${formatted})`;

    results.push({ dateStr, label, formatted });
  }
  return results;
}
