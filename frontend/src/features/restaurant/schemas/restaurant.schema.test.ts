import { describe, expect, it } from 'vitest';
import { submitRestaurantSchema } from './restaurant.schema';

describe('submitRestaurantSchema (FR-032..FR-036)', () => {
  it('chấp nhận tọa độ kiểu số hợp lệ', () => {
    const input = {
      name: 'Quán cơm chay Sen Vàng',
      address: '246 Võ Văn Hát, Phường Long Trường, Quận 9',
      latitude: 10.777012,
      longitude: 106.700123,
      categories: ['quán ăn'],
      dietTags: ['VEGAN'],
    };

    const parsed = submitRestaurantSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.latitude).toBeCloseTo(10.777012);
      expect(parsed.data.longitude).toBeCloseTo(106.700123);
      expect(parsed.data.name).toBe('Quán cơm chay Sen Vàng');
    }
  });

  it('báo lỗi khi tọa độ là NaN (giá trị của input rỗng khi có valueAsNumber)', () => {
    const input = {
      name: 'Quán cơm chay',
      address: '123 Đường Số 1, Quận 1',
      latitude: NaN,
      longitude: NaN,
    };

    const parsed = submitRestaurantSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const formatted = parsed.error.format();
      expect(formatted.latitude?._errors[0]).toBe('Vui lòng nhập vĩ độ của quán.');
      expect(formatted.longitude?._errors[0]).toBe('Vui lòng nhập kinh độ của quán.');
    }
  });

  it('từ chối tọa độ không phải số (ký tự chữ hoặc null)', () => {
    const input = {
      name: 'Quán cơm chay',
      address: '123 Đường Số 1, Quận 1',
      latitude: 'abc',
      longitude: null,
    };

    const parsed = submitRestaurantSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it('từ chối tọa độ nằm ngoài phạm vi địa lý (-90..90 và -180..180)', () => {
    const input = {
      name: 'Quán cơm chay',
      address: '123 Đường Số 1, Quận 1',
      latitude: 95,
      longitude: 200,
    };

    const parsed = submitRestaurantSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const formatted = parsed.error.format();
      expect(formatted.latitude?._errors).toContain('Vĩ độ phải từ -90 đến 90.');
      expect(formatted.longitude?._errors).toContain('Kinh độ phải từ -180 đến 180.');
    }
  });

  it('từ chối tọa độ bằng 0 (Null Island)', () => {
    const input = {
      name: 'Quán cơm chay',
      address: '123 Đường Số 1, Quận 1',
      latitude: 0,
      longitude: 0,
    };

    const parsed = submitRestaurantSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const formatted = parsed.error.format();
      expect(formatted.latitude?._errors).toContain('Vui lòng nhập vĩ độ khác 0.');
      expect(formatted.longitude?._errors).toContain('Vui lòng nhập kinh độ khác 0.');
    }
  });

  it('bắt buộc tên quán tối thiểu 2 ký tự và địa chỉ tối thiểu 5 ký tự', () => {
    const input = {
      name: 'A',
      address: '123',
      latitude: 10.5,
      longitude: 106.5,
    };

    const parsed = submitRestaurantSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const formatted = parsed.error.format();
      expect(formatted.name?._errors[0]).toBe('Vui lòng nhập tên quán (tối thiểu 2 ký tự).');
      expect(formatted.address?._errors[0]).toBe(
        'Vui lòng nhập địa chỉ đầy đủ (tối thiểu 5 ký tự).'
      );
    }
  });
});
