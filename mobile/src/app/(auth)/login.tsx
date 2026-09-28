import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Leaf, ShieldCheck, X } from 'lucide-react-native';
import { LoginForm } from '@/features/auth/components/login-form';
import { useIconColors } from '@/lib/theme-colors';

/**
 * Màn Đăng nhập (đồng bộ nội dung/copy với `frontend/src/app/(auth)/login/page.tsx`,
 * tab "Đăng nhập"). Trình bày dạng modal độc lập, không có tab bar.
 */
export default function LoginScreen() {
  const colors = useIconColors();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-5 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="absolute right-5 top-5 z-10 h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <X size={18} color={colors.mutedForeground} />
          </Pressable>

          <View className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
            <Text className="text-2xl font-bold tracking-tight text-foreground">
              Mừng bạn trở lại!
            </Text>
            <Text className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Tiếp tục hành trình ẩm thực chay thanh nhẹ và đầy đủ vi chất mỗi ngày.
            </Text>

            <View className="mt-6">
              <LoginForm onSuccess={() => router.replace('/')} />
            </View>

            <Text className="mt-6 text-center text-xs text-muted-foreground">
              Bạn mới biết đến VeggieConnect?{' '}
              <Link href="/(auth)/register" replace asChild>
                <Text className="font-semibold text-primary">Đăng ký tài khoản miễn phí</Text>
              </Link>
            </Text>
          </View>

          <View className="mt-5 flex-row flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            <View className="flex-row items-center gap-1.5">
              <ShieldCheck size={16} color={colors.primary} />
              <Text className="text-xs text-muted-foreground">Bảo mật dữ liệu cá nhân</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Leaf size={16} color={colors.primary} />
              <Text className="text-xs text-muted-foreground">Cộng đồng thuần chay chuẩn mực</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
