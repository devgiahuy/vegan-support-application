/**
 * Base URL của backend API (`/api/v1`). KHÔNG hard-code URL trong feature —
 * mọi nơi cần gọi API phải import `API_BASE_URL` từ đây.
 *
 * Cấu hình qua biến môi trường Expo (đọc lúc build, cần restart `expo start` khi đổi):
 * - `EXPO_PUBLIC_API_URL` trong `.env` ở thư mục `mobile/`.
 *
 * Giá trị tham khảo theo cách bạn chạy app (xem README phần "Kết nối backend"):
 * - Android Emulator (Android Studio AVD): http://10.0.2.2:4000/api/v1
 * - Thiết bị thật qua Expo Go (cùng Wi-Fi): http://<IP-LAN-máy-bạn>:4000/api/v1
 * - iOS Simulator (macOS): http://localhost:4000/api/v1
 */
const DEFAULT_ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:4000/api/v1';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_ANDROID_EMULATOR_API_URL;

if (!process.env.EXPO_PUBLIC_API_URL && __DEV__) {
  console.warn(
    `[env] Thiếu EXPO_PUBLIC_API_URL, đang dùng mặc định cho Android Emulator: ${DEFAULT_ANDROID_EMULATOR_API_URL}. ` +
      'Nếu test bằng thiết bị thật/iOS Simulator, tạo file mobile/.env với EXPO_PUBLIC_API_URL phù hợp rồi restart `npx expo start`.'
  );
}
