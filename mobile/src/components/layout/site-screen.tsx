import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useKeyboardAwareScroll } from '@/hooks/use-keyboard-aware-scroll';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

/**
 * Khung trang dùng chung (Header cố định trên cùng + nội dung cuộn, Footer tuỳ chọn
 * ở cuối). Dùng cho mọi trang chính và trang phụ.
 */
export function SiteScreen({
  children,
  fab,
  showFooter = false,
  scrollRef,
  onRefresh,
  contentClassName,
  maintainContentPosition = false,
  title,
  headerRight,
}: {
  children: React.ReactNode;
  fab?: React.ReactNode;
  showFooter?: boolean;
  /** Tham chiếu tới ScrollView bên trong, để màn hình tự cuộn tới một khối (ví dụ mở từ thẻ ở trang chủ). */
  scrollRef?: React.Ref<ScrollView>;
  /** Có truyền thì cho phép vuốt xuống để tải lại; trả về Promise để biểu tượng xoay đến khi tải xong. */
  onRefresh?: () => Promise<unknown>;
  /** Class thêm cho vùng nội dung cuộn (padding/gap). Cần khi muốn mỗi khối con là con trực tiếp của ScrollView. */
  contentClassName?: string;
  /**
   * Giữ nguyên vị trí nhìn thấy khi nội dung phía TRÊN đổi chiều cao (dữ liệu tải lại, khối thu gọn/mở rộng).
   * Chỉ có tác dụng khi các khối của trang là con trực tiếp của ScrollView (không bọc trong một View duy nhất).
   */
  maintainContentPosition?: boolean;
  /** Tiêu đề hiển thị ở header khi là màn hình con hoặc cần đặt tiêu đề cụ thể. */
  title?: string;
  /** Nút thao tác phụ ở góc phải header (dành cho màn hình con). */
  headerRight?: React.ReactNode;
}) {
  const colors = useIconColors();
  const { keyboardHeight, scrollProps } = useKeyboardAwareScroll(scrollRef);
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
      <SiteHeader title={title} headerRight={headerRight} />
      <ScrollView
        {...scrollProps}
        className="flex-1"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        contentContainerClassName={cn('grow', showFooter ? '' : 'pb-6', contentClassName)}
        maintainVisibleContentPosition={maintainContentPosition ? { minIndexForVisible: 0 } : undefined}
        keyboardShouldPersistTaps="handled">
        {children}
        {showFooter ? <SiteFooter /> : null}
        {/* Bàn phím không đẩy nội dung lên nên chừa đúng chiều cao của nó để cuộn tới ô nhập cuối trang. */}
        {keyboardHeight > 0 ? <View style={{ height: keyboardHeight }} /> : null}
      </ScrollView>
      {fab}
    </View>
  );
}
