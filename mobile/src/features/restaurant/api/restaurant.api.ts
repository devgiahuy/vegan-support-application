import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  LocationGeocodeResponseDto,
  RestaurantDiscoveryResponseDto,
  RestaurantPlaceResponseDto,
  RestaurantRecordListResponseDto,
  RestaurantRecordResponseDto,
} from '../types/restaurant.dto';
import type {
  GeocodeLocation,
  LocationQuery,
  Restaurant,
  RestaurantDiscoveryResult,
  SubmitRestaurantInput,
  SubmittedRestaurant,
  SubmittedRestaurantListResult,
} from '../types/restaurant.model';
import { hasSearchKeyword, restaurantMapper } from '../mappers/restaurant.mapper';

/** Nhà cung cấp bản đồ ngoài có thể trả chậm ở lần gọi đầu, nên cho phép chờ lâu hơn mặc định 15 giây. */
const DISCOVERY_TIMEOUT_MS = 45000;

/**
 * API quán chay & vị trí (live, backend Phase 24). Vị trí chỉ gửi theo từng yêu cầu và không được
 * backend lưu (`locationStored: false`). Vị trí lấy từ thiết bị luôn kèm `locationConsent=true`.
 */
export const restaurantApi = {
  /** `GET /restaurants/nearby` — quán gần vị trí (dữ liệu nội bộ đã duyệt + nhà cung cấp bản đồ). */
  getNearby: async (query: LocationQuery, page = 1): Promise<RestaurantDiscoveryResult> => {
    const res = await api.get<RestaurantDiscoveryResponseDto>(API_ENDPOINTS.RESTAURANTS.NEARBY, {
      params: restaurantMapper.toLocationParams(query, page),
      timeout: DISCOVERY_TIMEOUT_MS,
      silent: true,
    });
    return restaurantMapper.toDiscoveryResult(res.data);
  },

  /** `GET /restaurants/search` — tìm theo từ khóa (≥ 2 ký tự), có lọc cứng chế độ ăn. */
  search: async (query: LocationQuery, page = 1): Promise<RestaurantDiscoveryResult> => {
    const res = await api.get<RestaurantDiscoveryResponseDto>(API_ENDPOINTS.RESTAURANTS.SEARCH, {
      params: restaurantMapper.toLocationParams(query, page),
      timeout: DISCOVERY_TIMEOUT_MS,
      silent: true,
    });
    return restaurantMapper.toDiscoveryResult(res.data);
  },

  /** Tự chọn `search` khi có từ khóa hợp lệ, ngược lại dùng `nearby`. */
  discover: (query: LocationQuery, page = 1): Promise<RestaurantDiscoveryResult> =>
    hasSearchKeyword(query.query) ? restaurantApi.search(query, page) : restaurantApi.getNearby(query, page),

  /** `GET /restaurants/:id` — id nội bộ (UUID) hoặc id nhà cung cấp (`google:`/`serpapi:`/`fake:`). */
  getDetail: async (id: string): Promise<Restaurant> => {
    const res = await api.get<RestaurantPlaceResponseDto>(API_ENDPOINTS.RESTAURANTS.DETAIL(id), { silent: true });
    return restaurantMapper.toDetailModel(res.data);
  },

  /** `GET /location/geocode` — đổi địa chỉ người dùng nhập thành tọa độ. */
  geocode: async (address: string): Promise<GeocodeLocation | null> => {
    const res = await api.get<LocationGeocodeResponseDto>(API_ENDPOINTS.LOCATION.GEOCODE, {
      params: { address: address.trim() },
      silent: true,
    });
    return restaurantMapper.toGeocodeLocation(res.data);
  },

  /** `POST /restaurants` — đề xuất quán mới, luôn vào trạng thái chờ duyệt. */
  submit: async (input: SubmitRestaurantInput): Promise<SubmittedRestaurant> => {
    const res = await api.post<RestaurantRecordResponseDto>(
      API_ENDPOINTS.RESTAURANTS.SUBMIT,
      restaurantMapper.toSubmitDto(input),
      { silent: true }
    );
    return restaurantMapper.toSubmittedFromResponse(res.data);
  },

  /** `GET /restaurants/mine` — các quán mình đã đề xuất và trạng thái duyệt. */
  getMine: async (): Promise<SubmittedRestaurantListResult> => {
    const res = await api.get<RestaurantRecordListResponseDto>(API_ENDPOINTS.RESTAURANTS.MINE, {
      params: { limit: 50 },
      silent: true,
    });
    return restaurantMapper.toSubmittedList(res.data);
  },
};
