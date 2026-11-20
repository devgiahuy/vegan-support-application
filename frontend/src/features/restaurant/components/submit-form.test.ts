import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../queries/restaurant.queries', () => ({
  useSubmitRestaurantMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useGeocodeMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

import { SubmitForm } from './submit-form';

describe('SubmitForm (FR-032..FR-036 Đề xuất quán)', () => {
  it('hiển thị đầy đủ các trường nhập liệu và nhãn rõ ràng', () => {
    const html = renderToStaticMarkup(createElement(SubmitForm));

    // Nhãn cơ bản
    expect(html).toContain('Tên quán ăn *');
    expect(html).toContain('Địa chỉ cụ thể *');

    // Tọa độ vị trí quán
    expect(html).toContain('Tọa độ quán *');
    expect(html).toContain('Vĩ độ (Latitude) *');
    expect(html).toContain('Kinh độ (Longitude) *');

    // Nút tiện ích hỗ trợ người dùng lấy tọa độ nhanh
    expect(html).toContain('Lấy từ địa chỉ');
    expect(html).toContain('Vị trí hiện tại');

    // Trường phái ăn chay
    expect(html).toContain('Trường phái ăn chay áp dụng');
    expect(html).toContain('Thuần chay (Vegan)');

    // Nút hành động
    expect(html).toContain('Gửi đề xuất quán');
    expect(html).toContain('Hủy');
  });

  it('không hiển thị thông báo lỗi màu đỏ khi mới mở form', () => {
    const html = renderToStaticMarkup(createElement(SubmitForm));

    // Ban đầu khi người dùng mới mở form, không được hiện chữ đỏ "Vui lòng nhập tọa độ quán trước khi gửi đề xuất."
    expect(html).not.toContain('Vui lòng nhập tọa độ hợp lệ của quán trước khi gửi đề xuất.');
    expect(html).not.toContain('text-destructive');
  });
});
