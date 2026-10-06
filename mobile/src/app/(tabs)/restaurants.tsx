import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { Link, type Href } from 'expo-router';
import { ClipboardList, LocateFixed, MapPin, Plus, RotateCcw, Search } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RadarMap } from '@/features/restaurant/components/radar-map';
import { RestaurantCard } from '@/features/restaurant/components/restaurant-card';
import { useGeocodeMutation, useRestaurantDiscoveryQuery } from '@/features/restaurant/queries/restaurant.queries';
import {
  DEFAULT_RADIUS_M,
  DIET_PATTERN_OPTIONS,
  MIN_ADDRESS_LENGTH,
  RADIUS_OPTIONS_M,
} from '@/features/restaurant/schemas/restaurant.schema';
import type {
  LocationQuery,
  LocationSource,
  RestaurantDietPattern,
} from '@/features/restaurant/types/restaurant.model';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

interface UserLocation {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
}

function discoveryErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code === 'LOCATION_REQUIRED') return 'Cần có vị trí để tìm quán. Hãy cho phép vị trí hoặc nhập địa chỉ.';
  if (code === 'LOCATION_CONSENT_REQUIRED') return 'Bạn cần đồng ý chia sẻ vị trí thiết bị để tìm quán gần bạn.';
  if (code === 'EXTERNAL_LOCATION_UNAVAILABLE') {
    return 'Dịch vụ bản đồ bên ngoài tạm thời không khả dụng, vui lòng thử lại sau.';
  }
  return getApiErrorMessage(error, 'Không tải được danh sách quán.');
}

/**
 * "Bản đồ quán" — đồng bộ `frontend/src/app/(site)/restaurants/page.tsx`: chọn vị trí (GPS hoặc địa chỉ)
 * → bộ lọc từ khóa/bán kính/chế độ ăn → bản đồ trực quan + danh sách → đề xuất quán mới.
 * Dữ liệu lấy từ API thật (`/restaurants/nearby|search`, `/location/geocode`). Vị trí chỉ gửi theo từng
 * yêu cầu, backend không lưu lại.
 */
export default function RestaurantsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [location, setLocation] = React.useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = React.useState<string | null>(null);
  const [isChangingLocation, setIsChangingLocation] = React.useState(false);
  const [requestingLocation, setRequestingLocation] = React.useState(false);
  const [addressText, setAddressText] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [radiusM, setRadiusM] = React.useState<number>(DEFAULT_RADIUS_M);
  const [dietPattern, setDietPattern] = React.useState<RestaurantDietPattern | undefined>(undefined);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const geocode = useGeocodeMutation();
  const debouncedKeyword = useDebouncedValue(keyword, 500);

  const query = React.useMemo<LocationQuery | null>(
    () =>
      location
        ? {
            lat: location.lat,
            lng: location.lng,
            radiusM,
            query: debouncedKeyword,
            dietPattern,
            source: location.source,
          }
        : null,
    [location, radiusM, debouncedKeyword, dietPattern]
  );

  const { data, isLoading, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useRestaurantDiscoveryQuery(query);
  const restaurants = data?.pages.flatMap((page) => page.items) ?? [];
  const meta = data?.pages[data.pages.length - 1]?.meta;
  const totalFound = data?.pages[0]?.meta.total ?? restaurants.length;
  const attributions = Array.from(new Set(restaurants.map((item) => item.attribution).filter(Boolean)));

  const requestDeviceLocation = async () => {
    setRequestingLocation(true);
    setLocationMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationMessage('Chưa có quyền vị trí. Vui lòng nhập địa chỉ để tìm quán.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: 'Vị trí hiện tại của bạn',
        source: 'DEVICE',
      });
      setIsChangingLocation(false);
      setSelectedId(null);
    } catch {
      setLocationMessage('Không lấy được vị trí. Vui lòng nhập địa chỉ thay thế.');
    } finally {
      setRequestingLocation(false);
    }
  };

  const submitAddress = async () => {
    const trimmed = addressText.trim();
    if (trimmed.length < MIN_ADDRESS_LENGTH) {
      setLocationMessage(`Vui lòng nhập địa chỉ cụ thể hơn (tối thiểu ${MIN_ADDRESS_LENGTH} ký tự).`);
      return;
    }
    setLocationMessage(null);
    try {
      const result = await geocode.mutateAsync(trimmed);
      if (!result) {
        setLocationMessage('Không tìm thấy địa chỉ này. Hãy thử nhập chi tiết hơn.');
        return;
      }
      setLocation({ lat: result.lat, lng: result.lng, label: result.label || trimmed, source: 'MANUAL' });
      setIsChangingLocation(false);
      setSelectedId(null);
    } catch (geocodeError) {
      setLocationMessage(
        getApiErrorCode(geocodeError) === 'EXTERNAL_LOCATION_UNAVAILABLE'
          ? 'Dịch vụ tìm địa chỉ tạm thời không khả dụng. Vui lòng thử lại sau.'
          : getApiErrorMessage(geocodeError, 'Không phân giải được địa chỉ. Vui lòng thử lại.')
      );
    }
  };

  const showLocationPicker = !location || isChangingLocation;

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Khám phá quán chay</Text>
          {location ? (
            <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
              <MapPin size={14} color={colors.primary} />
              <Text className="text-sm font-medium text-foreground">{location.label}</Text>
              <Pressable onPress={() => setIsChangingLocation(true)} className="flex-row items-center gap-1 px-1">
                <RotateCcw size={12} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">Đổi vị trí</Text>
              </Pressable>
            </View>
          ) : (
            <Text className="mt-1 text-sm text-muted-foreground">
              Cho phép vị trí hoặc nhập địa chỉ để tìm quán chay gần bạn nhất.
            </Text>
          )}
        </View>

        {showLocationPicker ? (
          <View className="gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">Chọn khu vực tìm kiếm</Text>
              {location ? (
                <Pressable onPress={() => setIsChangingLocation(false)}>
                  <Text className="text-xs font-semibold text-primary">Hủy</Text>
                </Pressable>
              ) : null}
            </View>
            <PrimaryButton
              label={requestingLocation ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
              icon={<LocateFixed size={16} color={colors.primaryForeground} />}
              loading={requestingLocation}
              onPress={() => void requestDeviceLocation()}
            />
            <Text className="text-center text-[11px] text-muted-foreground">
              Vị trí chỉ dùng để tìm quán gần bạn và không được lưu lại.
            </Text>
            <Text className="text-center text-xs text-muted-foreground">— hoặc —</Text>
            <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3.5">
              <MapPin size={16} color={colors.mutedForeground} />
              <TextInput
                value={addressText}
                onChangeText={setAddressText}
                onSubmitEditing={() => void submitAddress()}
                returnKeyType="search"
                placeholder="Nhập địa chỉ (VD: Hồ Gươm, Hà Nội)"
                placeholderTextColor={colors.mutedForeground}
                className="h-12 flex-1 text-sm text-foreground"
              />
            </View>
            <PrimaryButton
              label={geocode.isPending ? 'Đang tìm...' : 'Tìm quán theo địa chỉ'}
              variant="outline"
              loading={geocode.isPending}
              onPress={() => void submitAddress()}
            />
            {locationMessage ? <Text className="text-xs text-destructive">{locationMessage}</Text> : null}
          </View>
        ) : null}

        {location ? (
          <>
            <View className="gap-3">
              <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3.5">
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                  value={keyword}
                  onChangeText={setKeyword}
                  placeholder="Tìm theo tên hoặc món (VD: phở chay, bún riêu...)"
                  placeholderTextColor={colors.mutedForeground}
                  className="h-11 flex-1 text-sm text-foreground"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-medium text-muted-foreground">Bán kính tìm kiếm</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {RADIUS_OPTIONS_M.map((option) => {
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

              <View className="gap-1.5">
                <Text className="text-xs font-medium text-muted-foreground">Lọc chế độ ăn</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {[{ value: undefined, label: 'Tất cả' }, ...DIET_PATTERN_OPTIONS].map((option) => {
                    const selected = dietPattern === option.value;
                    return (
                      <Pressable
                        key={option.label}
                        onPress={() => setDietPattern(option.value as RestaurantDietPattern | undefined)}
                        className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
                        <Text
                          className={cn(
                            'text-xs font-medium',
                            selected ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <RadarMap
              items={restaurants}
              center={{ lat: location.lat, lng: location.lng }}
              radiusM={radiusM}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-base font-bold text-foreground">
                Quán chay lân cận ({totalFound})
              </Text>
              {isAuthenticated ? (
                <Link href={'/restaurants/new' as Href} asChild>
                  <Pressable className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-1.5">
                    <Plus size={13} color={colors.primaryForeground} />
                    <Text className="text-xs font-semibold text-primary-foreground">Đề xuất quán</Text>
                  </Pressable>
                </Link>
              ) : (
                <Link href={'/(auth)/login' as Href} asChild>
                  <Pressable className="rounded-full border border-input px-3 py-1.5">
                    <Text className="text-xs font-medium text-foreground">Đăng nhập để đề xuất</Text>
                  </Pressable>
                </Link>
              )}
            </View>

            {isAuthenticated ? (
              <Link href={'/restaurants/mine' as Href} asChild>
                <Pressable className="flex-row items-center gap-1.5 self-start">
                  <ClipboardList size={14} color={colors.primary} />
                  <Text className="text-xs font-semibold text-primary">Quán tôi đã đề xuất</Text>
                </Pressable>
              </Link>
            ) : null}

            {meta?.externalDataUnavailable ? (
              <Text className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Dữ liệu từ dịch vụ bản đồ bên ngoài đang tạm thời không khả dụng. Danh sách chỉ gồm quán đã được
                VeggieConnect duyệt.
              </Text>
            ) : null}

            <View className="gap-3">
              {isLoading ? (
                <LoadingState message="Đang tìm quán chay quanh bạn..." />
              ) : isError ? (
                <ErrorState
                  title="Không tải được danh sách quán."
                  description={discoveryErrorMessage(error)}
                  onRetry={() => void refetch()}
                />
              ) : restaurants.length === 0 ? (
                <EmptyState
                  title="Không tìm thấy quán phù hợp"
                  description="Thử mở rộng bán kính (10 km, 20 km), đổi từ khóa hoặc bỏ bộ lọc chế độ ăn."
                />
              ) : (
                <>
                  {restaurants.map((restaurant, index) => (
                    <View key={restaurant.id} className="flex-row items-start gap-2">
                      <View className="mt-4 h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Text className="text-[10px] font-bold text-primary-foreground">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <RestaurantCard
                          restaurant={restaurant}
                          isSelected={selectedId === restaurant.id}
                          onSelect={setSelectedId}
                        />
                      </View>
                    </View>
                  ))}
                  {hasNextPage ? (
                    <PrimaryButton
                      label={isFetchingNextPage ? 'Đang tải...' : `Tải thêm (${restaurants.length}/${totalFound})`}
                      variant="outline"
                      loading={isFetchingNextPage}
                      onPress={() => void fetchNextPage()}
                    />
                  ) : null}
                  {meta?.resultsTruncated ? (
                    <Text className="text-center text-xs text-muted-foreground">
                      Chỉ hiển thị một phần kết quả. Hãy thu hẹp bán kính hoặc thêm từ khóa để xem chính xác hơn.
                    </Text>
                  ) : null}
                  {attributions.length > 0 ? (
                    <Text className="text-center text-[11px] text-muted-foreground">
                      Nguồn dữ liệu: {attributions.join(', ')}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </>
        ) : null}
      </View>
    </SiteScreen>
  );
}
