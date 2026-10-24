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

export interface ReceiptImageIdentity {
  inputId: string;
  receiptNumber: string | null;
  merchantName: string | null;
  purchasedAt: string | null;
  currency: string | null;
  totalAmount: number | null;
}

export type ReceiptRelation = 'EXACT_DUPLICATE' | 'SAME_RECEIPT_REVIEW' | 'DISTINCT';

const DUPLICATE_NOTE =
  'Dòng này cũng xuất hiện trên ảnh khác của cùng hóa đơn; số lượng không cộng dồn hai lần.';

export function receiptLineKeys(line: ReceiptLineIdentity): string[] {
  if (line.quantity === null || !line.unit) return [];
  const total = line.lineTotal === null ? '' : line.lineTotal.toFixed(2);
  const text = normalizeVietnameseText(line.lineText);
  const quantityAndPrice = `${line.quantity}|${normalizeVietnameseText(line.unit)}|${total}`;
  const keys = text ? [`text:${text}|${quantityAndPrice}`] : [];
  const identity = line.ingredientId
    ? `ingredient:${line.ingredientId}`
    : `name:${line.normalizedName}`;
  keys.push(`amount:${identity}|${quantityAndPrice}`);
  return keys;
}

function sameLine(left: ReceiptLineIdentity, right: ReceiptLineIdentity): boolean {
  const rightKeys = new Set(receiptLineKeys(right));
  return receiptLineKeys(left).some((key) => rightKeys.has(key));
}

/** Multiset containment preserves two identical products printed twice on one receipt. */
export function containsReceiptLines(
  haystack: readonly ReceiptLineIdentity[],
  needles: readonly ReceiptLineIdentity[],
): boolean {
  const used = new Set<number>();
  return needles.every((needle) => {
    const index = haystack.findIndex(
      (line, position) => !used.has(position) && sameLine(line, needle),
    );
    if (index < 0) return false;
    used.add(index);
    return true;
  });
}

function normalized(value: string | null): string | null {
  return value ? normalizeVietnameseText(value) : null;
}

function normalizedReceiptNumber(value: string | null): string | null {
  return value ? normalizeVietnameseText(value).replace(/\s+/g, '') : null;
}

export function compareReceiptImages(
  left: ReceiptImageIdentity,
  leftLines: readonly ReceiptLineIdentity[],
  right: ReceiptImageIdentity,
  rightLines: readonly ReceiptLineIdentity[],
): ReceiptRelation {
  const merchant = normalized(left.merchantName);
  const date = left.purchasedAt;
  if (
    !merchant ||
    !date ||
    merchant !== normalized(right.merchantName) ||
    date !== right.purchasedAt
  )
    return 'DISTINCT';
  const leftNumber = normalizedReceiptNumber(left.receiptNumber);
  const rightNumber = normalizedReceiptNumber(right.receiptNumber);
  if (leftNumber && rightNumber && leftNumber !== rightNumber) return 'DISTINCT';
  const bothNumbered = Boolean(leftNumber && rightNumber);
  if (!bothNumbered && (
    left.totalAmount === null ||
    right.totalAmount === null ||
    left.totalAmount !== right.totalAmount ||
    !left.currency ||
    left.currency !== right.currency
  )) {
    return 'DISTINCT';
  }
  if (!leftLines.length || !rightLines.length)
    return bothNumbered ? 'SAME_RECEIPT_REVIEW' : 'DISTINCT';
  const exact =
    leftLines.length === rightLines.length && containsReceiptLines(leftLines, rightLines);
  if (exact) return 'EXACT_DUPLICATE';
  if (
    bothNumbered ||
    containsReceiptLines(leftLines, rightLines) ||
    containsReceiptLines(rightLines, leftLines)
  )
    return 'SAME_RECEIPT_REVIEW';
  return 'DISTINCT';
}

/** Merge only images identified as the same receipt. Different receipts keep every purchase line. */
export function mergeReceiptLines<
  T extends ReceiptLineIdentity & { uncertaintyNote: string | null },
>(
  existing: readonly ReceiptLineIdentity[],
  incoming: readonly T[],
  images: ReadonlyMap<string, ReceiptImageIdentity>,
): { kept: T[]; duplicates: number; reviewRequired: boolean; identityDecisionRequired: boolean } {
  const retained: ReceiptLineIdentity[] = [...existing];
  const kept: T[] = [];
  let duplicates = 0;
  let reviewRequired = false;
  let identityDecisionRequired = false;
  const inputIds = [...new Set(incoming.map((line) => line.inputId))];
  for (const inputId of inputIds) {
    const image = images.get(inputId);
    const lines = incoming.filter((line) => line.inputId === inputId);
    const priorIds = [...new Set(retained.map((line) => line.inputId))];
    const matchingPriorIds = image
      ? priorIds.filter((priorId) => {
          const priorImage = images.get(priorId);
          return (
            priorImage &&
            compareReceiptImages(
              priorImage,
              retained.filter((line) => line.inputId === priorId),
              image,
              lines,
            ) !== 'DISTINCT'
          );
        })
      : [];
    if (!matchingPriorIds.length) {
      kept.push(...lines);
      retained.push(...lines);
      continue;
    }
    const priorImage = images.get(matchingPriorIds[0]!)!;
    const relation = compareReceiptImages(
      priorImage,
      retained.filter((line) => line.inputId === matchingPriorIds[0]),
      image!,
      lines,
    );
    if (relation === 'SAME_RECEIPT_REVIEW') reviewRequired = true;
    if (relation === 'SAME_RECEIPT_REVIEW' && (!image!.receiptNumber || !priorImage.receiptNumber)) {
      identityDecisionRequired = true;
      kept.push(...lines);
      retained.push(...lines);
      continue;
    }
    const priorLines = retained.filter((line) => matchingPriorIds.includes(line.inputId));
    const matched = new Set<number>();
    for (const line of lines) {
      const matchIndex = priorLines.findIndex(
        (prior, position) => !matched.has(position) && sameLine(prior, line),
      );
      if (matchIndex >= 0) {
        matched.add(matchIndex);
        duplicates += 1;
        const target = priorLines[matchIndex];
        if (target && 'uncertaintyNote' in target) {
          const note = (target as T).uncertaintyNote;
          if (!note?.includes(DUPLICATE_NOTE))
            (target as T).uncertaintyNote = note ? `${note} ${DUPLICATE_NOTE}` : DUPLICATE_NOTE;
        }
      } else {
        kept.push(line);
        retained.push(line);
      }
    }
  }
  return { kept, duplicates, reviewRequired, identityDecisionRequired };
}
