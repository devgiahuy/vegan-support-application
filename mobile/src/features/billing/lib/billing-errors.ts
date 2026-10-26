import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
const messages: Record<string, string> = {
  BILLING_DISABLED: 'Thanh toán payOS chưa được bật.',
  BILLING_PRODUCT_UNAVAILABLE: 'Gói không còn được bán. Vui lòng tải lại danh sách.',
  BILLING_ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng của bạn.',
  BILLING_IDEMPOTENCY_CONFLICT: 'Yêu cầu này đã dùng cho gói khác. Hãy tải lại và chọn gói.',
  BILLING_PENDING_LIMIT: 'Bạn có nhiều đơn chờ thanh toán. Tiếp tục một đơn ở phần lịch sử.',
  BILLING_PROVIDER_UNAVAILABLE:
    'payOS chưa sẵn sàng hoặc đang mất kết nối. Đơn chưa được xác nhận; vui lòng thử lại sau.',
  BILLING_SIGNATURE_INVALID: 'Không xác minh được kết quả thanh toán. Chưa cấp quyền lợi.',
  BILLING_CHECKOUT_EXPIRED: 'Phiên thanh toán đã hết hạn. Quay lại danh sách gói và tạo đơn mới.',
  BILLING_PAYMENT_MISMATCH: 'Giao dịch không khớp đơn hàng. Chưa cấp quyền lợi.',
  BILLING_RECONCILE_COOLDOWN: 'Đợi ít nhất 30 giây giữa hai lần kiểm tra với payOS.',
  ENTITLEMENT_QUOTA_EXCEEDED: 'Bạn đã hết lượt. Mua thêm gói để tiếp tục.',
  PANTRY_CAPACITY_EXCEEDED: 'Tủ đồ ăn đã đầy. Xóa, gộp item hoặc mua thêm ô rồi xác nhận lại.',
  SCAN_RETRY_LIMIT_EXCEEDED: 'Đã hết số lần thử lại. Tạo tác vụ mới sẽ dùng một lượt khác.',
};
export function billingErrorMessage(error: unknown): string {
  return (
    messages[getApiErrorCode(error) ?? ''] ??
    getApiErrorMessage(error, 'Chưa tải được thông tin quyền lợi.')
  );
}
