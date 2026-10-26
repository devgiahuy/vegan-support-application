/**
 * Danh sách tiền tố đường dẫn sẽ ẩn SiteFooter.
 * Bao gồm:
 * - /assistant (canvas AI toàn màn hình)
 * - /meal-plans (bảng lập thực đơn tuần dạng app)
 * - /restaurants (bản đồ tìm kiếm quán chay toàn màn hình)
 * - /pantry (quản lý tủ bếp gia đình & quét tủ lạnh)
 * - /receipts/scan (quét và kiểm duyệt hóa đơn OCR)
 * - /profile (hồ sơ cá nhân và quản lý dữ liệu người dùng)
 */
export const HIDDEN_FOOTER_PREFIXES: readonly string[] = [
  '/assistant',
  '/meal-plans',
  '/restaurants',
  '/pantry',
  '/receipts/scan',
  '/profile',
];

/**
 * Kiểm tra xem Footer có bị ẩn với đường dẫn URL hiện tại hay không.
 * Pure function để phục vụ kiểm thử và tái sử dụng ở client components.
 */
export function isFooterHidden(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return HIDDEN_FOOTER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
