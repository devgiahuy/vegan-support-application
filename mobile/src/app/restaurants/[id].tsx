import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Clock, MapPin, Store } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useRestaurantDetailQuery } from '@/features/restaurant/queries/restaurant.queries';
import { useIconColors } from '@/lib/theme-colors';

export default function RestaurantDetailScreen() {
  const colors = useIconColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: restaurant, isLoading, isError, refetch } = useRestaurantDetailQuery(id ?? '');

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <Text className="text-sm text-muted-foreground">Dang tai chi tiet quan...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isError || !restaurant) {
    return (
      <SiteScreen>
        <View className="items-center px-5 pt-8">
          <Store size={32} color={colors.mutedForeground} />
          <Text className="mt-3 font-bold text-foreground">Khong tim thay quan</Text>
          <PrimaryButton label="Thu lai" className="mt-4 w-full" onPress={() => void refetch()} />
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Store size={24} color={colors.primaryForeground} />
          </View>
          <Text className="mt-4 text-2xl font-extrabold text-foreground">{restaurant.name}</Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            Du lieu hien la fixture vi backend restaurants/maps van PLANNED.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border p-4">
          <View className="flex-row items-start gap-2">
            <MapPin size={16} color={colors.primary} />
            <Text className="flex-1 text-sm text-foreground">
              {restaurant.address}
              {restaurant.distanceLabel ? ` · ${restaurant.distanceLabel}` : ''}
            </Text>
          </View>
          <View className="flex-row items-start gap-2">
            <Clock size={16} color={colors.primary} />
            <Text className="flex-1 text-sm text-foreground">
              {restaurant.openingHours ?? 'Gio mo cua chua ro'}
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Nguon: {restaurant.sourceLabel} · {restaurant.statusLabel}
          </Text>
        </View>

        <View className="gap-2 rounded-2xl border border-border p-4">
          <Text className="font-bold text-foreground">Mon goi y</Text>
          {restaurant.dishes.length ? (
            restaurant.dishes.map((dish) => (
              <View key={dish} className="rounded-xl bg-muted/60 px-3 py-2">
                <Text className="text-sm text-foreground">{dish}</Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-muted-foreground">Quan chua co danh sach mon.</Text>
          )}
        </View>
      </View>
    </SiteScreen>
  );
}

