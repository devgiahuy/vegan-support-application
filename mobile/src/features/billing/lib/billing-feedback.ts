import type { BillingOrder } from '@/features/billing/types/billing.model';

export interface BillingCheckFeedback {
  message: string;
  checkedAtLabel: string;
  isError: boolean;
  status?: BillingOrder['status'];
}

export function billingCheckMessage(order: BillingOrder): string {
  switch (order.status) {
    case 'PAID':
      return 'Thanh toán đã được xác nhận. Quyền lợi đã được cấp vào tài khoản.';
    case 'PENDING':
      return order.simulated
        ? 'Đơn vẫn chờ kết quả mô phỏng. Mở trang kiểm thử, chọn kết quả rồi tải lại trạng thái.'
        : 'Chưa nhận được xác nhận thanh toán từ VNPAY. Nếu đã thanh toán, hãy kiểm tra lại sau.';
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
