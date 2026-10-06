import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AlertTriangle, Inbox } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';

/** Trạng thái đang tải dùng chung — đồng bộ `LoadingState` của web. */
export function LoadingState({ message = 'Đang tải...' }: { message?: string }) {
  const colors = useIconColors();
  return (
    <View className="items-center rounded-2xl border border-border p-6">
      <ActivityIndicator color={colors.primary} />
      <Text className="mt-3 text-sm text-muted-foreground">{message}</Text>
    </View>
  );
}

/** Trạng thái lỗi dùng chung, có nút "Thử lại" — đồng bộ `ErrorState` của web. */
export function ErrorState({
  title = 'Không tải được dữ liệu.',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const colors = useIconColors();
  return (
    <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <AlertTriangle size={22} color={colors.destructive} />
      <Text className="mt-2 text-center font-semibold text-destructive">{title}</Text>
      {description ? <Text className="mt-1 text-center text-sm text-muted-foreground">{description}</Text> : null}
      {onRetry ? (
        <View className="mt-4 w-full">
          <PrimaryButton label="Thử lại" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

/** Trạng thái rỗng dùng chung — đồng bộ `EmptyState` của web. */
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const colors = useIconColors();
  return (
    <View className="items-center rounded-2xl border border-dashed border-border p-8">
      {icon ?? <Inbox size={24} color={colors.mutedForeground} />}
      <Text className="mt-2 text-center font-semibold text-foreground">{title}</Text>
      {description ? <Text className="mt-1 text-center text-sm text-muted-foreground">{description}</Text> : null}
      {action ? <View className="mt-4 w-full">{action}</View> : null}
    </View>
  );
}
