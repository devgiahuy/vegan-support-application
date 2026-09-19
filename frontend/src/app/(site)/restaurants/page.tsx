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
import { useRestaurantSearchQuery } from '@/features/restaurant/queries/restaurant.queries';
import {
  LocationPrompt,
  type UserCoordinates,
} from '@/features/restaurant/components/location-prompt';
import { AddressForm } from '@/features/restaurant/components/address-form';
import { RestaurantFilters } from '@/features/restaurant/components/restaurant-filters';
import { RestaurantList } from '@/features/restaurant/components/restaurant-list';
import { MapPlaceholder } from '@/features/restaurant/components/map-placeholder';
import { SubmitForm } from '@/features/restaurant/components/submit-form';

/**
 * Trang quán chay: vị trí/form địa chỉ + tìm món + list + khung bản đồ.
 * Dữ liệu fixture ở phase scaffold (BE còn PLANNED, 0 gọi maps ngoài).
 */
export default function RestaurantMapPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [coords, setCoords] = React.useState<UserCoordinates | null>(null);
  const [placeLabel, setPlaceLabel] = React.useState('');
  const [deniedMessage, setDeniedMessage] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [radiusM, setRadiusM] = React.useState(DEFAULT_RADIUS_M);
  const [submitOpen, setSubmitOpen] = React.useState(false);

  const searchQuery: LocationQuery = {
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    radiusM,
    query: query.trim(),
  };
  const { data, isLoading, isError, refetch } = useRestaurantSearchQuery(
    searchQuery,
    coords !== null
  );
  const restaurants = data?.items ?? [];

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
            onQueryChange={setQuery}
            onRadiusChange={setRadiusM}
          />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <MapPlaceholder items={restaurants} />
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
                externalNotice="Dữ liệu minh họa — danh sách thật khi backend sẵn sàng."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
