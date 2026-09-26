import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash } from 'node:crypto';

export const aiCorrelationContext = new AsyncLocalStorage<string>();

export function aiCorrelationId(): string {
  const value = aiCorrelationContext.getStore();
  if (!value) return 'background-job';
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value)
    ? value
    : createHash('sha256').update(value).digest('hex');
}
