import { View, useWindowDimensions } from 'react-native';

import { BrandLogo } from '@/components/layout/brand-logo';

/** Tỉ lệ rộng/cao của `logo-horizontal` (717×120), khớp `BrandLogo`. */
const LOGO_RATIO = 717 / 120;
/** Lề ngang của màn đăng nhập/đăng ký (`px-5` = 20 mỗi bên). */
const SCREEN_PADDING_X = 40;
const MAX_LOGO_HEIGHT = 64;

/**
 * Logo VeggieConnect cỡ lớn ở đầu màn Đăng nhập / Đăng ký. Chiều cao tự co theo bề rộng màn hình để logo luôn
 * nằm gọn trong lề, tối đa 64dp; chừa khoảng trên để không chạm nút đóng (X) ở góc phải.
 */
export function AuthBrandHeader() {
  const { width } = useWindowDimensions();
  const height = Math.min(MAX_LOGO_HEIGHT, Math.floor((width - SCREEN_PADDING_X) / LOGO_RATIO));

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="VeggieConnect" className="mb-6 mt-6 items-center">
      <BrandLogo variant="horizontal" height={height} />
    </View>
  );
}
