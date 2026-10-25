export interface TrackedUserPost {
  id: string;
  type: 'BLOG' | 'RECIPE' | 'VIDEO';
  title?: string;
  createdAt: string;
}

const STORAGE_PREFIX = 'veggie:my-posts:';

/**
 * Lấy danh sách ID các bài viết mà tài khoản này đã từng tạo trên trình duyệt
 * (bao gồm cả DRAFT và PENDING_REVIEW chưa xuất bản công khai).
 */
export function getTrackedUserPosts(userId?: string | null): TrackedUserPost[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackedUserPost[]) : [];
  } catch {
    return [];
  }
}

/**
 * Lưu bài viết mới tạo vào danh sách quản lý cá nhân cục bộ.
 */
export function addTrackedUserPost(userId: string | null | undefined, post: TrackedUserPost): void {
  if (typeof window === 'undefined' || !userId || !post?.id) return;
  try {
    const existing = getTrackedUserPosts(userId);
    const filtered = existing.filter((p) => p.id !== post.id);
    const updated = [post, ...filtered].slice(0, 50); // Tối đa 50 bài gần nhất
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch {
    // Không làm gián đoạn luồng người dùng nếu quota localStorage đầy
  }
}

/**
 * Xóa một bài viết khỏi danh sách quản lý cá nhân cục bộ khi người dùng xóa.
 */
export function removeTrackedUserPost(userId: string | null | undefined, postId: string): void {
  if (typeof window === 'undefined' || !userId || !postId) return;
  try {
    const existing = getTrackedUserPosts(userId);
    const updated = existing.filter((p) => p.id !== postId);
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}
