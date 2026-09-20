import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { LocateFixed, Plus } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { MapPlaceholder } from '@/features/restaurant/components/map-placeholder';
import { RestaurantCard } from '@/features/restaurant/components/restaurant-card';
import { useGeocodeMutation, useRestaurantSearchQuery } from '@/features/restaurant/queries/restaurant.queries';
import { DEFAULT_RADIUS_M } from '@/features/restaurant/schemas/restaurant.schema';
import type { LocationQuery } from '@/features/restaurant/types/restaurant.model';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

const RADIUS_OPTIONS = [1000, 3000, 5000, 10000, 20000];

function notifyComingSoon(feature: string) {
  Alert.alert('Sắp ra mắt', `${feature} đang được VeggieConnect hoàn thiện, quay lại sau nhé!`);
}

/**
 * "Bản đồ quán" — đồng bộ bố cục `frontend/src/app/(site)/restaurants/page.tsx`:
 * xin vị trí (hoặc nhập địa chỉ) → bộ lọc món/bán kính → khung bản đồ minh hoạ + danh
 * sách. Toàn bộ dữ liệu là fixture (backend restaurants còn `PLANNED`, giống hệt web),
 * chỉ bước xin vị trí là thật (dùng `expo-location`, không có trên web bản gốc).
 */
export default function RestaurantsScreen() {
  const colors = useIconColors();
  const { isAuthenticated } = useAuthStore();
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [placeLabel, setPlaceLabel] = React.useState('');
  const [deniedMessage, setDeniedMessage] = React.useState<string | null>(null);
  const [addressText, setAddressText] = React.useState('');
  const [dishQuery, setDishQuery] = React.useState('');
  const [radiusM, setRadiusM] = React.useState(DEFAULT_RADIUS_M);
  const [requestingLocation, setRequestingLocation] = React.useState(false);

  const geocodeMutation = useGeocodeMutation();

  const searchQuery: LocationQuery = {
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    radiusM,
    query: dishQuery,
  };
  const { data, isLoading, isError, refetch } = useRestaurantSearchQuery(searchQuery, coords !== null);
  const restaurants = data?.items ?? [];

  const requestLocation = async () => {
    setRequestingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDeniedMessage('Không có quyền vị trí. Vui lòng nhập địa chỉ thay thế.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      setPlaceLabel('Vị trí của bạn');
      setDeniedMessage(null);
    } catch {
      setDeniedMessage('Không lấy được vị trí. Vui lòng nhập địa chỉ thay thế.');
    } finally {
      setRequestingLocation(false);
    }
  };

  const submitAddress = async () => {
    const trimmed = addressText.trim();
    if (!trimmed) return;
    const result = await geocodeMutation.mutateAsync(trimmed);
    if (result.lat === null || result.lng === null) {
      setDeniedMessage('Không tìm thấy địa chỉ này. Thử "Hồ Gươm" hoặc "Bến Thành" (dữ liệu minh hoạ).');
      return;
    }
    setCoords({ lat: result.lat, lng: result.lng });
    setPlaceLabel(result.label || trimmed);
    setDeniedMessage(null);
  };

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View>
          <Text className="text-xl font-bold text-foreground">Quán chay quanh đây</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {placeLabel ? `Khu vực: ${placeLabel}` : 'Cho phép vị trí hoặc nhập địa chỉ để bắt đầu.'}
          </Text>
        </View>

        {!coords ? (
          <View className="gap-3 rounded-2xl border border-border p-4">
            <PrimaryButton
              label={requestingLocation ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
              icon={<LocateFixed size={16} color={colors.primaryForeground} />}
              loading={requestingLocation}
              onPress={requestLocation}
            />
            <Text className="text-center text-xs text-muted-foreground">— hoặc —</Text>
            <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3.5">
              <TextInput
                value={addressText}
                onChangeText={setAddressText}
                placeholder="Nhập địa chỉ (vd: Hồ Gươm, Bến Thành...)"
                placeholderTextColor={colors.mutedForeground}
                className="h-12 flex-1 text-sm text-foreground"
              />
            </View>
            <PrimaryButton
              label={geocodeMutation.isPending ? 'Đang tìm...' : 'Tìm theo địa chỉ'}
              variant="outline"
              loading={geocodeMutation.isPending}
              onPress={() => void submitAddress()}
            />
            {deniedMessage ? <Text className="text-xs text-muted-foreground">{deniedMessage}</Text> : null}
          </View>
        ) : (
          <>
            {/* Bộ lọc */}
            <View className="gap-3">
              <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3.5">
                <TextInput
                  value={dishQuery}
                  onChangeText={setDishQuery}
                  placeholder="Tìm theo món (vd: bún bò, lẩu nấm...)"
                  placeholderTextColor={colors.mutedForeground}
                  className="h-11 flex-1 text-sm text-foreground"
                />
              </View>
              <View className="flex-row flex-wrap gap-1.5">
                {RADIUS_OPTIONS.map((option) => {
                  const selected = radiusM === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setRadiusM(option)}
                      className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
                      <Text
                        className={cn(
                          'text-xs font-medium',
                          selected ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}>
                        {option >= 1000 ? `${option / 1000} km` : `${option} m`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <MapPlaceholder items={restaurants} />

            <View className="flex-row items-center justify-between gap-2">
              <Text className="font-bold text-foreground">Quán chay xung quanh ({restaurants.length})</Text>
              {isAuthenticated ? (
                <Pressable
                  onPress={() => notifyComingSoon('Đóng góp quán')}
                  className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1.5">
                  <Plus size={13} color={colors.primaryForeground} />
                  <Text className="text-xs font-semibold text-primary-foreground">Đóng góp quán</Text>
                </Pressable>
              ) : (
                <Link href="/(auth)/login" asChild>
                  <Pressable className="rounded-full border border-input px-3 py-1.5">
                    <Text className="text-xs font-medium text-foreground">Đăng nhập để đóng góp</Text>
                  </Pressable>
                </Link>
              )}
            </View>

            <View className="gap-3">
              {isLoading ? (
                [1, 2, 3].map((i) => <View key={i} className="h-32 rounded-2xl border border-border bg-muted" />)
              ) : isError ? (
                <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
                  <Text className="font-semibold text-destructive">Không tải được danh sách quán.</Text>
                  <View className="mt-3">
                    <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetch()} />
                  </View>
                </View>
              ) : restaurants.length === 0 ? (
                <View className="items-center rounded-2xl border border-dashed border-border p-8">
                  <Text className="text-center font-semibold text-foreground">Không tìm thấy quán phù hợp</Text>
                  <Text className="mt-1 text-center text-sm text-muted-foreground">
                    Thử nới bán kính, đổi từ khóa hoặc địa chỉ khác.
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    Dữ liệu minh họa — danh sách thật khi backend sẵn sàng.
                  </Text>
                  {restaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </>
              )}
            </View>
          </>
        )}
      </View>
    </SiteScreen>
  );
}
