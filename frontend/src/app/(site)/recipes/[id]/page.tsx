import { notFound } from 'next/navigation';

/**
 * Backend chưa có endpoint công thức nên trang chi tiết chưa có dữ liệu thật.
 * Không dùng dữ liệu mẫu — trả 404 cho tới khi API READY.
 */
export default function RecipeDetailPage() {
  notFound();
}
