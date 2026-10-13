/**
 * Nạp trước khi chạy test (`npm test`): `lib/env.ts` bắt buộc có `EXPO_PUBLIC_API_URL`, nhưng test
 * không gọi mạng nên chỉ cần một giá trị giả khi biến này chưa được cấu hình.
 */
process.env.EXPO_PUBLIC_API_URL ??= 'http://localhost:4000/api/v1';
