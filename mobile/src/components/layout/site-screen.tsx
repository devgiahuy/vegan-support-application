import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useIconColors } from '@/lib/theme-colors';
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
  scrollRef,
  onRefresh,
}: {
  children: React.ReactNode;
  fab?: React.ReactNode;
  showFooter?: boolean;
  /** Tham chiếu tới ScrollView bên trong, để màn hình tự cuộn tới một khối (ví dụ mở từ thẻ ở trang chủ). */
  scrollRef?: React.Ref<ScrollView>;
  /** Có truyền thì cho phép vuốt xuống để tải lại; trả về Promise để biểu tượng xoay đến khi tải xong. */
  onRefresh?: () => Promise<unknown>;
}) {
  const colors = useIconColors();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <View className="flex-1 bg-background">
      <SiteHeader />
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={colors.primary} colors={[colors.primary]} />
          ) : undefined
        }
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
