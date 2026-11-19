import { describe, it, expect } from 'vitest';
import {
  getPantryItemIdentityKey,
  findPantryDuplicateGroups,
  isDuplicatePantryItem,
  isExpiringSoon,
} from '../pantry-helpers';
import type { PantryItem } from '../../types/pantry.model';

const mockItem = (overrides: Partial<PantryItem>): PantryItem => ({
  id: 'id-1',
  ingredientId: null,
  ingredientName: null,
  unmatchedText: null,
  displayName: 'Nguyên liệu',
  isCanonical: false,
  quantity: 100,
  unit: 'g',
  formattedQuantity: '100 g',
  conversion: {
    status: 'UNKNOWN',
    statusLabel: 'Chưa quy đổi',
    normalizedGrams: null,
    formattedGrams: '',
    source: '',
    version: '',
    confidence: null,
  },
  source: 'MANUAL',
  sourceLabel: 'Nhập thủ công',
  confidence: 1,
  confirmationStatus: 'CONFIRMED',
  purchasedAt: null,
  openedAt: null,
  expiresAt: null,
  freshnessNote: null,
  version: 1,
  expiryStatus: 'SAFE',
  expiryBadgeVariant: 'secondary',
  expiryBadgeLabel: 'Còn hạn',
  daysRemaining: 10,
  ...overrides,
});

describe('pantry-helpers', () => {
  describe('getPantryItemIdentityKey', () => {
    it('returns canonical key when ingredientId is present', () => {
      const item = { ingredientId: 'UUID-1234', displayName: 'Cà chua chín' };
      expect(getPantryItemIdentityKey(item)).toBe('canonical:uuid-1234');
    });

    it('returns unmatched lowercase key when ingredientId is null or empty', () => {
      const item1 = { ingredientId: null, displayName: '  Rau Lan  ' };
      expect(getPantryItemIdentityKey(item1)).toBe('unmatched:rau lan');

      const item2 = { ingredientId: '', displayName: 'Rau Muống' };
      expect(getPantryItemIdentityKey(item2)).toBe('unmatched:rau muống');
    });
  });

  describe('findPantryDuplicateGroups', () => {
    it('finds duplicate groups with >= 2 items sharing same identity', () => {
      const items: PantryItem[] = [
        mockItem({ id: '1', ingredientId: 'uuid-tomato', displayName: 'Cà chua chín' }),
        mockItem({ id: '2', ingredientId: 'uuid-tomato', displayName: 'Cà chua chín' }),
        mockItem({ id: '3', ingredientId: null, displayName: 'Rau má' }),
        mockItem({ id: '4', ingredientId: 'uuid-tofu', displayName: 'Đậu hũ trắng' }),
        mockItem({ id: '5', ingredientId: 'uuid-tofu', displayName: 'Đậu hũ trắng' }),
      ];

      const groups = findPantryDuplicateGroups(items);
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe('Cà chua chín');
      expect(groups[0].items).toHaveLength(2);
      expect(groups[1].name).toBe('Đậu hũ trắng');
      expect(groups[1].items).toHaveLength(2);
    });

    it('returns empty array when there are no duplicates', () => {
      const items: PantryItem[] = [
        mockItem({ id: '1', ingredientId: 'uuid-1', displayName: 'Cà rốt' }),
        mockItem({ id: '2', ingredientId: 'uuid-2', displayName: 'Khoai tây' }),
      ];
      expect(findPantryDuplicateGroups(items)).toHaveLength(0);
    });
  });

  describe('isDuplicatePantryItem', () => {
    it('returns true if item has at least one duplicate in the list', () => {
      const itemA = mockItem({ id: '1', ingredientId: 'uuid-tomato', displayName: 'Cà chua' });
      const itemB = mockItem({ id: '2', ingredientId: 'uuid-tomato', displayName: 'Cà chua' });
      const itemC = mockItem({ id: '3', ingredientId: 'uuid-carrot', displayName: 'Cà rốt' });

      expect(isDuplicatePantryItem(itemA, [itemA, itemB, itemC])).toBe(true);
      expect(isDuplicatePantryItem(itemC, [itemA, itemB, itemC])).toBe(false);
    });
  });

  describe('isExpiringSoon', () => {
    it('returns true for items with 3 days remaining or less (WARNING, ALERT, EXPIRED)', () => {
      expect(isExpiringSoon(mockItem({ daysRemaining: 3, expiryStatus: 'WARNING' }))).toBe(true);
      expect(isExpiringSoon(mockItem({ daysRemaining: 2, expiryStatus: 'WARNING' }))).toBe(true);
      expect(isExpiringSoon(mockItem({ daysRemaining: 1, expiryStatus: 'ALERT' }))).toBe(true);
      expect(isExpiringSoon(mockItem({ daysRemaining: 0, expiryStatus: 'ALERT' }))).toBe(true);
      expect(isExpiringSoon(mockItem({ daysRemaining: -1, expiryStatus: 'EXPIRED' }))).toBe(true);
    });

    it('returns false for items with over 3 days remaining (GOOD / SAFE - green tag)', () => {
      expect(isExpiringSoon(mockItem({ daysRemaining: 4, expiryStatus: 'SAFE' }))).toBe(false);
      expect(isExpiringSoon(mockItem({ daysRemaining: 5, expiryStatus: 'SAFE' }))).toBe(false);
      expect(isExpiringSoon(mockItem({ daysRemaining: 7, expiryStatus: 'SAFE' }))).toBe(false);
      expect(isExpiringSoon(mockItem({ daysRemaining: 10, expiryStatus: 'SAFE' }))).toBe(false);
    });

    it('falls back to expiryStatus when daysRemaining is null', () => {
      expect(isExpiringSoon(mockItem({ daysRemaining: null, expiryStatus: 'WARNING' }))).toBe(true);
      expect(isExpiringSoon(mockItem({ daysRemaining: null, expiryStatus: 'ALERT' }))).toBe(true);
      expect(isExpiringSoon(mockItem({ daysRemaining: null, expiryStatus: 'EXPIRED' }))).toBe(true);
      expect(isExpiringSoon(mockItem({ daysRemaining: null, expiryStatus: 'SAFE' }))).toBe(false);
      expect(isExpiringSoon(mockItem({ daysRemaining: null, expiryStatus: 'UNKNOWN' }))).toBe(
        false
      );
    });
  });
});
