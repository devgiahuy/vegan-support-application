/**
 * Sinh `idempotencyKey` cho generate/swap/delete thực đơn.
 * Key mới cho thao tác mới; retry cùng thao tác giữ nguyên key.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `mp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
