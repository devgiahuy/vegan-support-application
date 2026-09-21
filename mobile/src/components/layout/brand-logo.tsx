import { Image } from 'expo-image';
import { useColorScheme } from 'nativewind';

const HORIZONTAL_RATIO = 717 / 120;

/**
 * Logo VeggieConnect, dùng đúng file ảnh của `frontend/public/logo/` (đồng bộ
 * `frontend/src/components/layout/brand-logo.tsx`, biến thể `horizontal`/`mark`).
 */
export function BrandLogo({
  variant = 'horizontal',
  height = 28,
}: {
  variant?: 'horizontal' | 'mark';
  height?: number;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (variant === 'mark') {
    return (
      <Image
        source={require('@/assets/images/logo/logo-mark.png')}
        style={{ width: height, height }}
        contentFit="contain"
      />
    );
  }

  return (
    <Image
      source={
        isDark
          ? require('@/assets/images/logo/logo-horizontal-dark.png')
          : require('@/assets/images/logo/logo-horizontal.png')
      }
      style={{ width: height * HORIZONTAL_RATIO, height }}
      contentFit="contain"
    />
  );
}
