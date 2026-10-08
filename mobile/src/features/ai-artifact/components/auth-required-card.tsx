import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { LogIn } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';

/** Thẻ mời đăng nhập khi backend trả `AUTH_REQUIRED` cho danh sách tri thức AI. */
export function AuthRequiredCard() {
  const colors = useIconColors();
  return (
    <View className="items-center rounded-3xl border border-border bg-card p-6">
      <Text className="text-center text-lg font-bold text-foreground">Đăng nhập để xem tri thức AI</Text>
      <Text className="mt-2 text-center text-sm text-muted-foreground">
        Máy chủ hiện yêu cầu tài khoản để xem danh sách tri thức AI công khai.
      </Text>
      <View className="mt-5 w-full">
        <Link href={'/(auth)/login' as Href} asChild>
          <PrimaryButton label="Đăng nhập ngay" icon={<LogIn size={15} color={colors.primaryForeground} />} />
        </Link>
      </View>
    </View>
  );
}
