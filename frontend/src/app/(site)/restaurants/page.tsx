'use client';

import * as React from 'react';
import Link from 'next/link';
import { MapPin, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/useAuthStore';
import { useDebounce } from '@/hooks/useDebounce';
import type { DietPattern } from '@/common/enums';
import { DEFAULT_RADIUS_M, MAX_RADIUS_M } from '@/features/restaurant/schemas/restaurant.schema';
import type {
  RestaurantBounds,
  RestaurantSearchState,
} from '@/features/restaurant/types/restaurant.model';
import { useRestaurantDiscoveryQuery } from '@/features/restaurant/queries/restaurant.queries';
import {
  countActiveAdvancedFilters,
  emptyStateCopy,
  MIN_KEYWORD_LENGTH,
  resolveSearchMode,
} from '@/features/restaurant/utils/restaurant-search';
import { formatBoundsLabel, isBoundsUsable } from '@/features/restaurant/utils/restaurant-bounds';
import {
  persistSearchFilters,
  readPersistedFilters,
} from '@/features/restaurant/utils/use-restaurant-search-session';
import {
  LocationPrompt,
  type ResolvedLocation,
} from '@/features/restaurant/components/location-prompt';
import { AddressForm } from '@/features/restaurant/components/address-form';
import { RestaurantFilters } from '@/features/restaurant/components/restaurant-filters';
import { RestaurantList } from '@/features/restaurant/components/restaurant-list';
import { RestaurantMap } from '@/features/restaurant/components/restaurant-map';
import { SubmitForm } from '@/features/restaurant/components/submit-form';

/**
 * Trang Khám Phá Quán Chay (UC-12 / BL-16).
 *
 * Luồng: chọn vị trí (thiết bị hoặc địa chỉ) → bộ lọc → bản đồ và danh sách đồng bộ hai chiều →
 * đề xuất quán mới.
 *
 * Ràng buộc riêng tư (FR-029/FR-030/FR-031): tọa độ người dùng chỉ nằm trong state của trang và
 * KHÔNG được lưu. `sessionStorage` chỉ giữ bộ lọc; mỗi lần mở trang phải xác nhận lại vị trí.
 */
export default function RestaurantMapPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [location, setLocation] = React.useState<ResolvedLocation | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [isChangingLocation, setIsChangingLocation] = React.useState(false);

  // Bộ lọc được khôi phục ngay ở lần render đầu — không cần effect setState để nạp.
  const [persistedFilters] = React.useState(readPersistedFilters);
  const [query, setQuery] = React.useState(persistedFilters?.query ?? '');
  const [radiusM, setRadiusM] = React.useState(persistedFilters?.radiusM ?? DEFAULT_RADIUS_M);
  const [dietPattern, setDietPattern] = React.useState<DietPattern | undefined>(
    persistedFilters?.dietPattern
  );
  const [advanced, setAdvanced] = React.useState<RestaurantSearchState['advanced']>(
    persistedFilters?.advanced ?? {}
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchingArea, setSearchingArea] = React.useState(false);
  const [submitOpen, setSubmitOpen] = React.useState(false);

  /**
   * Khung vùng đang xem trên bản đồ — nằm ở REF, không phải state.
   * Lý do: kéo/thu phóng bản đồ phải KHÔNG phát sinh request (SC-011); chỉ khi người dùng bấm
   * "Tìm trong vùng đang xem" mới copy sang state và đổi `queryKey`.
   */
  const boundsRef = React.useRef<RestaurantBounds | null>(null);
  const [activeBounds, setActiveBounds] = React.useState<RestaurantBounds | undefined>(undefined);
  /** Đã có vùng xem hợp lệ trên bản đồ hay chưa — chỉ dùng để bật/tắt nút tìm theo vùng. */
  const [hasViewBounds, setHasViewBounds] = React.useState(false);

  // Ghi bộ lọc vào phiên. Chỉ ghi bộ lọc — không có tọa độ (FR-029).
  React.useEffect(() => {
    persistSearchFilters({ radiusM, query, dietPattern, advanced });
  }, [radiusM, query, dietPattern, advanced]);

  /**
   * Từ khoá đã debounce: chỉ gửi truy vấn sau khi người dùng ngừng gõ.
   * Ô nhập vẫn phản hồi tức thì vì nó gắn vào `query`, không gắn vào giá trị debounce.
   */
  const debouncedQuery = useDebounce(query, 400);

  // Chế độ tìm quyết định tham số nào được gửi lên backend (FR-017).
  // PHẢI lấy từ `resolveSearchMode`, không hardcode 'NEARBY': nếu hardcode thì chế độ BOUNDS sẽ
  // gửi `lat`/`lng` thay vì `north`/`south`/`east`/`west` và nút "Tìm trong vùng đang xem" không
  // đổi được kết quả.
  const resolvedMode = React.useMemo(() => {
    const mode = resolveSearchMode({
      radiusM,
      query: debouncedQuery,
      dietPattern,
      advanced,
      ...(location
        ? {
            lat: location.lat,
            lng: location.lng,
            locationSource: location.source,
            locationConsent: location.source === 'DEVICE',
          }
        : {}),
      ...(searchingArea && activeBounds ? { bounds: activeBounds } : {}),
    });
    return mode ?? 'NEARBY';
  }, [radiusM, debouncedQuery, dietPattern, advanced, location, searchingArea, activeBounds]);

  const searchState: RestaurantSearchState = React.useMemo(
    () => ({
      mode: resolvedMode,
      radiusM,
      query: debouncedQuery,
      dietPattern,
      advanced,
      ...(location
        ? {
            lat: location.lat,
            lng: location.lng,
            locationSource: location.source,
            locationConsent: location.source === 'DEVICE',
          }
        : {}),
      ...(searchingArea && activeBounds ? { bounds: activeBounds } : {}),
    }),
    [
      resolvedMode,
      radiusM,
      debouncedQuery,
      dietPattern,
      advanced,
      location,
      searchingArea,
      activeBounds,
    ]
  );

  const { data, isLoading, isError, refetch } = useRestaurantDiscoveryQuery(
    searchState,
    location !== null
  );

  const restaurants = data?.restaurants ?? [];

  const applyLocation = React.useCallback((next: ResolvedLocation) => {
    setLocation(next);
    setLocationError(null);
    setIsChangingLocation(false);
    setActiveBounds(undefined);
    setSearchingArea(false);
    boundsRef.current = null;
    setHasViewBounds(false);
    setSelectedId(null);
  }, []);

  /**
   * Kéo/thu phóng bản đồ: chỉ ghi vào ref, tuyệt đối không refetch.
   * `hasViewBounds` là state mirror chỉ để bật/tắt nút "Tìm trong vùng đang xem" — nó không
   * nằm trong `searchState` nên không làm đổi `queryKey`.
   */
  const handleBoundsChange = React.useCallback((bounds: RestaurantBounds | null) => {
    boundsRef.current = bounds;
    setHasViewBounds(isBoundsUsable(bounds));
  }, []);

  // Người dùng bấm nút "Tìm trong vùng đang xem" — mới phát sinh truy vấn.
  const handleSearchThisArea = React.useCallback(() => {
    if (!boundsRef.current) return;
    setActiveBounds(boundsRef.current);
    setSearchingArea(true);
  }, []);

  const handleBackToNearby = React.useCallback(() => {
    setSearchingArea(false);
    setActiveBounds(undefined);
    boundsRef.current = null;
    setHasViewBounds(false);
  }, []);

  const clearAllFilters = React.useCallback(() => {
    setQuery('');
    setDietPattern(undefined);
    setAdvanced({});
    setRadiusM(DEFAULT_RADIUS_M);
  }, []);

  const expandRadius = React.useCallback(() => {
    setRadiusM((current) => Math.min(current * 2, 50000));
  }, []);

  const advancedCount = countActiveAdvancedFilters(advanced);
  const hasFilters = query.length > 0 || dietPattern !== undefined || advancedCount > 0;
  const showLocationStep = location === null || isChangingLocation;

  /** Nội dung trạng thái rỗng theo chế độ tìm (FR-010, FR-012). */
  const emptyCopy = React.useMemo(() => emptyStateCopy(resolvedMode), [resolvedMode]);

  /**
   * Nút hành động khi không có kết quả (FR-013): chỉ hiện hành động thực sự khả thi với chế độ hiện tại,
   * và mỗi hành động đều do người dùng chủ động bấm — KHÔNG tự gọi lại dữ liệu.
   * Mỗi nút phải BẤM ĐƯỢC VIỆC GÌ ĐÓ: nút "Xoá bộ lọc nâng cao" chỉ hiện khi thực sự có bộ lọc
   * nâng cao đang bật, nút "Xoá từ khóa" chỉ hiện khi có từ khóa.
   */
  const emptyActions = React.useMemo(() => {
    const handlers: Record<string, () => void> = {
      'Nới bán kính': expandRadius,
      'Đổi vị trí': () => setIsChangingLocation(true),
      'Xoá bộ lọc': clearAllFilters,
      'Xoá bộ lọc nâng cao': () => setAdvanced({}),
      'Xoá từ khóa': () => setQuery(''),
    };
    return emptyCopy.actions
      .filter((label) => {
        if (label === 'Nới bán kính') return resolvedMode !== 'BOUNDS' && radiusM < MAX_RADIUS_M;
        if (label === 'Xoá bộ lọc') return hasFilters;
        if (label === 'Xoá bộ lọc nâng cao') return advancedCount > 0;
        if (label === 'Xoá từ khóa') return debouncedQuery.trim().length >= MIN_KEYWORD_LENGTH;
        return true;
      })
      .map((label) => ({ label, onClick: handlers[label] ?? clearAllFilters }));
  }, [
    emptyCopy,
    resolvedMode,
    radiusM,
    hasFilters,
    debouncedQuery,
    advancedCount,
    expandRadius,
    clearAllFilters,
  ]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khám phá quán chay</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {location ? (
              <>
                <MapPin className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span className="font-medium text-foreground">{location.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsChangingLocation(true)}
                >
                  <RotateCcw className="size-3" aria-hidden="true" /> Đổi vị trí
                </Button>
              </>
            ) : (
              <span>Cho phép vị trí hoặc nhập địa chỉ để tìm quán chay gần bạn nhất.</span>
            )}
          </div>
        </div>
      </div>

      {showLocationStep && (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Chọn khu vực tìm kiếm</h2>
            {location && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsChangingLocation(false)}
              >
                Hủy
              </Button>
            )}
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <LocationPrompt
              onLocated={applyLocation}
              onDenied={(message) => setLocationError(message)}
            />
            <span className="text-xs text-muted-foreground sm:px-1">hoặc</span>
            <div className="w-full sm:flex-1">
              <AddressForm
                onResolved={applyLocation}
                onDenied={(message) => setLocationError(message)}
              />
            </div>
          </div>

          {locationError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {locationError}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Vị trí của bạn chỉ dùng cho lần tìm này và không được lưu giữ.
          </p>
        </section>
      )}

      {location && (
        <>
          {/* Nêu rõ vùng đang tìm khi dùng chế độ tìm theo vùng bản đồ (FR-006). */}
          {searchingArea && activeBounds && (
            <p className="rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {formatBoundsLabel(activeBounds)}
            </p>
          )}

          <RestaurantFilters
            query={query}
            radiusM={radiusM}
            dietPattern={dietPattern}
            advanced={advanced}
            searchMode={resolvedMode}
            onQueryChange={setQuery}
            onRadiusChange={setRadiusM}
            onDietPatternChange={setDietPattern}
            onAdvancedChange={setAdvanced}
            onClearAll={clearAllFilters}
          />

          {/* Split view: bản đồ cố định + danh sách cuộn độc lập */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:sticky lg:top-20 lg:col-span-7 xl:col-span-7">
              <div className="h-[420px] min-h-[420px] max-h-[750px] w-full overflow-hidden rounded-2xl shadow-xs lg:h-[calc(100vh-170px)]">
                <RestaurantMap
                  items={restaurants}
                  userLocation={location}
                  radiusM={radiusM}
                  selectedId={selectedId}
                  onSelectRestaurant={setSelectedId}
                  onRadiusChange={setRadiusM}
                  onBoundsChange={handleBoundsChange}
                  onSearchThisArea={handleSearchThisArea}
                  canSearchThisArea={hasViewBounds}
                  isSearchingArea={searchingArea}
                />
              </div>
              {searchingArea && (
                <div className="mt-2 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleBackToNearby}
                  >
                    Quay lại tìm quanh vị trí của tôi
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3 lg:col-span-5 xl:col-span-5">
              <div className="flex items-center justify-between gap-2 bg-background/95 pb-1 backdrop-blur-xs">
                <h2 className="text-base font-bold text-foreground">
                  {resolvedMode === 'KEYWORD'
                    ? 'Quán phù hợp từ khoá'
                    : resolvedMode === 'BOUNDS'
                      ? 'Quán trong vùng đang xem'
                      : 'Quán chay lân cận'}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    ({restaurants.length})
                  </span>
                </h2>

                {isAuthenticated ? (
                  <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5 rounded-full shadow-2xs">
                        <Plus className="size-4" aria-hidden="true" /> Đề xuất quán
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Đề xuất quán chay mới</DialogTitle>
                        <DialogDescription>
                          Quán sẽ được Ban quản trị xem xét và phê duyệt trước khi xuất hiện công
                          khai.
                        </DialogDescription>
                      </DialogHeader>
                      <SubmitForm onDone={() => setSubmitOpen(false)} />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button asChild size="sm" variant="outline" className="rounded-full shadow-2xs">
                    <Link href={`/login?from=${encodeURIComponent('/restaurants')}`}>
                      Đăng nhập để đề xuất
                    </Link>
                  </Button>
                )}
              </div>

              <div className="lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1.5">
                <RestaurantList
                  result={data}
                  isLoading={isLoading}
                  isError={isError}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRetry={() => void refetch()}
                  emptyTitle={emptyCopy.title}
                  emptyDescription={emptyCopy.description}
                  emptyActions={emptyActions}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
