'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  List,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuthStore } from '@/store/useAuthStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
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

export default function RestaurantMapPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [location, setLocation] = React.useState<ResolvedLocation | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [isChangingLocation, setIsChangingLocation] = React.useState(false);
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
  const [mobileView, setMobileView] = React.useState<'list' | 'map'>('list');
  const boundsRef = React.useRef<RestaurantBounds | null>(null);
  const [activeBounds, setActiveBounds] = React.useState<RestaurantBounds | undefined>(undefined);
  const [hasViewBounds, setHasViewBounds] = React.useState(false);

  // Remember filters only. Coordinates, addresses and device consent stay in this page's memory.
  React.useEffect(() => {
    persistSearchFilters({ radiusM, query, dietPattern, advanced });
  }, [radiusM, query, dietPattern, advanced]);
  const debouncedQuery = useDebounce(query, 400);
  const baseSearchState = React.useMemo<RestaurantSearchState>(() => {
    const state: Omit<RestaurantSearchState, 'mode'> = {
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
    };
    return { ...state, mode: resolveSearchMode(state) ?? 'NEARBY' };
  }, [radiusM, debouncedQuery, dietPattern, advanced, location, searchingArea, activeBounds]);
  const resolvedMode = baseSearchState.mode;
  const [pagination, setPagination] = React.useState({ scope: '', page: 1 });
  const searchScope = JSON.stringify(baseSearchState);
  const page = pagination.scope === searchScope ? pagination.page : 1;
  const { data, isLoading, isFetching, isError, refetch } = useRestaurantDiscoveryQuery(
    { ...baseSearchState, page, limit: 20 },
    location !== null
  );
  const restaurants = data?.restaurants ?? [];
  const isQueryLoading = isLoading || (!data && !isError && location !== null);
  const isDataRefreshing = isFetching && Boolean(data);

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
  const handleBoundsChange = React.useCallback((bounds: RestaurantBounds | null) => {
    boundsRef.current = bounds;
    setHasViewBounds(isBoundsUsable(bounds));
  }, []);
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
  const expandRadius = React.useCallback(
    () => setRadiusM((current) => Math.min(current * 2, MAX_RADIUS_M)),
    []
  );
  const advancedCount = countActiveAdvancedFilters(advanced);
  const hasFilters =
    query.length > 0 ||
    dietPattern !== undefined ||
    advancedCount > 0 ||
    radiusM !== DEFAULT_RADIUS_M;
  const emptyCopy = React.useMemo(
    () => emptyStateCopy(resolvedMode, data?.meta.externalResultsSuppressed),
    [resolvedMode, data?.meta.externalResultsSuppressed]
  );
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
    advancedCount,
    debouncedQuery,
    expandRadius,
    clearAllFilters,
  ]);
  const resultTitle =
    resolvedMode === 'KEYWORD'
      ? 'Kết quả tìm kiếm'
      : searchingArea
        ? 'Quán trong vùng đang xem'
        : 'Gợi ý quanh bạn';

  const contributeAction = isAuthenticated ? (
    <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 rounded-xl bg-card">
          <Plus className="size-4" aria-hidden="true" />
          Đề xuất quán
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chia sẻ một quán chay bạn biết</DialogTitle>
          <DialogDescription>
            Quán sẽ được Ban quản trị xem xét trước khi xuất hiện công khai.
          </DialogDescription>
        </DialogHeader>
        <SubmitForm onDone={() => setSubmitOpen(false)} />
      </DialogContent>
    </Dialog>
  ) : (
    <Button asChild variant="outline" className="h-11 rounded-xl bg-card">
      <Link href={`/login?from=${encodeURIComponent('/restaurants')}`}>
        <Plus className="size-4" aria-hidden="true" />
        Đề xuất quán
      </Link>
    </Button>
  );

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-7">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex max-w-2xl flex-col gap-3">
          {!location && (
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Compass className="size-4" aria-hidden="true" />
              Khám phá địa điểm
            </p>
          )}
          <h1
            className={cn(
              'text-balance font-semibold leading-tight',
              location ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'
            )}
          >
            {location ? (
              'Quán chay gần bạn'
            ) : (
              <>
                Khám phá quán chay,
                <br />
                <span className="text-primary">ngay gần bạn.</span>
              </>
            )}
          </h1>
          {!location && (
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tìm một địa điểm hợp ý, xem đánh giá và chọn đường đi cho bữa chay tiếp theo.
            </p>
          )}
          {location && (
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="line-clamp-1" title={location.label}>
                {location.label}
              </span>
              <Button
                variant="ghost"
                className="h-11 shrink-0 rounded-lg px-2 text-primary"
                onClick={() => setIsChangingLocation(true)}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Đổi khu vực</span>
                <span className="sr-only sm:hidden">Đổi khu vực tìm kiếm</span>
              </Button>
            </div>
          )}
        </div>
        <div className="pt-1">{contributeAction}</div>
      </header>

      {(!location || isChangingLocation) && (
        <section
          className={cn(
            'overflow-hidden rounded-2xl border bg-card',
            !location && 'grid lg:grid-cols-[1.2fr_1fr]'
          )}
          aria-labelledby="restaurant-location-title"
        >
          <div className="flex flex-col justify-center gap-6 p-5 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="restaurant-location-title" className="text-balance text-xl font-semibold">
                  {location ? 'Tìm ở một khu vực khác' : 'Bạn muốn tìm quán ở đâu?'}
                </h2>
                <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                  Chọn vị trí hiện tại hoặc nhập địa chỉ để khám phá các quán chay lân cận.
                </p>
              </div>
              {location && (
                <Button variant="ghost" onClick={() => setIsChangingLocation(false)}>
                  Hủy
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <LocationPrompt onLocated={applyLocation} onDenied={setLocationError} />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                hoặc tìm theo địa chỉ
                <span className="h-px flex-1 bg-border" />
              </div>
              <AddressForm onResolved={applyLocation} onDenied={setLocationError} />
            </div>
            {locationError && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {locationError}
              </p>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Vị trí của bạn chỉ dùng cho lần tìm này và không được lưu giữ.
            </p>
          </div>
          {!location && (
            <div
              className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-secondary/40 p-8"
              aria-hidden="true"
            >
              <svg
                className="absolute inset-0 size-full"
                viewBox="0 0 500 400"
                preserveAspectRatio="xMidYMid slice"
              >
                <g fill="none" stroke="var(--background)" strokeWidth="24">
                  <path d="M-30 80 L540 290 M80 -30 L350 440 M430 -30 L170 440 M-30 330 L540 120" />
                </g>
                <circle
                  cx="250"
                  cy="200"
                  r="115"
                  fill="var(--primary)"
                  fillOpacity=".04"
                  stroke="var(--primary)"
                  strokeOpacity=".15"
                  strokeDasharray="5 8"
                />
              </svg>
              <div className="relative flex flex-col items-center gap-4 rounded-2xl border bg-background px-8 py-7 text-center shadow-sm">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <MapPin className="size-8" strokeWidth={1.5} />
                </span>
                <p className="text-lg font-semibold">
                  Bữa chay tiếp theo
                  <br />
                  bắt đầu từ đây.
                </p>
                <p className="max-w-52 text-sm leading-relaxed text-muted-foreground">
                  Chọn khu vực để xem những địa điểm quanh bạn.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {location && (
        <>
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
          {searchingArea && activeBounds && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 px-4 py-2 text-xs">
              <span>{formatBoundsLabel(activeBounds)}</span>
              <Button variant="ghost" className="h-11 rounded-lg" onClick={handleBackToNearby}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Quay lại vị trí tìm kiếm
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{resultTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                {isQueryLoading ? (
                  'Đang tìm các địa điểm quanh đây…'
                ) : isError ? (
                  'Chưa nhận được dữ liệu quán.'
                ) : (
                  <>
                    <span className="font-medium tabular-nums text-foreground">
                      {data?.meta.totalItems ?? restaurants.length}
                    </span>{' '}
                    địa điểm được tìm thấy
                  </>
                )}
              </p>
            </div>
            <p className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
              <MapPin className="size-4" aria-hidden="true" />
              Chọn ghim trên thẻ để định vị quán
            </p>
            <ToggleGroup
              type="single"
              value={mobileView}
              onValueChange={(value) => {
                if (value === 'list' || value === 'map') setMobileView(value);
              }}
              className="w-full rounded-xl border bg-muted/40 p-1 lg:hidden"
              aria-label="Chế độ xem quán"
            >
              <ToggleGroupItem
                value="list"
                className="h-11 flex-1 rounded-lg"
                aria-controls="restaurant-results"
              >
                <List className="size-4" aria-hidden="true" />
                Danh sách
              </ToggleGroupItem>
              <ToggleGroupItem
                value="map"
                className="h-11 flex-1 rounded-lg"
                aria-controls="restaurant-map-panel"
              >
                <MapIcon className="size-4" aria-hidden="true" />
                Bản đồ
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] xl:gap-8">
            <section
              id="restaurant-results"
              className={cn(
                'min-w-0 scroll-mt-24',
                mobileView === 'list' ? 'block' : 'hidden',
                'lg:block'
              )}
              aria-label="Kết quả tìm quán"
            >
              <RestaurantList
                result={data}
                isLoading={isQueryLoading}
                isFetching={isDataRefreshing}
                isError={isError}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  if (!isDesktop) setMobileView('map');
                }}
                onRetry={() => void refetch()}
                emptyTitle={emptyCopy.title}
                emptyDescription={emptyCopy.description}
                emptyActions={emptyActions}
              />
              {data && data.meta.totalPages > 1 && (
                <nav
                  aria-label="Phân trang quán"
                  className="mt-6 flex items-center justify-between gap-3 border-t pt-5"
                >
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    disabled={!data.meta.hasPrevPage || isQueryLoading || isFetching}
                    onClick={() => {
                      setPagination({ scope: searchScope, page: page - 1 });
                      setSelectedId(null);
                      document
                        .getElementById('restaurant-results')
                        ?.scrollIntoView({ block: 'start' });
                    }}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Trước
                  </Button>
                  <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                    Trang <span className="font-medium text-foreground">{page}</span> /{' '}
                    {data.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    disabled={!data.meta.hasNextPage || isQueryLoading || isFetching}
                    onClick={() => {
                      setPagination({ scope: searchScope, page: page + 1 });
                      setSelectedId(null);
                      document
                        .getElementById('restaurant-results')
                        ?.scrollIntoView({ block: 'start' });
                    }}
                  >
                    Sau
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </nav>
              )}
            </section>
            <aside
              id="restaurant-map-panel"
              className={cn(
                'min-w-0 lg:sticky lg:top-24',
                mobileView === 'map' ? 'block' : 'hidden',
                'lg:block'
              )}
              aria-label="Bản đồ các quán"
            >
              <div className="h-[65dvh] min-h-[480px] overflow-hidden rounded-2xl lg:h-[calc(100dvh-144px)] lg:max-h-[760px]">
                {(isDesktop || mobileView === 'map') && (
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
                    isLoading={isQueryLoading || isFetching}
                    emptyTitle={isError ? 'Chưa tải được vị trí các quán' : emptyCopy.title}
                    emptyDescription={
                      isError ? 'Thử tải lại ở phần danh sách quán.' : emptyCopy.description
                    }
                  />
                )}
              </div>
              <p className="mt-3 flex items-center justify-between gap-3 px-1 text-xs leading-relaxed text-muted-foreground">
                <span>Vị trí và khoảng cách mang tính tham khảo.</span>
                <Navigation className="size-4 shrink-0" aria-hidden="true" />
              </p>
            </aside>
          </div>
          <div className="flex items-center justify-between gap-4 border-t py-4 text-sm">
            <p className="text-muted-foreground">Bạn biết một địa điểm chay khác?</p>
            {isAuthenticated ? (
              <Button variant="link" onClick={() => setSubmitOpen(true)}>
                Chia sẻ cùng cộng đồng
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button asChild variant="link">
                <Link href={`/login?from=${encodeURIComponent('/restaurants')}`}>
                  Chia sẻ cùng cộng đồng
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
