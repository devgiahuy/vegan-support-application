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
import type { LocationQuery, Restaurant, SubmitRestaurantInput } from '../types/restaurant.model';
import { restaurantMapper } from '../mappers/restaurant.mapper';

/**
 * Service API Quán Chay & Bản Đồ (Phase 24 - 100% Live REST Endpoints).
 * Đã loại bỏ hoàn toàn mock/fixtures, gọi trực tiếp Backend và in chi tiết console.log.
 */
export const restaurantApi = {
  /**
   * `GET /restaurants/nearby` (UC-12 / FR-001)
   * Tìm kiếm quán chay theo tọa độ GPS và bán kính.
   */
  getNearby: async (query: LocationQuery): Promise<PaginationResult<Restaurant>> => {
    const params = restaurantMapper.toLocationQuery(query);
    console.log('[Restaurant API] 📡 Request GET /restaurants/nearby:', {
      endpoint: API_ENDPOINTS.RESTAURANTS.NEARBY,
      params,
    });

    const response = await api.get<RestaurantListResponseDto>(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params,
    });
    console.log('[Restaurant API] 📥 Response GET /restaurants/nearby raw DTO:', response.data);

    const result = restaurantMapper.toListModel(response.data);
    console.log('[Restaurant API] 🗺️ Mapped restaurants for Map & List:', {
      count: result.items.length,
      items: result.items,
      metadata: result.metadata,
    });
    return result;
  },

  /**
   * `GET /restaurants/search` (FR-003, FR-004)
   * Tìm kiếm theo từ khóa món ăn và áp dụng lọc cứng chế độ ăn.
   * Nếu query trống hoặc < 2 ký tự, an toàn chuyển tiếp sang getNearby.
   */
  search: async (query: LocationQuery): Promise<PaginationResult<Restaurant>> => {
    if (!query.query || query.query.trim().length < 2) {
      return restaurantApi.getNearby(query);
    }
    const params = restaurantMapper.toLocationQuery(query);
    console.log('[Restaurant API] 📡 Request GET /restaurants/search:', {
      endpoint: API_ENDPOINTS.RESTAURANTS.SEARCH,
      params,
    });

    const response = await api.get<RestaurantListResponseDto>(API_ENDPOINTS.RESTAURANTS.SEARCH, {
      params,
    });
    console.log('[Restaurant API] 📥 Response GET /restaurants/search raw DTO:', response.data);

    const result = restaurantMapper.toListModel(response.data);
    console.log('[Restaurant API] 🔍 Mapped search results for Map & List:', {
      count: result.items.length,
      items: result.items,
      metadata: result.metadata,
    });
    return result;
  },

  /**
   * `GET /restaurants/:id` (FR-007)
   * Chi tiết quán ăn chay.
   */
  getDetail: async (id: string): Promise<Restaurant> => {
    console.log('[Restaurant API] 📡 Request GET /restaurants/:id:', {
      id,
      endpoint: API_ENDPOINTS.RESTAURANTS.DETAIL(id),
    });

    const response = await api.get<RestaurantResponseDto>(API_ENDPOINTS.RESTAURANTS.DETAIL(id));
    console.log('[Restaurant API] 📥 Response GET /restaurants/:id raw DTO:', response.data);

    const result = restaurantMapper.toSingleModel(response.data);
    console.log('[Restaurant API] 🍴 Mapped detail restaurant:', result);
    return result;
  },

  /**
   * `POST /restaurants` (FR-009)
   * Thành viên đề xuất quán mới vào hàng chờ duyệt (PENDING).
   */
  submitRestaurant: async (input: SubmitRestaurantInput): Promise<Restaurant> => {
    const payload = restaurantMapper.toSubmitDto(input);
    console.log('[Restaurant API] 📡 Request POST /restaurants:', {
      endpoint: API_ENDPOINTS.RESTAURANTS.SUBMIT,
      payload,
    });

    const response = await api.post<SubmitRestaurantResponseDto>(
      API_ENDPOINTS.RESTAURANTS.SUBMIT,
      payload
    );
    console.log('[Restaurant API] 📥 Response POST /restaurants raw DTO:', response.data);

    const result = restaurantMapper.toSingleModel(response.data);
    console.log('[Restaurant API] 📝 Mapped submitted restaurant:', result);
    return result;
  },

  /**
   * `GET /location/geocode` (FR-002 / EC-01)
   * Chuyển đổi địa chỉ sang tọa độ địa lý.
   */
  geocode: async (
    address: string
  ): Promise<{ lat: number | null; lng: number | null; label: string }> => {
    console.log('[Restaurant API] 📡 Request GET /location/geocode:', {
      endpoint: API_ENDPOINTS.LOCATION.GEOCODE,
      address,
    });

    const response = await api.get<GeocodeResponseDto>(API_ENDPOINTS.LOCATION.GEOCODE, {
      params: { address: address.trim() },
    });
    console.log('[Restaurant API] 📥 Response GET /location/geocode raw DTO:', response.data);

    const mapped = restaurantMapper.toCoordinates(response.data);
    console.log('[Restaurant API] 📍 Mapped geocode coordinates:', mapped);
    return mapped;
  },

  /**
   * `GET /admin/restaurants` (FR-010)
   * Hàng chờ kiểm duyệt quán ăn dành cho Admin.
   */
  getQueue: async (): Promise<PaginationResult<Restaurant>> => {
    console.log('[Restaurant API] 📡 Request GET /admin/restaurants:', {
      endpoint: API_ENDPOINTS.ADMIN_RESTAURANTS.LIST,
    });

    const response = await api.get<AdminRestaurantListResponseDto>(
      API_ENDPOINTS.ADMIN_RESTAURANTS.LIST
    );
    console.log('[Restaurant API] 📥 Response GET /admin/restaurants raw DTO:', response.data);

    const result = restaurantMapper.toQueueModel(response.data);
    console.log('[Restaurant API] 📋 Mapped admin queue:', result);
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
    console.log('[Restaurant API] 📡 Request PATCH /admin/restaurants/:id/review:', {
      endpoint: API_ENDPOINTS.ADMIN_RESTAURANTS.REVIEW(id),
      id,
      payload,
    });

    const response = await api.patch<ReviewRestaurantResponseDto>(
      API_ENDPOINTS.ADMIN_RESTAURANTS.REVIEW(id),
      payload
    );
    console.log('[Restaurant API] 📥 Response PATCH review raw DTO:', response.data);

    const result = restaurantMapper.toReviewedModel(response.data);
    console.log('[Restaurant API] ⚖️ Mapped review decision result:', result);
    return result;
  },
};
