import type {
  AdminRestaurantListResponseDto,
  GeocodeResponseDto,
  RestaurantListResponseDto,
  RestaurantResponseDto,
} from '../types/restaurant.dto';

/** Fixture quán chay Hà Nội/TP.HCM (phase scaffold hoặc offline fallback). */
export const restaurantListFixture: RestaurantListResponseDto = {
  success: true,
  data: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Chay An Nhiên',
      address: '12 Hàng Tre, Hoàn Kiếm, Hà Nội',
      lat: 21.033,
      lng: 105.854,
      latitude: 21.033,
      longitude: 105.854,
      dietTags: ['VEGAN', 'LACTO_OVO'],
      dietaryTags: ['VEGAN', 'LACTO_OVO'],
      dishes: ['Bún bò Huế chay', 'Cơm chay thập cẩm', 'Nem vuông chay'],
      openingHours: '7:00 - 21:00',
      priceRange: '30.000đ - 60.000đ',
      phoneNumber: '0901234567',
      websiteUrl: 'https://chayannhien.vn',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Bếp Chay Từ Tâm',
      address: '45 Nguyễn Huệ, Quận 1, TP.HCM',
      lat: 10.774,
      lng: 106.704,
      latitude: 10.774,
      longitude: 106.704,
      dietTags: ['VEGAN'],
      dietaryTags: ['VEGAN'],
      dishes: ['Lẩu nấm chay', 'Gỏi cuốn chay', 'Cơm sen tay cầm'],
      openingHours: '8:00 - 22:00',
      priceRange: '50.000đ - 120.000đ',
      phoneNumber: '02838221234',
      websiteUrl: 'https://bepchaytutam.vn',
      source: 'GOOGLE',
      fetchedAt: '2026-09-10T08:00:00.000Z',
      status: 'PUBLISHED',
    },
    {
      id: '33333333-3333-4333-8333-111111111111',
      name: 'Cơm Chay Thanh Lương',
      address: '425 Quang Trung, Phường 10, Gò Vấp, TP.HCM',
      lat: 10.8258,
      lng: 106.6432,
      latitude: 10.8258,
      longitude: 106.6432,
      dietTags: ['VEGAN', 'BUDDHIST'],
      dietaryTags: ['VEGAN', 'BUDDHIST'],
      dishes: ['Bún riêu chay', 'Cơm phần tự chọn', 'Bánh hỏi nem nướng chay'],
      openingHours: '6:30 - 21:00',
      priceRange: '25.000đ - 40.000đ',
      phoneNumber: '0908123456',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '33333333-3333-4333-8333-222222222222',
      name: 'Bếp Chay Duyên Tâm',
      address: '88 Nguyễn Văn Khối, Phường 11, Gò Vấp, TP.HCM',
      lat: 10.829,
      lng: 106.6415,
      latitude: 10.829,
      longitude: 106.6415,
      dietTags: ['VEGAN'],
      dietaryTags: ['VEGAN'],
      dishes: ['Hủ tiếu Nam Vang chay', 'Phở chay nấm hương'],
      openingHours: '7:00 - 20:30',
      priceRange: '30.000đ - 50.000đ',
      phoneNumber: '0937654321',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Quán Chay Thiện Duyên',
      address: '120 Phan Văn Trị, Phường 10, Gò Vấp, TP.HCM',
      lat: 10.8245,
      lng: 106.6872,
      latitude: 10.8245,
      longitude: 106.6872,
      dietTags: ['VEGAN', 'BUDDHIST'],
      dietaryTags: ['VEGAN', 'BUDDHIST'],
      dishes: ['Hủ tiếu chay Nam Vang', 'Cơm tấm sườn chay', 'Mì Quảng chay'],
      openingHours: '6:30 - 21:00',
      priceRange: '25.000đ - 45.000đ',
      phoneNumber: '0938112233',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '44444444-4444-4444-8444-444444444441',
      name: 'Nhà Hàng Chay Loving Hut Gò Vấp',
      address: '38 Huỳnh Khương An, Phường 5, Gò Vấp, TP.HCM',
      lat: 10.8228,
      lng: 106.6895,
      latitude: 10.8228,
      longitude: 106.6895,
      dietTags: ['VEGAN'],
      dietaryTags: ['VEGAN'],
      dishes: ['Phở chay gia truyền', 'Lẩu Thái chua cay chay', 'Chả giò chay'],
      openingHours: '7:00 - 21:30',
      priceRange: '35.000đ - 80.000đ',
      phoneNumber: '0912445566',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '55555555-5555-4555-8555-555555555551',
      name: 'Cơm Chay Pháp Hoa Phú Nhuận',
      address: '219 Thích Quảng Đức, Phường 4, Phú Nhuận, TP.HCM',
      lat: 10.8035,
      lng: 106.6841,
      latitude: 10.8035,
      longitude: 106.6841,
      dietTags: ['VEGAN', 'BUDDHIST'],
      dietaryTags: ['VEGAN', 'BUDDHIST'],
      dishes: ['Bánh xèo chay', 'Bún riêu cua chay', 'Cơm gà xối mỡ chay'],
      openingHours: '7:00 - 20:30',
      priceRange: '30.000đ - 55.000đ',
      phoneNumber: '02839951234',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '66666666-6666-4666-8666-666666666661',
      name: 'Quán Chay Mandala Quận 10',
      address: '110 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
      lat: 10.7682,
      lng: 106.6698,
      latitude: 10.7682,
      longitude: 106.6698,
      dietTags: ['VEGAN', 'LACTO_OVO'],
      dietaryTags: ['VEGAN', 'LACTO_OVO'],
      dishes: ['Cơm chiên trái thơm', 'Đậu hũ sốt nấm', 'Canh rong biển đậu hũ'],
      openingHours: '8:30 - 21:00',
      priceRange: '40.000đ - 90.000đ',
      phoneNumber: '02838621234',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '77777777-7777-4777-8777-777777777771',
      name: 'Cơm Chay Nàng Tấm Hà Nội',
      address: '79A Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
      lat: 21.0225,
      lng: 105.8485,
      latitude: 21.0225,
      longitude: 105.8485,
      dietTags: ['VEGAN'],
      dietaryTags: ['VEGAN'],
      dishes: ['Ốc nấu chuối đậu chay', 'Cá kho tộ chay', 'Chả cá Lã Vọng chay'],
      openingHours: '9:00 - 21:00',
      priceRange: '45.000đ - 100.000đ',
      phoneNumber: '02439424147',
      source: 'INTERNAL',
      fetchedAt: new Date().toISOString(),
      status: 'PUBLISHED',
    },
    {
      id: '88888888-8888-4888-8888-888888888881',
      name: 'Cơm Chay Cũ Kỹ',
      address: '8 Hàng Bạc, Hà Nội',
      lat: 21.03,
      lng: 105.852,
      latitude: 21.03,
      longitude: 105.852,
      dishes: [],
      openingHours: null,
      source: 'INTERNAL',
      fetchedAt: '2020-01-01T00:00:00.000Z',
      status: 'PUBLISHED',
    },
  ],
  meta: { page: 1, limit: 10, total: 8, totalPages: 1 },
};

export function restaurantDetailFixture(id: string): RestaurantResponseDto {
  const found = (restaurantListFixture.data ?? []).find((item) => item?.id === id) ?? null;
  return { success: true, data: found, meta: null };
}

/** Fixture hàng chờ duyệt quán. */
export const restaurantQueueFixture: AdminRestaurantListResponseDto = {
  success: true,
  data: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Chay Mới Mở',
      address: '99 Láng Hạ, Hà Nội',
      lat: 21.015,
      lng: 105.812,
      latitude: 21.015,
      longitude: 105.812,
      dishes: ['Phở chay'],
      status: 'PENDING',
    },
  ],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

const GEOCODE_LOOKUP: Array<{
  keywords: string[];
  coords: { lat: number; lng: number; label: string };
}> = [
  // TP. Hồ Chí Minh
  {
    keywords: ['go vap', 'gò vấp', 'quang trung', 'phan van tri', 'nguyen oanh'],
    coords: { lat: 10.8214, lng: 106.6381, label: 'Quận Gò Vấp, TP.HCM' },
  },
  {
    keywords: ['tan binh', 'tân bình', 'cong hoa', 'truong chinh', 'san bay', 'tan son nhat'],
    coords: { lat: 10.7992, lng: 106.6542, label: 'Quận Tân Bình, TP.HCM' },
  },
  {
    keywords: ['binh thanh', 'bình thạnh', 'xo viet nghe tinh', 'dien bien phu'],
    coords: { lat: 10.8106, lng: 106.6953, label: 'Quận Bình Thạnh, TP.HCM' },
  },
  {
    keywords: ['phu nhuan', 'phú nhuận', 'phan xich long'],
    coords: { lat: 10.7994, lng: 106.6806, label: 'Quận Phú Nhuận, TP.HCM' },
  },
  {
    keywords: ['ben thanh', 'bến thành', 'nguyen hue', 'nguyễn huệ', 'quan 1', 'quận 1'],
    coords: { lat: 10.7725, lng: 106.698, label: 'Quận 1, TP.HCM' },
  },
  {
    keywords: ['quan 3', 'quận 3', 'vo van tan', 'nguyen dinh chieu'],
    coords: { lat: 10.7844, lng: 106.6843, label: 'Quận 3, TP.HCM' },
  },
  {
    keywords: ['quan 5', 'quận 5', 'cho lon', 'chợ lớn', 'an duong vuong'],
    coords: { lat: 10.7551, lng: 106.6669, label: 'Quận 5, TP.HCM' },
  },
  {
    keywords: ['quan 7', 'quận 7', 'phu my hung', 'phú mỹ hưng'],
    coords: { lat: 10.734, lng: 106.7218, label: 'Quận 7, TP.HCM' },
  },
  {
    keywords: ['quan 10', 'quận 10', 'su van hanh', '3 thang 2'],
    coords: { lat: 10.7746, lng: 106.667, label: 'Quận 10, TP.HCM' },
  },
  {
    keywords: ['thu duc', 'thủ đức'],
    coords: { lat: 10.8494, lng: 106.7537, label: 'TP. Thủ Đức, TP.HCM' },
  },
  {
    keywords: ['hcm', 'ho chi minh', 'hồ chí minh', 'sai gon', 'sài gòn'],
    coords: { lat: 10.7769, lng: 106.7009, label: 'TP. Hồ Chí Minh' },
  },

  // Hà Nội
  {
    keywords: ['ho guom', 'hồ gươm', 'hoan kiem', 'hoàn kiếm', 'hang bai', 'hang bac', 'hang tre'],
    coords: { lat: 21.0285, lng: 105.8542, label: 'Hoàn Kiếm, Hà Nội' },
  },
  {
    keywords: ['ba dinh', 'ba đình', 'lang bac', 'lăng bác', 'kim ma'],
    coords: { lat: 21.0341, lng: 105.8248, label: 'Ba Đình, Hà Nội' },
  },
  {
    keywords: ['dong da', 'đống đa', 'lang ha', 'láng hạ', 'chua boc', 'chùa bộc'],
    coords: { lat: 21.0181, lng: 105.826, label: 'Đống Đa, Hà Nội' },
  },
  {
    keywords: ['cau giay', 'cầu giấy', 'xuan thuy', 'duy tan'],
    coords: { lat: 21.0362, lng: 105.7906, label: 'Cầu Giấy, Hà Nội' },
  },
  {
    keywords: ['tay ho', 'tây hồ', 'ho tay', 'hồ tây'],
    coords: { lat: 21.0664, lng: 105.8239, label: 'Tây Hồ, Hà Nội' },
  },
  { keywords: ['ha noi', 'hà nội'], coords: { lat: 21.0285, lng: 105.8542, label: 'Hà Nội' } },

  // Đà Nẵng & Cần Thơ
  { keywords: ['da nang', 'đà nẵng'], coords: { lat: 16.0544, lng: 108.2022, label: 'Đà Nẵng' } },
  { keywords: ['can tho', 'cần thơ'], coords: { lat: 10.0452, lng: 105.7469, label: 'Cần Thơ' } },
];

/** Fixture geocode thông minh các quận huyện Việt Nam. */
export function geocodeFixture(address: string): GeocodeResponseDto {
  const normalized = address
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

  for (const entry of GEOCODE_LOOKUP) {
    if (
      entry.keywords.some((kw) => {
        const normKw = kw.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
        return normalized.includes(normKw);
      })
    ) {
      return {
        success: true,
        data: {
          lat: entry.coords.lat,
          lng: entry.coords.lng,
          latitude: entry.coords.lat,
          longitude: entry.coords.lng,
          label: entry.coords.label,
          address: entry.coords.label,
        },
        meta: null,
      };
    }
  }

  return { success: true, data: { lat: null, lng: null, label: '' }, meta: null };
}
