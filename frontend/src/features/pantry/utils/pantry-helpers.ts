import type { PantryItem } from '../types/pantry.model';

/**
 * Trả về khóa định danh duy nhất của nguyên liệu tủ bếp.
 * - Nguyên liệu chuẩn: 'canonical:<uuid>'
 * - Nguyên liệu tự do: 'unmatched:<lowercase-name>'
 */
export function getPantryItemIdentityKey(item: {
  ingredientId?: string | null;
  displayName: string;
}): string {
  if (item.ingredientId && item.ingredientId.trim()) {
    return `canonical:${item.ingredientId.trim().toLowerCase()}`;
  }
  return `unmatched:${item.displayName.trim().toLowerCase()}`;
}

export interface PantryDuplicateGroup {
  key: string;
  name: string;
  items: PantryItem[];
}

/**
 * Tìm các nhóm nguyên liệu trùng lặp trong danh sách tủ bếp (từ 2 mục trở lên).
 */
export function findPantryDuplicateGroups(items: PantryItem[]): PantryDuplicateGroup[] {
  const groupsMap = new Map<string, PantryItem[]>();

  for (const item of items) {
    const key = getPantryItemIdentityKey(item);
    const existing = groupsMap.get(key) || [];
    existing.push(item);
    groupsMap.set(key, existing);
  }

  const result: PantryDuplicateGroup[] = [];
  for (const [key, groupItems] of groupsMap.entries()) {
    if (groupItems.length >= 2) {
      result.push({
        key,
        name: groupItems[0].displayName,
        items: groupItems,
      });
    }
  }

  return result;
}

/**
 * Kiểm tra xem một nguyên liệu có mục trùng lặp khác trong tủ bếp hay không.
 */
export function isDuplicatePantryItem(item: PantryItem, allItems: PantryItem[]): boolean {
  const key = getPantryItemIdentityKey(item);
  let count = 0;
  for (const candidate of allItems) {
    if (getPantryItemIdentityKey(candidate) === key) {
      count++;
      if (count >= 2) return true;
    }
  }
  return false;
}

/**
 * Kiểm tra xem nguyên liệu có thuộc nhóm sắp hết hạn hay không theo chuẩn backend:
 * - An toàn (> 3 ngày / GOOD): không thuộc diện sắp hết hạn.
 * - Sắp hết hạn (<= 3 ngày / WARNING, ALERT, EXPIRED): thuộc diện sắp hết hạn.
 */
export function isExpiringSoon(item: PantryItem): boolean {
  if (item.daysRemaining !== null && item.daysRemaining !== undefined) {
    return item.daysRemaining <= 3;
  }
  return (
    item.expiryStatus === 'WARNING' ||
    item.expiryStatus === 'ALERT' ||
    item.expiryStatus === 'EXPIRED'
  );
}
