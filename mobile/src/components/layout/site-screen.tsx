import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

/**
 * Khung trang dùng chung (Header cố định trên cùng + nội dung cuộn + Footer ở cuối),
 * đồng bộ `frontend/src/app/(site)/layout.tsx`. Dùng cho mọi trang chính
 * (Trang chủ, Khám phá món, Cẩm nang...).
 */
export function SiteScreen({ children, fab }: { children: React.ReactNode; fab?: React.ReactNode }) {
  return (
    <View className="flex-1 bg-background">
      <SiteHeader />
      <ScrollView className="flex-1" contentContainerClassName="grow" keyboardShouldPersistTaps="handled">
        {children}
        <SiteFooter />
      </ScrollView>
      {fab}
    </View>
  );
}
