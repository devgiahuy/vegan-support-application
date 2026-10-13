export { cn } from 'cn';

/** Giá gói thanh toán hiển thị theo VND; giữ định dạng tại mapper. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number.isFinite(value) ? value : 0);
}

/** Định dạng ngày giờ chuẩn thân thiện (đồng bộ `frontend/src/lib/utils.ts`). */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
}
