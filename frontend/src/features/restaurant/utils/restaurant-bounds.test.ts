import { describe, expect, it } from 'vitest';
import { areBoundsEqual, formatBoundsLabel, isBoundsUsable } from './restaurant-bounds';

const VALID = { north: 10.8, south: 10.7, east: 106.8, west: 106.7 };

describe('isBoundsUsable', () => {
  it('trả true khi đủ 4 mốc và north>south, east>west', () => {
    expect(isBoundsUsable(VALID)).toBe(true);
  });

  it('trả false khi null hoặc undefined', () => {
    expect(isBoundsUsable(null)).toBe(false);
    expect(isBoundsUsable(undefined)).toBe(false);
  });

  it('trả false khi thiếu một mốc — backend yêu cầu đủ cả bốn', () => {
    expect(isBoundsUsable({ north: 10.8, south: 10.7, east: 106.8 } as never)).toBe(false);
    expect(isBoundsUsable({ north: 10.8, east: 106.8, west: 106.7 } as never)).toBe(false);
  });

  it('trả false khi north <= south', () => {
    expect(isBoundsUsable({ north: 10.7, south: 10.7, east: 106.8, west: 106.7 })).toBe(false);
    expect(isBoundsUsable({ north: 10.6, south: 10.7, east: 106.8, west: 106.7 })).toBe(false);
  });

  it('trả false khi east <= west', () => {
    expect(isBoundsUsable({ north: 10.8, south: 10.7, east: 106.7, west: 106.7 })).toBe(false);
    expect(isBoundsUsable({ north: 10.8, south: 10.7, east: 106.6, west: 106.7 })).toBe(false);
  });

  it('trả false khi có giá trị NaN hoặc không phải số', () => {
    expect(isBoundsUsable({ north: NaN, south: 10.7, east: 106.8, west: 106.7 })).toBe(false);
    expect(isBoundsUsable({ ...VALID, north: '10.8' as never })).toBe(false);
  });
});

describe('areBoundsEqual', () => {
  it('trả true khi 4 mốc bằng nhau', () => {
    expect(areBoundsEqual(VALID, { ...VALID })).toBe(true);
  });

  it('trả false khi khác bất kỳ mốc nào', () => {
    expect(areBoundsEqual(VALID, { ...VALID, north: 10.9 })).toBe(false);
    expect(areBoundsEqual(VALID, { ...VALID, west: 106.6 })).toBe(false);
  });

  it('xử lý null an toàn', () => {
    expect(areBoundsEqual(null, null)).toBe(true);
    expect(areBoundsEqual(VALID, null)).toBe(false);
    expect(areBoundsEqual(null, VALID)).toBe(false);
  });
});

describe('formatBoundsLabel', () => {
  it('trả chuỗi tiếng Việt mô tả vùng xem', () => {
    const label = formatBoundsLabel(VALID);
    expect(label).toContain('Vùng đang xem');
    expect(label.length).toBeGreaterThan(0);
  });

  it('dùng dấu phẩy thập phân kiểu Việt Nam', () => {
    expect(
      formatBoundsLabel({ north: 10.81234, south: 10.71234, east: 106.8, west: 106.7 })
    ).toContain('10,8123');
  });

  it('trả chuỗi rỗng khi bounds không dùng được', () => {
    expect(formatBoundsLabel(null)).toBe('');
    expect(formatBoundsLabel({ north: 1, south: 2, east: 3, west: 4 })).toBe('');
  });
});
