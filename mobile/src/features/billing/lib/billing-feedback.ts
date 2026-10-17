import type { BillingOrder } from '@/features/billing/types/billing.model';

export interface BillingCheckFeedback {
  message: string;
  checkedAtLabel: string;
  isError: boolean;
  status?: BillingOrder['status'];
}

export function billingCheckMessage(order: BillingOrder): string {
  if (order.provider !== 'payos' && order.status !== 'PAID')
    return 'Đây là đơn cũ trước khi chuyển sang payOS, chỉ dùng để xem lịch sử. Chọn gói để tạo một đơn payOS mới.';
  switch (order.status) {
    case 'PAID':
      return 'Thanh toán đã được xác nhận. Quyền lợi đã được cấp vào tài khoản.';
    case 'PENDING':
      return 'payOS chưa xác nhận đơn đã nhận đủ tiền. Nếu đã chuyển khoản, hãy kiểm tra lại sau ít nhất 30 giây.';
    case 'CANCELLED':
      return 'Đơn đã bị hủy. Bạn có thể tạo đơn mới để tiếp tục.';
    case 'FAILED':
      return 'Giao dịch thất bại. Đơn này chưa được cấp quyền lợi; bạn có thể tạo đơn mới.';
    case 'EXPIRED':
      return 'Đơn đã hết hạn. Tạo một đơn mới để tiếp tục thanh toán.';
    default:
      return 'Chưa xác định được trạng thái đơn. Vui lòng thử lại sau.';
  }
}

export function billingCheckTime(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}
