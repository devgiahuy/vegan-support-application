/**
 * Cấu hình đọc từ biến môi trường Expo (`mobile/.env`, không commit). KHÔNG hard-code URL trong
 * code — mọi URL phải khai báo trong `.env` (mẫu ở `.env.example`) rồi import từ file này.
 *
 * Lưu ý của Expo: biến `EXPO_PUBLIC_*` được nhúng lúc bundle, phải tham chiếu tĩnh
 * (`process.env.EXPO_PUBLIC_X`) và cần restart `npx expo start -c` sau khi đổi `.env`.
 */

function readOptional(value: string | undefined): string {
  return value?.trim() ?? '';
}

const apiUrl = readOptional(process.env.EXPO_PUBLIC_API_URL);

if (!apiUrl) {
  throw new Error(
    'Thiếu EXPO_PUBLIC_API_URL. Tạo file mobile/.env từ .env.example, điền URL backend (…/api/v1) rồi chạy lại `npx expo start -c`.'
  );
}

/** Base URL của backend API (`/api/v1`), không có dấu `/` ở cuối. */
export const API_BASE_URL: string = apiUrl.replace(/\/+$/, '');

/** Ảnh dự phòng khi nội dung không có ảnh bìa. Để trống nếu không muốn dùng ảnh dự phòng. */
export const FALLBACK_RECIPE_COVER_URL: string = readOptional(process.env.EXPO_PUBLIC_FALLBACK_RECIPE_COVER_URL);
export const FALLBACK_ARTICLE_COVER_URL: string = readOptional(process.env.EXPO_PUBLIC_FALLBACK_ARTICLE_COVER_URL);
export const FALLBACK_VIDEO_THUMBNAIL_URL: string = readOptional(process.env.EXPO_PUBLIC_FALLBACK_VIDEO_THUMBNAIL_URL);

/** Mẫu URL ảnh thumbnail YouTube, chứa `{id}` sẽ được thay bằng ID video. */
const YOUTUBE_THUMBNAIL_TEMPLATE: string = readOptional(process.env.EXPO_PUBLIC_YOUTUBE_THUMBNAIL_URL_TEMPLATE);

export function buildYoutubeThumbnailUrl(videoId: string): string {
  if (!YOUTUBE_THUMBNAIL_TEMPLATE || !videoId) return '';
  return YOUTUBE_THUMBNAIL_TEMPLATE.replace('{id}', encodeURIComponent(videoId));
}

/** Mẫu URL chỉ đường, chứa `{lat}` và `{lng}` của điểm đến. Để trống = ẩn nút "Chỉ đường". */
const DIRECTIONS_URL_TEMPLATE: string = readOptional(process.env.EXPO_PUBLIC_MAPS_DIRECTIONS_URL_TEMPLATE);

export function buildDirectionsUrl(lat: number, lng: number): string {
  if (!DIRECTIONS_URL_TEMPLATE) return '';
  return DIRECTIONS_URL_TEMPLATE.replace('{lat}', String(lat)).replace('{lng}', String(lng));
}

/** Email hỗ trợ/liên hệ. Để trống = ẩn nút gửi email ở trang Liên hệ và Góp ý. */
export const SUPPORT_EMAIL: string = readOptional(process.env.EXPO_PUBLIC_SUPPORT_EMAIL);
export const CONTACT_EMAIL: string = readOptional(process.env.EXPO_PUBLIC_CONTACT_EMAIL);

/** Soạn sẵn thư gửi tới email hỗ trợ (mở ứng dụng email của thiết bị). Trả về chuỗi rỗng nếu chưa cấu hình email. */
export function buildSupportMailto(subject: string, body: string): string {
  if (!SUPPORT_EMAIL) return '';
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Liên kết mạng xã hội ở footer. Giá trị rỗng = không hiện nút. */
export const SOCIAL_LINKS = {
  facebook: readOptional(process.env.EXPO_PUBLIC_SOCIAL_FACEBOOK_URL),
  instagram: readOptional(process.env.EXPO_PUBLIC_SOCIAL_INSTAGRAM_URL),
  youtube: readOptional(process.env.EXPO_PUBLIC_SOCIAL_YOUTUBE_URL),
  tiktok: readOptional(process.env.EXPO_PUBLIC_SOCIAL_TIKTOK_URL),
  pinterest: readOptional(process.env.EXPO_PUBLIC_SOCIAL_PINTEREST_URL),
  x: readOptional(process.env.EXPO_PUBLIC_SOCIAL_X_URL),
} as const;
