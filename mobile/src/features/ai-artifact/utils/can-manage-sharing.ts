import type { User } from '@/features/auth/types/auth.model';
import type { AiArtifact } from '../types/ai-artifact.model';

/**
 * Bản ghi công khai không trả id chủ sở hữu, nên chỉ đoán được: tên tác giả trùng tên tài khoản,
 * hoặc tác giả ẩn danh (không loại trừ được). Chỉ để ẩn nút thừa; backend vẫn là nơi quyết định
 * và từ chối nếu người dùng không phải chủ sở hữu.
 */
export function canManageSharing(artifact: AiArtifact, user: User | null): boolean {
  if (!user) return false;
  if (artifact.authorAnonymous) return true;
  const name = user.displayName.trim().toLowerCase();
  return name.length > 0 && artifact.authorName.trim().toLowerCase() === name;
}
