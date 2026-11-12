import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Link, type Href } from 'expo-router';
import { ArrowLeft, ArrowUpRight, ClipboardList, Compass, MapPin, Navigation, Plus, RefreshCw, RotateCcw } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { ErrorState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { AdvancedFiltersSheet } from '@/features/restaurant/components/advanced-filters-sheet';
import { LocationPanel } from '@/features/restaurant/components/location-panel';
import { RestaurantCard } from '@/features/restaurant/components/restaurant-card';
import { RestaurantFilters } from '@/features/restaurant/components/restaurant-filters';
import { RestaurantMap } from '@/features/restaurant/components/restaurant-map';
import { ResultNotice } from '@/features/restaurant/components/result-notice';
import { hasSearchKeyword } from '@/features/restaurant/mappers/restaurant.mapper';
import { useGeocodeMutation, useRestaurantDiscoveryQuery } from '@/features/restaurant/queries/restaurant.queries';
import { DEFAULT_RADIUS_M, MAX_RADIUS_M, MIN_ADDRESS_LENGTH } from '@/features/restaurant/schemas/restaurant.schema';
import type {
  LocationQuery,
  LocationSource,
  RestaurantAdvancedFilters,
  RestaurantBounds,
  RestaurantDietPattern,
  RestaurantSearchMode,
} from '@/features/restaurant/types/restaurant.model';
import { buildDiscoveryNotices } from '@/features/restaurant/utils/discovery-notices';
import { countActiveAdvancedFilters } from '@/features/restaurant/utils/restaurant-filters';
import { formatBoundsLabel, isBoundsUsable } from '@/features/restaurant/utils/restaurant-map-layout';
import { emptyStateCopy } from '@/features/restaurant/utils/restaurant-search-copy';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
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
 * "Quán chay gần bạn" — đồng bộ `frontend/src/app/(site)/restaurants/page.tsx`: chọn khu vực (vị trí thiết bị hoặc địa chỉ)
 * → bộ lọc tên quán/món ăn, bán kính, loại quán chay, bộ lọc nâng cao → danh sách quán và sơ đồ vị trí (chuyển qua lại bằng
 * "Danh sách / Bản đồ") → đề xuất quán mới. Vị trí chỉ gửi theo từng yêu cầu, backend không lưu lại.
 */
export default function RestaurantsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [location, setLocation] = React.useState<UserLocation | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [isChangingLocation, setIsChangingLocation] = React.useState(false);
  const [requestingLocation, setRequestingLocation] = React.useState(false);
  const [keyword, setKeyword] = React.useState('');
  const [radiusM, setRadiusM] = React.useState<number>(DEFAULT_RADIUS_M);
  const [dietPattern, setDietPattern] = React.useState<RestaurantDietPattern | undefined>(undefined);
  const [advanced, setAdvanced] = React.useState<RestaurantAdvancedFilters>({});
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  // Khung vùng đang xem trên sơ đồ (luôn cập nhật) và khung đã chốt khi bấm "Tìm trong vùng đang xem".
  const viewBoundsRef = React.useRef<RestaurantBounds | null>(null);
  const [hasViewBounds, setHasViewBounds] = React.useState(false);
  const [activeBounds, setActiveBounds] = React.useState<RestaurantBounds | undefined>(undefined);
  const [searchingArea, setSearchingArea] = React.useState(false);

  const geocode = useGeocodeMutation();
  const debouncedKeyword = useDebouncedValue(keyword, 500);

  const advancedCount = countActiveAdvancedFilters(advanced);
  const keywordActive = hasSearchKeyword(debouncedKeyword);
  const resolvedMode: RestaurantSearchMode = keywordActive ? 'KEYWORD' : searchingArea ? 'BOUNDS' : 'NEARBY';
  const hasFilters = keyword.length > 0 || dietPattern !== undefined || advancedCount > 0 || radiusM !== DEFAULT_RADIUS_M;

  const query = React.useMemo<LocationQuery | null>(
    () =>
      location
        ? {
            lat: location.lat,
            lng: location.lng,
            radiusM,
            query: debouncedKeyword,
            dietPattern,
            // Bộ lọc nâng cao chỉ thuộc endpoint `search`, nên bỏ khỏi khóa truy vấn khi chưa có từ khóa.
            advanced: keywordActive ? advanced : undefined,
            bounds: searchingArea ? activeBounds : undefined,
            source: location.source,
          }
        : null,
    [location, radiusM, debouncedKeyword, dietPattern, advanced, keywordActive, searchingArea, activeBounds]
  );

  const { data, isLoading, isFetching, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useRestaurantDiscoveryQuery(query);
  const restaurants = React.useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const lastMeta = data?.pages[data.pages.length - 1]?.meta;
  const externalResultsSuppressed = data?.pages.some((page) => page.meta.externalResultsSuppressed) ?? false;
  const totalFound = data?.pages[0]?.meta.total ?? restaurants.length;
  const notices = React.useMemo(
    () =>
      lastMeta && data
        ? buildDiscoveryNotices(
            {
              ...lastMeta,
              externalDataUnavailable: data.pages.some((page) => page.meta.externalDataUnavailable),
              externalResultsSuppressed,
              resultsTruncated: data.pages.some((page) => page.meta.resultsTruncated),
            },
            restaurants
          )
        : [],
    [data, lastMeta, externalResultsSuppressed, restaurants]
  );
  const isRefreshing = isFetching && !isFetchingNextPage && Boolean(data);
  const emptyCopy = emptyStateCopy(resolvedMode, externalResultsSuppressed);

  /** Đổi vị trí tìm kiếm thì bỏ khung vùng đã chốt, quay về tìm quanh vị trí mới. */
  const applyLocation = (next: UserLocation) => {
    setLocation(next);
    setLocationError(null);
    setIsChangingLocation(false);
    setActiveBounds(undefined);
    setSearchingArea(false);
    viewBoundsRef.current = null;
    setHasViewBounds(false);
    setSelectedId(null);
  };

  const requestDeviceLocation = async () => {
    setRequestingLocation(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Chưa có quyền vị trí. Vui lòng nhập địa chỉ để tìm quán chay.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      applyLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: 'Vị trí hiện tại của bạn',
        source: 'DEVICE',
      });
    } catch {
      setLocationError('Không lấy được vị trí. Vui lòng nhập địa chỉ để tìm quán chay thay thế.');
    } finally {
      setRequestingLocation(false);
    }
  };

  const submitAddress = async (address: string): Promise<boolean> => {
    const trimmed = address.trim();
    if (trimmed.length < MIN_ADDRESS_LENGTH) {
      setLocationError(`Vui lòng nhập địa chỉ rõ hơn (tối thiểu ${MIN_ADDRESS_LENGTH} ký tự).`);
      return false;
    }
    setLocationError(null);
    try {
      const result = await geocode.mutateAsync(trimmed);
      if (!result) {
        setLocationError('Không tìm thấy địa chỉ này. Bạn có thể thử cách viết khác.');
        return false;
      }
      applyLocation({ lat: result.lat, lng: result.lng, label: result.label || trimmed, source: 'MANUAL' });
      return true;
    } catch (geocodeError) {
      setLocationError(
        getApiErrorCode(geocodeError) === 'EXTERNAL_LOCATION_UNAVAILABLE'
          ? 'Dịch vụ tìm địa chỉ tạm thời không khả dụng. Vui lòng thử lại sau.'
          : getApiErrorMessage(geocodeError, 'Không phân giải được địa chỉ. Vui lòng thử lại hoặc dùng vị trí hiện tại.')
      );
      return false;
    }
  };

  const handleBoundsChange = React.useCallback((bounds: RestaurantBounds | null) => {
    viewBoundsRef.current = bounds;
    setHasViewBounds(isBoundsUsable(bounds));
  }, []);

  const handleSearchThisArea = () => {
    const bounds = viewBoundsRef.current;
    if (!isBoundsUsable(bounds)) return;
    setActiveBounds(bounds);
    setSearchingArea(true);
    setSelectedId(null);
  };

  const handleBackToNearby = () => {
    setSearchingArea(false);
    setActiveBounds(undefined);
    setSelectedId(null);
  };

  const clearAllFilters = () => {
    setKeyword('');
    setDietPattern(undefined);
    setAdvanced({});
    setRadiusM(DEFAULT_RADIUS_M);
  };

  const emptyHandlers: Record<string, () => void> = {
    'Nới bán kính': () => setRadiusM((current) => Math.min(current * 2, MAX_RADIUS_M)),
    'Đổi vị trí': () => setIsChangingLocation(true),
    'Xoá bộ lọc': clearAllFilters,
    'Xoá bộ lọc nâng cao': () => setAdvanced({}),
    'Xoá từ khóa': () => setKeyword(''),
  };
  const emptyActions = emptyCopy.actions.filter((label) => {
    if (label === 'Nới bán kính') return resolvedMode !== 'BOUNDS' && radiusM < MAX_RADIUS_M;
    if (label === 'Xoá bộ lọc') return hasFilters;
    if (label === 'Xoá bộ lọc nâng cao') return advancedCount > 0;
    if (label === 'Xoá từ khóa') return keywordActive;
    return true;
  });

  const resultTitle = resolvedMode === 'KEYWORD' ? 'Kết quả tìm kiếm' : searchingArea ? 'Quán trong vùng đang xem' : 'Gợi ý quanh bạn';
  const contributeHref = (isAuthenticated ? '/restaurants/new' : '/(auth)/login') as Href;

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="gap-3">
          {!location ? (
            <View className="flex-row items-center gap-2">
              <Compass size={16} color={colors.primary} />
              <Text className="text-sm font-medium text-primary">Khám phá địa điểm</Text>
            </View>
          ) : null}
          {location ? (
            <Text className="text-3xl font-semibold leading-tight text-foreground">Quán chay gần bạn</Text>
          ) : (
            <Text className="text-3xl font-semibold leading-tight text-foreground">
              Khám phá quán chay,{'\n'}
              <Text className="text-primary">ngay gần bạn.</Text>
            </Text>
          )}
          {!location ? (
            <Text className="text-sm leading-6 text-muted-foreground">Tìm một địa điểm hợp ý, xem đánh giá và chọn đường đi cho bữa chay tiếp theo.</Text>
          ) : (
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color={colors.primary} />
              <Text numberOfLines={1} className="shrink text-sm text-muted-foreground">
                {location.label}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Đổi khu vực tìm kiếm" onPress={() => setIsChangingLocation(true)} hitSlop={8} className="h-11 shrink-0 flex-row items-center gap-1.5 px-2">
                <RotateCcw size={16} color={colors.primary} />
                <Text className="text-sm font-medium text-primary">Đổi khu vực</Text>
              </Pressable>
            </View>
          )}
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={contributeHref} asChild>
              <Pressable accessibilityRole="button" className="h-11 flex-row items-center gap-2 rounded-xl border border-input bg-card px-4 active:bg-muted">
                <Plus size={16} color={colors.foreground} />
                <Text className="text-sm font-medium text-foreground">Đề xuất quán</Text>
              </Pressable>
            </Link>
            {isAuthenticated ? (
              <Link href={'/restaurants/mine' as Href} asChild>
                <Pressable className="flex-row items-center gap-1.5">
                  <ClipboardList size={14} color={colors.primary} />
                  <Text className="text-xs font-semibold text-primary">Quán tôi đã đề xuất</Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        </View>

        {!location || isChangingLocation ? (
          <LocationPanel
            hasLocation={Boolean(location)}
            locating={requestingLocation}
            geocoding={geocode.isPending}
            error={locationError}
            onUseMyLocation={() => void requestDeviceLocation()}
            onSubmitAddress={submitAddress}
            onCancel={() => {
              setIsChangingLocation(false);
              setLocationError(null);
            }}
          />
        ) : null}

        {location ? (
          <>
            <RestaurantFilters
              query={keyword}
              radiusM={radiusM}
              dietPattern={dietPattern}
              advancedCount={advancedCount}
              keywordActive={keywordActive}
              hasFilters={hasFilters}
              onQueryChange={setKeyword}
              onRadiusChange={setRadiusM}
              onDietPatternChange={setDietPattern}
              onOpenAdvanced={() => setAdvancedOpen(true)}
              onClearAll={clearAllFilters}
            />

            {searchingArea && activeBounds ? (
              <View className="gap-1 rounded-xl border border-border bg-muted/30 px-4 py-2">
                <Text className="text-xs leading-5 text-foreground">{formatBoundsLabel(activeBounds)}</Text>
                <Pressable accessibilityRole="button" onPress={handleBackToNearby} className="h-11 flex-row items-center gap-1.5 self-start">
                  <ArrowLeft size={16} color={colors.primary} />
                  <Text className="text-sm font-medium text-primary">Quay lại vị trí tìm kiếm</Text>
                </Pressable>
              </View>
            ) : null}

            <View className="gap-3">
              <View>
                <Text className="text-xl font-semibold text-foreground">{resultTitle}</Text>
                <Text accessibilityLiveRegion="polite" className="mt-1 text-sm text-muted-foreground">
                  {isLoading ? 'Đang tìm các địa điểm quanh đây…' : isError ? 'Chưa nhận được dữ liệu quán.' : `${totalFound} địa điểm được tìm thấy`}
                </Text>
              </View>
            </View>

            <View accessibilityLabel="Bản đồ các quán">
              <RestaurantMap
                items={restaurants}
                center={{ lat: location.lat, lng: location.lng }}
                radiusM={radiusM}
                isLoading={isLoading || isRefreshing}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onRadiusChange={searchingArea ? undefined : setRadiusM}
                onBoundsChange={handleBoundsChange}
                onSearchThisArea={handleSearchThisArea}
                canSearchThisArea={hasViewBounds}
                isSearchingArea={searchingArea}
                emptyTitle={isError ? 'Chưa tải được vị trí các quán' : emptyCopy.title}
                emptyDescription={isError ? 'Thử tải lại ở phần danh sách quán.' : emptyCopy.description}
              />
              <View className="mt-3 flex-row items-center justify-between gap-3 px-1">
                <Text className="flex-1 text-xs leading-5 text-muted-foreground">Vị trí và khoảng cách mang tính tham khảo.</Text>
                <Navigation size={16} color={colors.mutedForeground} />
              </View>
            </View>

            <View accessibilityLabel="Kết quả tìm quán" className="gap-4">
              {isLoading ? null : isError ? (
                <ErrorState title="Chưa tải được danh sách quán. Vui lòng thử lại." description={discoveryErrorMessage(error)} onRetry={() => void refetch()} />
              ) : (
                <>
                  <ResultNotice notices={notices} />
                  {isRefreshing ? (
                    <View accessibilityRole="progressbar" className="flex-row items-center gap-2">
                      <RefreshCw size={14} color={colors.mutedForeground} />
                      <Text className="text-xs text-muted-foreground">Đang cập nhật danh sách quán…</Text>
                    </View>
                  ) : null}
                  {restaurants.length === 0 ? (
                    <View className="items-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8">
                      <Text className="text-center font-semibold text-foreground">{emptyCopy.title}</Text>
                      <Text className="mt-1 text-center text-sm leading-5 text-muted-foreground">{emptyCopy.description}</Text>
                      <View className="mt-4 flex-row flex-wrap justify-center gap-2">
                        <Pressable accessibilityRole="button" onPress={() => void refetch()} className="h-11 justify-center rounded-xl border border-input bg-card px-4 active:bg-muted">
                          <Text className="text-sm font-medium text-foreground">Thử lại</Text>
                        </Pressable>
                        {emptyActions.map((label) => (
                          <Pressable key={label} accessibilityRole="button" onPress={emptyHandlers[label] ?? clearAllFilters} className="h-11 justify-center rounded-xl border border-input bg-card px-4 active:bg-muted">
                            <Text className="text-sm font-medium text-foreground">{label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View accessibilityLabel="Danh sách quán chay" className="gap-4">
                      {restaurants.map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                          isSelected={selectedId === restaurant.id}
                          onSelect={setSelectedId}
                        />
                      ))}
                      {hasNextPage ? (
                        <PrimaryButton
                          label={isFetchingNextPage ? 'Đang tải...' : `Tải thêm (${restaurants.length}/${totalFound})`}
                          variant="outline"
                          loading={isFetchingNextPage}
                          onPress={() => void fetchNextPage()}
                        />
                      ) : null}
                    </View>
                  )}
                </>
              )}
            </View>

            <View className="flex-row items-center justify-between gap-4 border-t border-border py-4">
              <Text className="flex-1 text-sm text-muted-foreground">Bạn biết một địa điểm chay khác?</Text>
              <Link href={contributeHref} asChild>
                <Pressable accessibilityRole="link" className="h-11 flex-row items-center gap-1">
                  <Text className="text-sm font-medium text-primary">Chia sẻ cùng cộng đồng</Text>
                  <ArrowUpRight size={16} color={colors.primary} />
                </Pressable>
              </Link>
            </View>
          </>
        ) : null}
      </View>

      {advancedOpen ? (
        <AdvancedFiltersSheet
          filters={advanced}
          hasKeyword={keywordActive}
          onApply={(next) => {
            setAdvanced(next);
            setAdvancedOpen(false);
          }}
          onClose={() => setAdvancedOpen(false)}
        />
      ) : null}
    </SiteScreen>
  );
}
