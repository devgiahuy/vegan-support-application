import { afterEach, describe, expect, it } from 'vitest';
import { __overrideActiveProviderForTests, restaurantApi } from '../api/restaurant.api';
import { restaurantMapper } from '../mappers/restaurant.mapper';
import { restaurantListFixture } from '../__fixtures__/restaurant-fixtures';
import type { LocationQuery, Restaurant } from '../types/restaurant.model';
import type { PlaceProvider } from './place-provider';

/**
 * Fake đứng chỗ Google provider: cùng dữ liệu fixture nhưng đảo thứ tự và
 * gắn nhãn GOOGLE + chêm 1 bản trùng — facade phải chuẩn hóa về cùng kết quả
 * (gom trùng + sắp khoảng cách + bọc trang), chứng minh SC-004: đổi nguồn
 * không đổi hành vi màn hình.
 */
class FakeGoogleProvider implements PlaceProvider {
  readonly name = 'google' as const;

  private base(): Restaurant[] {
    // Giữ nguyên nguồn fixture (INTERNAL), chỉ bản trùng chêm thêm mang nhãn
    // GOOGLE để kiểm chứng gom chéo nguồn.
    const items = restaurantMapper.toListModel({
      success: true,
      data: restaurantListFixture.data ?? [],
      meta: null,
    }).items;
    const dup = items[0] ? { ...items[0], source: 'GOOGLE', sourceLabel: 'Google' } : null;
    return [...items].reverse().concat(dup ? [dup] : []);
  }

  async searchNearby(): Promise<Restaurant[]> {
    return this.base();
  }

  async search(): Promise<Restaurant[]> {
    return this.base();
  }

  async getDetails(placeId: string): Promise<Restaurant | null> {
    return this.base().find((item) => item.id === placeId) ?? null;
  }

  async geocode(): Promise<{ lat: number | null; lng: number | null; label: string }> {
    return { lat: null, lng: null, label: '' };
  }
}

const query: LocationQuery = { lat: 10.775, lng: 106.701, radiusM: 3000, query: '' };

afterEach(() => {
  __overrideActiveProviderForTests(null);
});

describe('Provider swap (SC-004, FR-010)', () => {
  it('getNearby cho cùng tập đã gom + sắp dù nguồn đảo thứ tự và trùng lặp', async () => {
    const { MockPlaceProvider } = await import('./mock-place.provider');
    __overrideActiveProviderForTests(new MockPlaceProvider());
    const fromMock = await restaurantApi.getNearby(query);
    __overrideActiveProviderForTests(new FakeGoogleProvider());
    const fromFake = await restaurantApi.getNearby(query);

    expect(fromFake.items.map((item) => item.id)).toEqual(fromMock.items.map((item) => item.id));
    // Bản trùng gom thành 1, nhãn liệt kê đủ nguồn, bản chính ưu tiên cộng đồng.
    const merged = fromFake.items.filter((item) => item.sourceLabel.includes('·'));
    expect(merged.length).toBeGreaterThan(0);
    // Sắp theo khoảng cách tăng dần, null xuống cuối.
    const distances = fromFake.items.map((item) => item.distanceM ?? Number.POSITIVE_INFINITY);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it('search giữ hành vi bọc trang giống nhau mọi provider', async () => {
    const { MockPlaceProvider } = await import('./mock-place.provider');
    __overrideActiveProviderForTests(new MockPlaceProvider());
    const fromMock = await restaurantApi.search(query);
    __overrideActiveProviderForTests(new FakeGoogleProvider());
    const fromFake = await restaurantApi.search(query);

    expect(fromFake.metadata.totalItems).toBe(fromFake.items.length);
    // Search giữ thứ tự liên quan của provider nên chỉ assert cùng tập (đã gom),
    // không assert cùng thứ tự.
    expect([...fromFake.items.map((item) => item.id)].sort()).toEqual(
      [...fromMock.items.map((item) => item.id)].sort()
    );
  });
});
