import { Text, View } from 'react-native';
import { HardDrive, RefreshCw } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { useIconColors } from '@/lib/theme-colors';
import { useStorageAccountQuery } from '../queries/storage.queries';
import { formatBytes } from '../mappers/storage.mapper';
import { storageErrorMessage } from '../lib/storage-errors';

export function StorageSection() {
  const query = useStorageAccountQuery();
  const colors = useIconColors();
  if (query.isLoading) return <LoadingState message="Đang tải dung lượng..." />;
  if (query.isError)
    return (
      <ErrorState
        title="Không tải được dung lượng"
        description={storageErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  if (!query.data) return null;
  const { usage, policyName } = query.data;
  return (
    <View className="gap-4 py-5">
      <View className="flex-row items-center gap-2">
        <HardDrive size={22} color={colors.primary} />
        <Text className="text-lg font-bold text-foreground">Dung lượng tài khoản</Text>
      </View>
      <Text className="text-sm text-muted-foreground">{policyName}</Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Dung lượng đã dùng và đang giữ"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(usage.occupiedPercent),
        }}
        className="h-3 overflow-hidden rounded-full bg-muted"
      >
        <View
          className={usage.warning ? 'h-full bg-destructive' : 'h-full bg-primary'}
          style={{ width: `${usage.occupiedPercent}%` }}
        />
      </View>
      {(
        [
          ['Đã dùng', usage.usedBytes],
          ['Đang giữ cho tải lên', usage.reservedBytes],
          ['Giới hạn', usage.limitBytes],
          ['Còn lại', usage.remainingBytes],
        ] as const
      ).map(([label, bytes]) => (
        <View key={label} className="flex-row justify-between gap-3 border-b border-border py-2">
          <Text className="flex-1 text-sm text-muted-foreground">{label}</Text>
          <Text className="text-sm font-semibold tabular-nums text-foreground">
            {formatBytes(bytes)}
          </Text>
        </View>
      ))}
      {usage.warning ? (
        <Text className="text-sm text-destructive">
          {usage.overQuota ? 'Đã vượt dung lượng tài khoản.' : 'Dung lượng tài khoản sắp đầy.'}
        </Text>
      ) : null}
      <PrimaryButton
        label="Cập nhật dung lượng"
        variant="outline"
        loading={query.isFetching}
        icon={<RefreshCw size={18} color={colors.primary} />}
        onPress={() => void query.refetch()}
      />
    </View>
  );
}
