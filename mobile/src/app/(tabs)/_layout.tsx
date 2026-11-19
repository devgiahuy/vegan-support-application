import { Tabs } from 'expo-router/js-tabs';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';

/**
 * Nhóm màn chính có thanh điều hướng dưới đáy gồm 5 mục:
 * Trang chủ, Khám phá (Công thức/Cẩm nang/Video), Thực đơn, Quán chay, Hồ sơ.
 * `assistant`, `articles`, `videos` vẫn đăng ký trong nhóm để giữ thanh dưới đáy
 * và điều hướng mượt mà từ tab Khám phá hoặc từ header/trang chủ.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="recipes" />
      <Tabs.Screen name="meal-plans" />
      <Tabs.Screen name="restaurants" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="articles" />
      <Tabs.Screen name="videos" />
      <Tabs.Screen name="assistant" />
    </Tabs>
  );
}
