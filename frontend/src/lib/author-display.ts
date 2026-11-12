import type { User } from '@/features/auth/types/auth.model';

export interface AuthorDisplaySource {
  id?: string | null;
  name?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
}

export interface ResolvedAuthorDisplay {
  name: string;
  avatarUrl: string;
  initials: string;
  isCurrentUser: boolean;
}

/**
 * Tạo chữ cái đại diện (initials) đồng nhất với `AuthMapper`:
 * 1 từ -> tối đa 2 ký tự đầu; nhiều từ -> chữ cái đầu của từ đầu và từ cuối.
 */
export function getAuthorInitials(displayName: string, fallback = '?'): string {
  const trimmed = displayName.trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Chuẩn hóa thông tin tác giả để hiển thị trên trang chi tiết, thẻ nội dung và bình luận.
 * Khi người dùng đang đăng nhập chính là tác giả, ưu tiên trực tiếp dữ liệu từ
 * phiên tài khoản hiện tại (bao gồm trường hợp vừa xóa ảnh -> chuỗi rỗng) để
 * ảnh đại diện luôn đồng bộ tức thì với `/profile` và header.
 */
export function resolveAuthorDisplay(
  author: AuthorDisplaySource | null | undefined,
  currentUser: User | null | undefined,
  options?: {
    fallbackName?: string;
    fallbackInitials?: string;
    assumeOwnerIfMeId?: boolean;
  }
): ResolvedAuthorDisplay {
  const fallbackName = options?.fallbackName ?? 'Tác giả VeggieConnect';
  const fallbackInitials = options?.fallbackInitials ?? '?';
  const rawName = (author?.displayName ?? author?.name ?? '').trim();
  const baseName = rawName || fallbackName;
  const baseAvatar = (author?.avatarUrl ?? author?.avatar ?? '').trim();

  const authorId = (author?.id ?? '').trim();
  const isCurrentUser = Boolean(
    currentUser?.id &&
    authorId &&
    (authorId === currentUser.id || (options?.assumeOwnerIfMeId && authorId === 'me'))
  );

  if (isCurrentUser && currentUser) {
    const syncedName = currentUser.displayName.trim() || baseName;
    return {
      name: syncedName,
      avatarUrl: (currentUser.avatarUrl ?? '').trim(),
      initials: currentUser.initials || getAuthorInitials(syncedName, fallbackInitials),
      isCurrentUser: true,
    };
  }

  return {
    name: baseName,
    avatarUrl: baseAvatar,
    initials: getAuthorInitials(baseName, fallbackInitials),
    isCurrentUser: false,
  };
}
