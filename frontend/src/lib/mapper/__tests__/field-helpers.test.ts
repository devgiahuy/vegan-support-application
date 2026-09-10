import { describe, expect, it } from 'vitest';
import {
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper/field-helpers';
import { StatusEnum } from '@/common/enums';

describe('pickField', () => {
  it('ưu tiên key đứng trước trong candidateKeys', () => {
    expect(pickField({ a: 1, b: 2 }, ['a', 'b'], 0)).toBe(1);
    expect(pickField({ b: 2 }, ['a', 'b'], 0)).toBe(2);
  });

  it('hỗ trợ dot-notation và trả fallback khi thiếu', () => {
    expect(
      pickField({ category: { name: 'Áo' } }, ['category.name', 'category_name'], 'Khác')
    ).toBe('Áo');
    expect(pickField({ category: null }, ['category.name'], 'Khác')).toBe('Khác');
    expect(pickField(null, ['a'], 'fb')).toBe('fb');
  });

  it('bỏ qua null/undefined và lấy giá trị hợp lệ tiếp theo', () => {
    expect(pickField({ a: null, b: 'ok' }, ['a', 'b'], 'fb')).toBe('ok');
    expect(pickField({ a: undefined }, ['a'], 'fb')).toBe('fb');
  });
});

describe('safeNumber', () => {
  it('ép chuỗi số, bỏ dấu phẩy, fallback khi NaN/null', () => {
    expect(safeNumber('380000')).toBe(380000);
    expect(safeNumber('1,200')).toBe(1200);
    expect(safeNumber(550000)).toBe(550000);
    expect(safeNumber('abc', 5)).toBe(5);
    expect(safeNumber(null, 7)).toBe(7);
    expect(safeNumber(Number.NaN, 3)).toBe(3);
  });
});

describe('safeString', () => {
  it('trim chuỗi, ép số, fallback khi null', () => {
    expect(safeString('  Áo  ')).toBe('Áo');
    expect(safeString(123)).toBe('123');
    expect(safeString(null, 'fb')).toBe('fb');
  });
});

describe('safeArray', () => {
  it('trả [] khi null/undefined, map từng phần tử khi có mapper', () => {
    expect(safeArray(null)).toEqual([]);
    expect(safeArray(undefined)).toEqual([]);
    expect(safeArray([' a ', 'b'], (t) => safeString(t))).toEqual(['a', 'b']);
  });
});

describe('safeEnum', () => {
  it('map chuỗi ACTIVE (không phân biệt hoa thường) và fallback khi lạ', () => {
    expect(safeEnum('ACTIVE', StatusEnum, StatusEnum.PENDING)).toBe(StatusEnum.ACTIVE);
    expect(safeEnum('active', StatusEnum, StatusEnum.PENDING)).toBe(StatusEnum.ACTIVE);
    expect(safeEnum(1, StatusEnum, StatusEnum.PENDING)).toBe(StatusEnum.ACTIVE);
    expect(safeEnum('1', StatusEnum, StatusEnum.PENDING)).toBe(StatusEnum.ACTIVE);
    expect(safeEnum('LA', StatusEnum, StatusEnum.PENDING)).toBe(StatusEnum.PENDING);
  });
});

describe('safeDate', () => {
  it('parse chuỗi ISO, trả null khi invalid', () => {
    expect(safeDate('2026-03-01T08:30:00Z')).toBeInstanceOf(Date);
    expect(safeDate('not-a-date')).toBeNull();
    expect(safeDate(null)).toBeNull();
  });
});
