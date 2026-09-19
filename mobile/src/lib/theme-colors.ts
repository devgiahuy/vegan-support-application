import { useColorScheme } from 'nativewind';

/**
 * Giá trị hex icon tương ứng token CSS trong `global.css` (đồng bộ `frontend/src/app/globals.css`).
 * Dùng riêng cho prop `color` của icon SVG (lucide-react-native) — nơi NativeWind
 * không thể resolve `var(--token)` vì đây không phải className.
 */
export const ICON_COLORS = {
  light: {
    background: '#ffffff',
    accent: '#f1f5f0',
    foreground: '#1a2e1f',
    mutedForeground: '#6b7c6e',
    primary: '#2e7d32',
    primaryForeground: '#ffffff',
    destructive: '#d32f2f',
    cta: '#ff8f00',
  },
  dark: {
    background: '#0b1410',
    accent: '#1c3326',
    foreground: '#e6f2e7',
    mutedForeground: '#9bb0a0',
    primary: '#66bb6a',
    primaryForeground: '#06210b',
    destructive: '#f87171',
    cta: '#ffa726',
  },
} as const;

/**
 * Dùng `useColorScheme` của thư viện `nativewind` (không phải `react-native`) vì
 * nó cho phép người dùng chủ động bật/tắt (`toggleColorScheme`) thay vì chỉ đọc
 * theo hệ điều hành — cần thiết cho nút đổi giao diện Sáng/Tối trên Header.
 */
export function useIconColors() {
  const { colorScheme } = useColorScheme();
  return ICON_COLORS[colorScheme === 'dark' ? 'dark' : 'light'];
}
