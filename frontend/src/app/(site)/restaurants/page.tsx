'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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
import { DEFAULT_RADIUS_M } from '@/features/restaurant/schemas/restaurant.schema';
import type { LocationQuery } from '@/features/restaurant/types/restaurant.model';
import { resolveProviderName } from '@/features/restaurant/providers/place-provider';
import { useRestaurantSearchQuery } from '@/features/restaurant/queries/restaurant.queries';
import {
  LocationPrompt,
  type UserCoordinates,
} from '@/features/restaurant/components/location-prompt';
import { AddressForm } from '@/features/restaurant/components/address-form';
import {
  RestaurantFilters,
  applyPlaceFilters,
  type DietFilter,
} from '@/features/restaurant/components/restaurant-filters';
import { RestaurantList } from '@/features/restaurant/components/restaurant-list';
import { RestaurantMap } from '@/features/restaurant/components/restaurant-map';
import { SubmitForm } from '@/features/restaurant/components/submit-form';

/**
 * Trang quán chay: vị trí/form địa chỉ + tìm món + bản đồ tương tác + list
 * đồng bộ 2 chiều (FR-001/FR-002). Nguồn dữ liệu qua PlaceProvider (mock khi
 * thiếu key Google); trang công khai, chỉ đóng góp quán cần đăng nhập (Q5).
 */
export default function RestaurantMapPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [coords, setCoords] = React.useState<UserCoordinates | null>(null);
  const [placeLabel, setPlaceLabel] = React.useState('');
  const [deniedMessage, setDeniedMessage] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [radiusM, setRadiusM] = React.useState(DEFAULT_RADIUS_M);
  const [diet, setDiet] = React.useState<DietFilter>('ALL');
  const [openNow, setOpenNow] = React.useState(false);
  const [minRating, setMinRating] = React.useState(0);
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = React.useState<string | null>(null);

  const searchQuery: LocationQuery = {
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    radiusM,
    query: query.trim(),
  };
  const { data, isLoading, isError, refetch } = useRestaurantSearchQuery(
    searchQuery,
    coords !== null
  );
  // Lọc phía ứng dụng trên cùng tập kết quả cho cả bản đồ và danh sách (FR-002/FR-004).
  const restaurants = React.useMemo(
    () => applyPlaceFilters(data?.items ?? [], { diet, openNow, minRating }),
    [data, diet, openNow, minRating]
  );
  const isLive = resolveProviderName() === 'google';

  const handleSelect = React.useCallback((id: string) => {
    setSelectedPlaceId(id);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(`restaurant-card-${id}`)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quán chay quanh đây</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {placeLabel ? `Khu vực: ${placeLabel}` : 'Cho phép vị trí hoặc nhập địa chỉ để bắt đầu.'}
        </p>
      </div>

      {!coords && (
        <div className="flex flex-col gap-3 rounded-2xl border p-4">
          <LocationPrompt
            onLocated={(position) => {
              setCoords(position);
              setPlaceLabel('Vị trí của bạn');
              setDeniedMessage(null);
            }}
            onDenied={setDeniedMessage}
          />
          <p className="text-center text-xs text-muted-foreground">— hoặc —</p>
          <AddressForm
            onResolved={(position, label) => {
              setCoords(position);
              setPlaceLabel(label);
              setDeniedMessage(null);
            }}
          />
          {deniedMessage && <p className="text-xs text-muted-foreground">{deniedMessage}</p>}
        </div>
      )}

      {coords && (
        <>
          <RestaurantFilters
            query={query}
            radiusM={radiusM}
            diet={diet}
            openNow={openNow}
            minRating={minRating}
            onQueryChange={setQuery}
            onRadiusChange={setRadiusM}
            onDietChange={setDiet}
            onOpenNowChange={setOpenNow}
            onMinRatingChange={setMinRating}
          />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <RestaurantMap
                items={restaurants}
                center={coords}
                selectedPlaceId={selectedPlaceId}
                onSelect={handleSelect}
              />
            </div>
            <div className="space-y-3 xl:col-span-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold">Quán chay xung quanh ({restaurants.length})</h2>
                {isAuthenticated ? (
                  <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5 rounded-full">
                        <Plus className="size-4" /> Đóng góp quán
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Đóng góp quán chay mới</DialogTitle>
                        <DialogDescription>
                          Quán vào hàng chờ duyệt trước khi hiển thị công khai.
                        </DialogDescription>
                      </DialogHeader>
                      <SubmitForm onDone={() => setSubmitOpen(false)} />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href={`/login?from=${encodeURIComponent('/restaurants')}`}>
                      Đăng nhập để đóng góp quán
                    </Link>
                  </Button>
                )}
              </div>
              <RestaurantList
                items={restaurants}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                selectedPlaceId={selectedPlaceId}
                onSelectCard={handleSelect}
                externalNotice={
                  isLive ? null : 'Dữ liệu minh họa — danh sách thật khi có khóa Google Maps.'
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
