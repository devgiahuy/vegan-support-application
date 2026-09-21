export function createChatIdempotencyKey(): string {
  return `mobile-chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
