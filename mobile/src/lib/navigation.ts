import { router } from 'expo-router';

/**
 * Đóng modal (đăng nhập/đăng ký) và quay lại màn người dùng đang xem. Chỉ về trang chủ khi không còn
 * màn nào để quay lại (ví dụ mở thẳng bằng deep link).
 */
export function goBackOrHome(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
