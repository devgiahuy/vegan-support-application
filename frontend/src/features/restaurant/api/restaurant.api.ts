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
  Restaurant,
  RestaurantDiscoveryResult,
  RestaurantGeocodeResult,
  RestaurantSearchState,
  SubmitRestaurantInput,
} from '../types/restaurant.model';
import { restaurantMapper } from '../mappers/restaurant.mapper';

/**
 * Service API Quán Chay & Bản Đồ (Phase 24).
 *
 * Quy tắc bắt buộc:
 * - Generic của `api.get/post/patch` là **đúng shape body BE trả**.
 *   `RestaurantListResponseDto` đã là envelope `{success, data, meta}` nên dùng trực tiếp,
 *   KHÔNG bọc thêm `APIResponse<>` (docs/ARCHITECTURE.md §3).
 * - Hàm này KHÔNG trả DTO ra ngoài; luôn trả UI Model.
 * - Không log payload/tọa độ người dùng ra console.
 */
export const restaurantApi = {
  /**
   * `GET /restaurants/nearby` — quán lân cận theo tọa độ HOẶC theo khung vùng bản đồ.
   * `state.mode` quyết định gửi `lat`+`lng` hay `north`/`south`/`east`/`west`.
   */
  getNearby: async (state: RestaurantSearchState): Promise<RestaurantDiscoveryResult> => {
    const params = restaurantMapper.toDiscoveryParams({
      ...state,
      mode: state.mode === 'KEYWORD' ? 'NEARBY' : state.mode,
    });
    const response = await api.get<RestaurantListResponseDto>(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params,
      silent: true,
    });
    return restaurantMapper.toDiscoveryModel(response.data);
  },

  /**
   * `GET /restaurants/search` — tìm theo từ khóa món ăn/tên quán kèm bộ lọc nâng cao.
   * Backend yêu cầu `q` bắt buộc 2..160 ký tự; từ khóa không hợp lệ thì chuyển an toàn sang `nearby`.
   */
  search: async (state: RestaurantSearchState): Promise<RestaurantDiscoveryResult> => {
    if (state.query.trim().length < 2) {
      return restaurantApi.getNearby({ ...state, mode: 'NEARBY' });
    }
    const params = restaurantMapper.toDiscoveryParams({ ...state, mode: 'KEYWORD' });
    const response = await api.get<RestaurantListResponseDto>(API_ENDPOINTS.RESTAURANTS.SEARCH, {
      params,
      silent: true,
    });
    return restaurantMapper.toDiscoveryModel(response.data);
  },

  /** `GET /restaurants/:id` — chi tiết quán. */
  getDetail: async (id: string): Promise<Restaurant> => {
    const response = await api.get<RestaurantResponseDto>(API_ENDPOINTS.RESTAURANTS.DETAIL(id), {
      silent: true,
    });
    return restaurantMapper.toSingleModel(response.data);
  },

  /** `POST /restaurants` — đề xuất quán mới, ở trạng thái chờ duyệt. */
  submitRestaurant: async (input: SubmitRestaurantInput): Promise<Restaurant> => {
    const payload = restaurantMapper.toSubmitDto(input);
    const response = await api.post<SubmitRestaurantResponseDto>(
      API_ENDPOINTS.RESTAURANTS.SUBMIT,
      payload
    );
    return restaurantMapper.toSingleModel(response.data);
  },

  /**
   * `GET /location/geocode` — phân giải địa chỉ người dùng nhập.
   * Trả `isAvailable: false` khi không phân giải được; caller PHẢI hiển thị lỗi,
   * tuyệt đối không thay bằng tọa độ mặc định (FR-033).
   */
  geocode: async (address: string): Promise<RestaurantGeocodeResult> => {
    const response = await api.get<GeocodeResponseDto>(API_ENDPOINTS.LOCATION.GEOCODE, {
      params: { address: address.trim() },
      silent: true,
    });
    return restaurantMapper.toGeocodeResult(response.data);
  },

  /** `GET /admin/restaurants` — hàng chờ duyệt (ngoài phạm vi redesign trang khám phá). */
  getQueue: async (): Promise<PaginationResult<Restaurant>> => {
    const response = await api.get<AdminRestaurantListResponseDto>(
      API_ENDPOINTS.ADMIN_RESTAURANTS.LIST
    );
    return restaurantMapper.toQueueModel(response.data);
  },

  /** `PATCH /admin/restaurants/:id/review` — duyệt hoặc từ chối (ngoài phạm vi redesign). */
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
    return restaurantMapper.toReviewedModel(response.data);
  },
};
