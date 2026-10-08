import { PrimaryButton } from '@/components/ui/primary-button';

/** Nút "Tải thêm" cho danh sách `useInfiniteQuery`; ẩn khi đã hết trang. */
export function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  onPress,
}: {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onPress: () => void;
}) {
  if (!hasNextPage) return null;
  return (
    <PrimaryButton
      label={isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
      variant="outline"
      loading={isFetchingNextPage}
      onPress={onPress}
    />
  );
}
