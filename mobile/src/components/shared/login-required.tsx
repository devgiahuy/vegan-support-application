import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';

/** Thẻ yêu cầu đăng nhập dùng chung cho các màn dữ liệu cá nhân. */
export function LoginRequired({ title, description }: { title: string; description?: string }) {
  return (
    <View className="px-5 pt-8">
      <View className="items-center rounded-2xl border border-border bg-card p-6">
        <Text className="text-center text-lg font-bold text-foreground">{title}</Text>
        {description ? <Text className="mt-2 text-center text-sm text-muted-foreground">{description}</Text> : null}
        <View className="mt-5 w-full">
          <Link href={'/(auth)/login' as Href} asChild>
            <PrimaryButton label="Đăng nhập ngay" />
          </Link>
        </View>
      </View>
    </View>
  );
}
