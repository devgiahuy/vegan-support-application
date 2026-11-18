/**
 * Danh sách tiền tố đường dẫn sẽ ẩn SiteFooter.
 * Bao gồm:
 * - /assistant (canvas AI toàn màn hình)
 * - /meal-plans (bảng lập thực đơn tuần dạng app)
 * - /restaurants (bản đồ tìm kiếm quán chay toàn màn hình)
 * - /pantry (quản lý tủ bếp gia đình, quét tủ lạnh & quét hóa đơn)
 * - /profile (hồ sơ cá nhân và quản lý dữ liệu người dùng)
 * - /recipes/new (trình soạn thảo tạo công thức mới dạng studio)
 */
export const HIDDEN_FOOTER_PREFIXES: readonly string[] = [
  '/assistant',
  '/meal-plans',
  '/restaurants',
  '/pantry',
  '/profile',
  '/recipes/new',
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
