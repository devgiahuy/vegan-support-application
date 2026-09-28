import { Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Moon, Sun } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';

/** Nút đổi giao diện Sáng/Tối, đồng bộ hành vi với `frontend/.../theme-toggle.tsx`. */
export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const colors = useIconColors();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={toggleColorScheme}
      accessibilityLabel={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      className="h-9 w-9 items-center justify-center rounded-full bg-muted">
      {isDark ? (
        <Sun size={16} color={colors.foreground} />
      ) : (
        <Moon size={16} color={colors.foreground} />
      )}
    </Pressable>
  );
}
