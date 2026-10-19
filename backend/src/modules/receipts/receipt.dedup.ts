import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';

export interface ReceiptLineIdentity {
  inputId: string;
  ingredientId: string | null;
  lineText: string;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  lineTotal: number | null;
}

const DUPLICATE_NOTE =
  'Dòng này xuất hiện ở nhiều ảnh nên đã được gộp thành một, không cộng dồn. Vui lòng kiểm tra trước khi xác nhận.';

/**
 * Keys that identify the same printed receipt line across photos. The raw line text is the most
 * stable signal because the extraction model may translate the same line differently on each run
 * (for example "Cucumber 3.80" as "Dưa leo" once and "Dưa chuột" the next time).
 */
export function receiptLineKeys(line: ReceiptLineIdentity): string[] {
  const total = line.lineTotal === null ? '' : line.lineTotal.toFixed(2);
  const keys: string[] = [];
  const text = normalizeVietnameseText(line.lineText);
  if (text) keys.push(`text:${text}|${total}`);
  if (line.lineTotal !== null) {
    const identity = line.ingredientId ? `ingredient:${line.ingredientId}` : `name:${line.normalizedName}`;
    keys.push(`amount:${identity}|${total}|${line.quantity ?? ''}|${line.unit?.toLowerCase() ?? ''}`);
  }
  return keys;
}

/**
 * Drops incoming lines that repeat a line already read from a different image (either an earlier
 * incoming line or an `existing` stored candidate). Lines repeated inside the same image are kept
 * because a receipt can legitimately list one product twice. Quantities are never summed.
 */
export function mergeReceiptLines<
  T extends ReceiptLineIdentity & { uncertaintyNote: string | null },
>(existing: readonly ReceiptLineIdentity[], incoming: readonly T[]): { kept: T[]; duplicates: number } {
  const seen = new Map<string, { inputId: string; target: T | null }>();
  for (const line of existing)
    for (const key of receiptLineKeys(line))
      if (!seen.has(key)) seen.set(key, { inputId: line.inputId, target: null });
  const kept: T[] = [];
  let duplicates = 0;
  for (const line of incoming) {
    const keys = receiptLineKeys(line);
    const match = keys
      .map((key) => seen.get(key))
      .find((entry) => entry !== undefined && entry.inputId !== line.inputId);
    if (match) {
      duplicates += 1;
      if (match.target && !match.target.uncertaintyNote?.includes(DUPLICATE_NOTE))
        match.target.uncertaintyNote = match.target.uncertaintyNote
          ? `${match.target.uncertaintyNote} ${DUPLICATE_NOTE}`
          : DUPLICATE_NOTE;
      continue;
    }
    kept.push(line);
    for (const key of keys) if (!seen.has(key)) seen.set(key, { inputId: line.inputId, target: line });
  }
  return { kept, duplicates };
}
