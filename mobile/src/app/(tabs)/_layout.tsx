import { Tabs } from 'expo-router/js-tabs';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';

/**
 * Nhóm màn chính có thanh điều hướng dưới đáy. Hàng nút hiển thị: Trang chủ,
 * Món chay, nút quạt "Thêm" (Video/Cẩm nang/Thực đơn, nút to nhất, ở giữa), Bản đồ
 * quán, Hồ sơ — xem `bottom-tab-bar.tsx`. `assistant`/`meal-plans`/`articles`/`videos`
 * vẫn đăng ký trong nhóm tab để giữ thanh dưới đáy khi mở (không có nút riêng, tới
 * qua nút quạt hoặc từ Trang chủ), không hiện nút back như màn phụ ở Stack gốc.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="recipes" />
      <Tabs.Screen name="restaurants" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="meal-plans" />
      <Tabs.Screen name="articles" />
      <Tabs.Screen name="videos" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
