import { describe, it, expect } from 'vitest';
import { pantryMapper } from '../pantry.mapper';
import type {
  PantryItemDto,
  PantryAdjustmentDto,
  PantryMergePreviewDto,
} from '../../types/pantry.dto';

describe('PantryMapper Unit Tests', () => {
  describe('toModel', () => {
    it('handles null and undefined input gracefully with defaults', () => {
      const model = pantryMapper.toModel(null);
      expect(model.id).toBe('');
      expect(model.displayName).toBe('Nguyên liệu chưa đặt tên');
      expect(model.quantity).toBe(0);
      expect(model.expiryStatus).toBe('UNKNOWN');
      expect(model.conversion.status).toBe('UNKNOWN');
    });

    it('maps canonical ingredient correctly with exact conversion', () => {
      const dto: PantryItemDto = {
        id: 'item-1',
        ingredient: { id: 'ing-1', name: 'Đậu hũ non' },
        unmatchedText: null,
        quantity: 300,
        unit: 'g',
        conversion: {
          status: 'EXACT',
          normalizedGrams: 300,
          source: 'SYSTEM',
          version: '1.0',
          confidence: 1,
        },
        source: 'MANUAL',
        confidence: 1,
        confirmationStatus: 'CONFIRMED',
        purchasedAt: '2026-09-20',
        openedAt: '2026-09-21',
        expiresAt: '2026-09-30',
        freshnessNote: 'Tươi ngon',
        version: 2,
      };

      const model = pantryMapper.toModel(dto);
      expect(model.id).toBe('item-1');
      expect(model.ingredientId).toBe('ing-1');
      expect(model.displayName).toBe('Đậu hũ non');
      expect(model.isCanonical).toBe(true);
      expect(model.formattedQuantity).toBe('300 g');
      expect(model.conversion.formattedGrams).toBe('≈ 300g');
      expect(model.conversion.statusLabel).toBe('Quy đổi chính xác');
      expect(model.sourceLabel).toBe('Nhập thủ công');
      expect(model.version).toBe(2);
    });

    it('maps unmatched free-text ingredient when ingredient is null', () => {
      const dto: PantryItemDto = {
        id: 'item-2',
        ingredient: null,
        unmatchedText: 'Rau rừng gia lai',
        quantity: 2,
        unit: 'bó',
        conversion: {
          status: 'UNKNOWN',
          normalizedGrams: null,
          source: null,
          version: null,
          confidence: null,
        },
        source: 'MANUAL',
        confidence: 0.8,
        confirmationStatus: 'CONFIRMED',
        purchasedAt: null,
        openedAt: null,
        expiresAt: null,
        freshnessNote: null,
        version: 1,
      };

      const model = pantryMapper.toModel(dto);
      expect(model.isCanonical).toBe(false);
      expect(model.ingredientId).toBeNull();
      expect(model.displayName).toBe('Rau rừng gia lai');
      expect(model.conversion.formattedGrams).toBe('');
      expect(model.expiryStatus).toBe('UNKNOWN');
      expect(model.expiryBadgeLabel).toBe('Không có hạn');
    });

    it('calculates expiry status correctly for expired items', () => {
      const dto: PantryItemDto = {
        id: 'item-expired',
        ingredient: { id: 'ing-2', name: 'Sữa chua' },
        unmatchedText: null,
        quantity: 1,
        unit: 'hộp',
        conversion: {
          status: 'EXACT',
          normalizedGrams: 100,
          source: 'TEST',
          version: '1',
          confidence: 1,
        },
        source: 'MANUAL',
        confidence: 1,
        confirmationStatus: 'CONFIRMED',
        purchasedAt: null,
        openedAt: null,
        expiresAt: '2026-09-01', // quá hạn so với 2026-09-26
        freshnessNote: null,
        version: 1,
      };

      const model = pantryMapper.toModel(dto);
      expect(model.expiryStatus).toBe('EXPIRED');
      expect(model.expiryBadgeVariant).toBe('destructive');
      expect(model.expiryBadgeLabel).toContain('Đã quá hạn');
    });

    it('calculates expiry status correctly for items expiring soon (<= 3 days)', () => {
      const today = new Date();
      const in2Days = new Date(today);
      in2Days.setDate(today.getDate() + 2);
      const expiresAt = in2Days.toISOString().split('T')[0];

      const dto: PantryItemDto = {
        id: 'item-warning',
        ingredient: { id: 'ing-3', name: 'Nấm rơm' },
        unmatchedText: null,
        quantity: 200,
        unit: 'g',
        conversion: {
          status: 'EXACT',
          normalizedGrams: 200,
          source: 'TEST',
          version: '1',
          confidence: 1,
        },
        source: 'MANUAL',
        confidence: 1,
        confirmationStatus: 'CONFIRMED',
        purchasedAt: null,
        openedAt: null,
        expiresAt,
        freshnessNote: null,
        version: 1,
      };

      const model = pantryMapper.toModel(dto);
      expect(model.expiryStatus).toBe('WARNING');
      expect(model.expiryBadgeVariant).toBe('secondary');
      expect(model.daysRemaining).toBe(2);
    });

    it('calculates expiry status correctly for safe items (> 3 days)', () => {
      const today = new Date();
      const in10Days = new Date(today);
      in10Days.setDate(today.getDate() + 10);
      const expiresAt = in10Days.toISOString().split('T')[0];

      const dto: PantryItemDto = {
        id: 'item-safe',
        ingredient: { id: 'ing-4', name: 'Gạo lứt' },
        unmatchedText: null,
        quantity: 5,
        unit: 'kg',
        conversion: {
          status: 'EXACT',
          normalizedGrams: 5000,
          source: 'TEST',
          version: '1',
          confidence: 1,
        },
        source: 'MANUAL',
        confidence: 1,
        confirmationStatus: 'CONFIRMED',
        purchasedAt: null,
        openedAt: null,
        expiresAt,
        freshnessNote: null,
        version: 1,
      };

      const model = pantryMapper.toModel(dto);
      expect(model.expiryStatus).toBe('SAFE');
      expect(model.expiryBadgeVariant).toBe('default');
      expect(model.daysRemaining).toBe(10);
    });
  });

  describe('toAdjustmentModel', () => {
    it('maps CONSUME adjustment with delta and balance', () => {
      const dto: PantryAdjustmentDto = {
        id: 'adj-1',
        type: 'CONSUME',
        input: { quantity: 100, unit: 'g' },
        appliedDelta: { quantity: -100, normalizedGrams: -100 },
        balance: {
          beforeQuantity: 500,
          afterQuantity: 400,
          beforeGrams: 500,
          afterGrams: 400,
        },
        versionBefore: 1,
        versionAfter: 2,
        reason: 'Nấu súp bí đỏ',
        mergedFromItemId: null,
        createdAt: '2026-09-26T10:00:00Z',
      };

      const model = pantryMapper.toAdjustmentModel(dto);
      expect(model.id).toBe('adj-1');
      expect(model.type).toBe('CONSUME');
      expect(model.typeLabel).toBe('Tiêu hao');
      expect(model.formattedInput).toBe('100 g');
      expect(model.formattedDelta).toBe('-100 g');
      expect(model.formattedBalance).toBe('500 → 400 g');
      expect(model.reason).toBe('Nấu súp bí đỏ');
      expect(model.versionBefore).toBe(1);
      expect(model.versionAfter).toBe(2);
    });

    it('maps RESTORE adjustment correctly', () => {
      const dto: PantryAdjustmentDto = {
        id: 'adj-2',
        type: 'RESTORE',
        input: { quantity: 50, unit: 'g' },
        appliedDelta: { quantity: 50, normalizedGrams: 50 },
        balance: {
          beforeQuantity: 400,
          afterQuantity: 450,
          beforeGrams: 400,
          afterGrams: 450,
        },
        versionBefore: 2,
        versionAfter: 3,
        reason: 'Thừa nguyên liệu hoàn lại',
        mergedFromItemId: null,
        createdAt: '2026-09-26T11:00:00Z',
      };

      const model = pantryMapper.toAdjustmentModel(dto);
      expect(model.type).toBe('RESTORE');
      expect(model.typeLabel).toBe('Hoàn trả');
      expect(model.formattedDelta).toBe('+50 g');
    });

    it('maps ADJUST delta adjustment correctly', () => {
      const dto: PantryAdjustmentDto = {
        id: 'adj-3',
        type: 'ADJUST',
        input: { quantity: -20, unit: 'g' },
        appliedDelta: { quantity: -20, normalizedGrams: -20 },
        balance: {
          beforeQuantity: 450,
          afterQuantity: 430,
          beforeGrams: 450,
          afterGrams: 430,
        },
        versionBefore: 3,
        versionAfter: 4,
        reason: 'Cân lại hao hụt bảo quản',
        mergedFromItemId: null,
        createdAt: '2026-09-26T12:00:00Z',
      };

      const model = pantryMapper.toAdjustmentModel(dto);
      expect(model.type).toBe('ADJUST');
      expect(model.typeLabel).toBe('Điều chỉnh số lượng');
      expect(model.reason).toBe('Cân lại hao hụt bảo quản');
    });
  });

  describe('toMergePreviewModel', () => {
    it('maps merge preview result and warnings accurately', () => {
      const dto: PantryMergePreviewDto = {
        canMerge: true,
        identity: { ingredientId: 'ing-1', label: 'Đậu hũ non' },
        targetItemId: 'item-1',
        itemCount: 2,
        result: {
          quantity: 600,
          unit: 'g',
          normalizedGrams: 600,
          conversionStatus: 'EXACT',
        },
        warnings: ['Ngày hết hạn sẽ lấy theo mốc gần nhất'],
      };

      const model = pantryMapper.toMergePreviewModel(dto);
      expect(model.canMerge).toBe(true);
      expect(model.label).toBe('Đậu hũ non');
      expect(model.targetItemId).toBe('item-1');
      expect(model.itemCount).toBe(2);
      expect(model.formattedResultQuantity).toBe('600 g');
      expect(model.conversionStatus).toBe('EXACT');
      expect(model.warnings).toHaveLength(1);
    });
  });

  describe('DTO creation helpers', () => {
    it('creates CreatePantryItemReqDto for canonical item', () => {
      const dto = pantryMapper.toCreateDto(
        {
          isCanonical: true,
          ingredientId: 'ing-1',
          quantity: 250,
          unit: 'g',
          confidence: 1,
          freshnessNote: 'Mới mua',
        },
        'key-12345678'
      );

      expect(dto.ingredientId).toBe('ing-1');
      expect(dto.unmatchedText).toBeUndefined();
      expect(dto.quantity).toBe(250);
      expect(dto.idempotencyKey).toBe('key-12345678');
    });

    it('creates CreatePantryItemReqDto for unmatched free-text item', () => {
      const dto = pantryMapper.toCreateDto(
        {
          isCanonical: false,
          unmatchedText: 'Nấm linh chi đỏ',
          quantity: 100,
          unit: 'g',
          confidence: 0.9,
        },
        'key-87654321'
      );

      expect(dto.ingredientId).toBeUndefined();
      expect(dto.unmatchedText).toBe('Nấm linh chi đỏ');
      expect(dto.quantity).toBe(100);
    });

    it('creates CreatePantryAdjustmentReqDto for all types', () => {
      const consumeDto = pantryMapper.toAdjustmentCreateDto(
        {
          type: 'CONSUME',
          quantity: 50,
          unit: 'g',
          expectedVersion: 1,
          reason: 'Bữa tối',
        },
        'idem-consume-1'
      );
      expect(consumeDto.type).toBe('CONSUME');

      const adjustDto = pantryMapper.toAdjustmentCreateDto(
        {
          type: 'ADJUST',
          deltaQuantity: -10,
          unit: 'g',
          expectedVersion: 2,
          reason: 'Hao hụt',
        },
        'idem-adjust-1'
      );
      expect(adjustDto.type).toBe('ADJUST');
      if (adjustDto.type === 'ADJUST') {
        expect(adjustDto.deltaQuantity).toBe(-10);
      }
    });

    it('creates MergePantryItemsReqDto correctly', () => {
      const mergeDto = pantryMapper.toMergeDto(
        'target-id',
        [
          { id: 'target-id', expectedVersion: 2 },
          { id: 'source-id', expectedVersion: 1 },
        ],
        'idem-merge-1'
      );

      expect(mergeDto.targetItemId).toBe('target-id');
      expect(mergeDto.items).toHaveLength(2);
      expect(mergeDto.idempotencyKey).toBe('idem-merge-1');
    });
  });
});
