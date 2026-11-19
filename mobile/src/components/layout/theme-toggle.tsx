import { Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Moon, Sun } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';

/** Nút đổi giao diện Sáng/Tối, vùng chạm tối thiểu 44dp chuẩn di động. */
export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const colors = useIconColors();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={toggleColorScheme}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-80">
      {isDark ? (
        <Sun size={18} color={colors.foreground} />
      ) : (
        <Moon size={18} color={colors.foreground} />
      )}
    </Pressable>
  );
}
