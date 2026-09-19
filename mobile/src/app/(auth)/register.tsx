import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { RegisterForm } from '@/features/auth/components/register-form';
import { useIconColors } from '@/lib/theme-colors';

/**
 * Màn Đăng ký (đồng bộ nội dung/copy với `frontend/src/app/(auth)/login/page.tsx`,
 * tab "Tạo tài khoản"). Trình bày dạng modal độc lập, không có tab bar.
 */
export default function RegisterScreen() {
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
              Khởi tạo phong cách sống xanh
            </Text>
            <Text className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Tạo hồ sơ nhận ngay thực đơn thuần chay 7 ngày được cá nhân hoá theo thể trạng.
            </Text>

            <View className="mt-6">
              <RegisterForm onSuccess={() => router.replace('/')} />
            </View>

            <Text className="mt-6 text-center text-xs text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/(auth)/login" replace asChild>
                <Text className="font-semibold text-primary">Đăng nhập ngay</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
