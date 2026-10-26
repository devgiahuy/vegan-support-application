import { redirect } from 'next/navigation';

/**
 * Trang Khám phá tri thức AI đã được ẩn trên giao diện người dùng.
 * Tự động chuyển hướng toàn bộ truy cập về trang Trợ lý AI (/assistant).
 */
export default function PublicAssistantPage() {
  redirect('/assistant');
}
