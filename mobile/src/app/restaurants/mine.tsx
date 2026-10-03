import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Plus, Store } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useMyRestaurantsQuery } from '@/features/restaurant/queries/restaurant.queries';
import type { SubmittedRestaurant } from '@/features/restaurant/types/restaurant.model';
import { formatDate } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

function statusStyle(status: SubmittedRestaurant['status']): { badge: string; text: string } {
  if (status === 'APPROVED') return { badge: 'bg-emerald-500/10', text: 'text-emerald-600' };
  if (status === 'REJECTED') return { badge: 'bg-destructive/10', text: 'text-destructive' };
  return { badge: 'bg-amber-500/10', text: 'text-amber-600' };
}

/** Quán tôi đã đề xuất (`GET /restaurants/mine`) kèm trạng thái duyệt và lý do nếu bị từ chối. */
export default function MyRestaurantsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError, refetch } = useMyRestaurantsQuery();
  const items = data?.items ?? [];

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="text-center text-xl font-bold text-foreground">Đăng nhập để xem quán đã đề xuất</Text>
            <View className="mt-5 w-full">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight text-foreground">Quán tôi đề xuất</Text>
            <Text className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái duyệt các quán bạn đã gửi.</Text>
          </View>
          <Link href={'/restaurants/new' as Href} asChild>
            <PrimaryButton label="Thêm" icon={<Plus size={16} color={colors.primaryForeground} />} />
          </Link>
        </View>

        {isLoading ? (
          <LoadingState message="Đang tải danh sách quán..." />
        ) : isError ? (
          <ErrorState title="Không tải được danh sách quán." onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Bạn chưa đề xuất quán nào"
            description="Đề xuất quán chay bạn biết để cộng đồng cùng khám phá."
            icon={<Store size={24} color={colors.mutedForeground} />}
          />
        ) : (
          <View className="gap-3">
            {items.map((item) => {
              const style = statusStyle(item.status);
              return (
                <View key={item.id} className="gap-2 rounded-2xl border border-border bg-card p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <Text className="flex-1 text-base font-bold text-foreground">{item.name}</Text>
                    <View className={cn('rounded-full px-2.5 py-1', style.badge)}>
                      <Text className={cn('text-xs font-semibold', style.text)}>{item.statusLabel}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted-foreground">{item.address}</Text>
                  {item.dietTagLabels.length > 0 ? (
                    <Text className="text-xs text-foreground/80">{item.dietTagLabels.join(' · ')}</Text>
                  ) : null}
                  {item.categories.length > 0 ? (
                    <Text numberOfLines={2} className="text-xs text-muted-foreground">
                      {item.categories.join(' · ')}
                    </Text>
                  ) : null}
                  {item.status === 'REJECTED' && item.reviewReason ? (
                    <View className="rounded-xl bg-destructive/5 p-2.5">
                      <Text className="text-xs text-destructive">Lý do từ chối: {item.reviewReason}</Text>
                    </View>
                  ) : null}
                  <Text className="text-[11px] text-muted-foreground">
                    Gửi ngày {formatDate(item.createdAt)}
                    {item.reviewedAt ? ` · Xử lý ngày ${formatDate(item.reviewedAt)}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
