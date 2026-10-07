import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  AdminRestaurantListResponseDto,
  GeocodeResponseDto,
  RestaurantListResponseDto,
  RestaurantResponseDto,
  ReviewRestaurantResponseDto,
  SubmitRestaurantResponseDto,
} from '../types/restaurant.dto';
import type {
  LocationQuery,
  Restaurant,
  RestaurantDiscovery,
  SubmitRestaurantInput,
} from '../types/restaurant.model';
import { restaurantMapper } from '../mappers/restaurant.mapper';

/**
 * Service API Quán Chay & Bản Đồ (Phase 24 - 100% Live REST Endpoints).
 * Đã loại bỏ hoàn toàn mock/fixtures, gọi Backend qua DTO/Mapper.
 */
export const restaurantApi = {
  /**
   * `GET /restaurants/nearby` (UC-12 / FR-001)
   * Tìm kiếm quán chay theo tọa độ GPS và bán kính.
   */
  getNearby: async (query: LocationQuery, signal?: AbortSignal): Promise<RestaurantDiscovery> => {
    const params = restaurantMapper.toLocationQuery(query);

    const response = await api.get<RestaurantListResponseDto>(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params,
      signal,
    });

    const result = restaurantMapper.toListModel(response.data);
    return result;
  },

  /**
   * `GET /restaurants/search` (FR-003, FR-004)
   * Tìm kiếm theo từ khóa món ăn và áp dụng lọc cứng chế độ ăn.
   * Nếu query trống hoặc < 2 ký tự, an toàn chuyển tiếp sang getNearby.
   */
  search: async (query: LocationQuery, signal?: AbortSignal): Promise<RestaurantDiscovery> => {
    if (!query.query || query.query.trim().length < 2) {
      return restaurantApi.getNearby(query, signal);
    }
    const params = restaurantMapper.toLocationQuery(query);

    const response = await api.get<RestaurantListResponseDto>(API_ENDPOINTS.RESTAURANTS.SEARCH, {
      params,
      signal,
    });

    const result = restaurantMapper.toListModel(response.data);
    return result;
  },

  /**
   * `GET /restaurants/:id` (FR-007)
   * Chi tiết quán ăn chay.
   */
  getDetail: async (id: string): Promise<Restaurant> => {
    const response = await api.get<RestaurantResponseDto>(API_ENDPOINTS.RESTAURANTS.DETAIL(id));

    const result = restaurantMapper.toSingleModel(response.data);
    return result;
  },

  /**
   * `POST /restaurants` (FR-009)
   * Thành viên đề xuất quán mới vào hàng chờ duyệt (PENDING).
   */
  submitRestaurant: async (input: SubmitRestaurantInput): Promise<Restaurant> => {
    const payload = restaurantMapper.toSubmitDto(input);

    const response = await api.post<SubmitRestaurantResponseDto>(
      API_ENDPOINTS.RESTAURANTS.SUBMIT,
      payload
    );

    const result = restaurantMapper.toSingleModel(response.data);
    return result;
  },

  /**
   * `GET /location/geocode` (FR-002 / EC-01)
   * Chuyển đổi địa chỉ sang tọa độ địa lý.
   */
  geocode: async (
    address: string
  ): Promise<{ lat: number | null; lng: number | null; label: string }> => {
    const response = await api.get<GeocodeResponseDto>(API_ENDPOINTS.LOCATION.GEOCODE, {
      params: { address: address.trim() },
    });

    const mapped = restaurantMapper.toCoordinates(response.data);
    return mapped;
  },

  /**
   * `GET /admin/restaurants` (FR-010)
   * Hàng chờ kiểm duyệt quán ăn dành cho Admin.
   */
  getQueue: async (): Promise<PaginationResult<Restaurant>> => {
    const response = await api.get<AdminRestaurantListResponseDto>(
      API_ENDPOINTS.ADMIN_RESTAURANTS.LIST
    );

    const result = restaurantMapper.toQueueModel(response.data);
    return result;
  },

  /**
   * `PATCH /admin/restaurants/:id/review` (FR-010)
   * Phê duyệt hoặc từ chối quán ăn đề xuất kèm lý do.
   */
  reviewRestaurant: async (
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string
  ): Promise<Restaurant> => {
    const payload = restaurantMapper.toReviewDto(decision, reason);

    const response = await api.patch<ReviewRestaurantResponseDto>(
      API_ENDPOINTS.ADMIN_RESTAURANTS.REVIEW(id),
      payload
    );

    const result = restaurantMapper.toReviewedModel(response.data);
    return result;
  },
};
