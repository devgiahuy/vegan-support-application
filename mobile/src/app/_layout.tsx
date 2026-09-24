import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import { QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { createQueryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const [queryClient] = React.useState(() => createQueryClient());

  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Nhóm tab chính có thanh điều hướng dưới đáy: Trang chủ, Món chay, Bản đồ quán,
              menu quạt (Video/Cẩm nang/Thực đơn), Hồ sơ. Trợ lý AI, Thực đơn, Cẩm nang,
              danh sách Video vẫn là màn trong nhóm tab (giữ thanh dưới đáy) dù không có
              nút riêng trên thanh — tới qua nút quạt hoặc từ Trang chủ. */}
          <Stack.Screen name="(tabs)" />
          {/* Màn phụ và màn chi tiết: mở chồng lên tab, có nút quay lại trên header */}
          <Stack.Screen name="recipes/[id]" />
          <Stack.Screen name="recipes/new" />
          <Stack.Screen name="articles/[id]" />
          <Stack.Screen name="articles/new" />
          <Stack.Screen name="videos/new" />
          <Stack.Screen name="videos/[id]" />
          <Stack.Screen name="meal-plans/[id]" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="search" />
          <Stack.Screen name="bookmarks" />
          <Stack.Screen name="contributor-status" />
          <Stack.Screen name="diet-preferences" />
          <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(auth)/register" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
