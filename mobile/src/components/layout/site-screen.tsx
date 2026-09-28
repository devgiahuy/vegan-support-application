import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

/**
 * Khung trang dùng chung (Header cố định trên cùng + nội dung cuộn, Footer tuỳ chọn
 * ở cuối). Dùng cho mọi trang chính (Trang chủ, Khám phá món, Cẩm nang...).
 * Footer chỉ hiện ở Trang chủ — các màn khác không truyền `showFooter` nên mặc định ẩn.
 */
export function SiteScreen({
  children,
  fab,
  showFooter = false,
}: {
  children: React.ReactNode;
  fab?: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <View className="flex-1 bg-background">
      <SiteHeader />
      <ScrollView
        className="flex-1"
        // pb-10: chừa chỗ cho nút "Thêm" nổi lên (-mt-6) ở giữa thanh tab dưới đáy,
        // tránh đè lên nội dung cuối trang khi kéo hết cỡ (mọi màn dùng chung thanh tab).
        contentContainerClassName="grow pb-10"
        keyboardShouldPersistTaps="handled">
        {children}
        {showFooter ? <SiteFooter /> : null}
      </ScrollView>
      {fab}
    </View>
  );
}
