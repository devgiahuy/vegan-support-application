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
import { DEFAULT_RADIUS_M } from '@/features/restaurant/schemas/restaurant.schema';
import type { LocationQuery } from '@/features/restaurant/types/restaurant.model';
import { useRestaurantDiscoveryQuery } from '@/features/restaurant/queries/restaurant.queries';
import {
  LocationPrompt,
  type UserCoordinates,
} from '@/features/restaurant/components/location-prompt';
import { AddressForm } from '@/features/restaurant/components/address-form';
import { RestaurantFilters } from '@/features/restaurant/components/restaurant-filters';
import { RestaurantList } from '@/features/restaurant/components/restaurant-list';
import { RestaurantMap } from '@/features/restaurant/components/restaurant-map';
import { SubmitForm } from '@/features/restaurant/components/submit-form';

/**
 * Trang Khám Phá Quán Chay (UC-12 / BL-16):
 * - Vị trí GPS hoặc Geocoding nhập tay.
 * - Tìm kiếm món ăn kèm bộ lọc chế độ ăn chay nghiêm ngặt.
 * - Bản đồ tương tác Google Maps kèm Radar Map trực quan đồng bộ 2 chiều với thẻ danh sách.
 * - Đề xuất quán chay mới do thành viên gửi.
 */
export default function RestaurantMapPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [coords, setCoords] = React.useState<UserCoordinates | null>(null);
  const [locationSource, setLocationSource] = React.useState<'MANUAL' | 'DEVICE'>('MANUAL');
  const [page, setPage] = React.useState(1);
  const [placeLabel, setPlaceLabel] = React.useState('');
  const [deniedMessage, setDeniedMessage] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [radiusM, setRadiusM] = React.useState(DEFAULT_RADIUS_M);
  const [dietaryTags, setDietaryTags] = React.useState<string[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [isChangingLocation, setIsChangingLocation] = React.useState(false);

  const searchQuery: LocationQuery = {
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    radiusM,
    query: query.trim(),
    dietaryTags,
    page,
    limit: 20,
    locationSource,
    ...(locationSource === 'DEVICE' ? { locationConsent: true } : {}),
  };

  // Sử dụng hook discovery tự động chuyển đổi an toàn giữa Nearby và Search
  const { data, isLoading, isError, refetch } = useRestaurantDiscoveryQuery(
    searchQuery,
    coords !== null
  );

  const restaurants = data?.items ?? [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khám phá quán chay</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {placeLabel ? (
              <>
                <MapPin className="size-4 shrink-0 text-emerald-600" />
                <span className="font-medium text-foreground">{placeLabel}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsChangingLocation(true)}
                >
                  <RotateCcw className="size-3" /> Đổi vị trí
                </Button>
              </>
            ) : (
              <span>Cho phép vị trí hoặc nhập địa chỉ để tìm quán chay gần bạn nhất.</span>
            )}
          </div>
        </div>
      </div>

      {(!coords || isChangingLocation) && (
        <div className="flex flex-col gap-3 rounded-2xl border p-4 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Chọn khu vực tìm kiếm</h2>
            {coords && (
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
          <LocationPrompt
            onLocated={(position) => {
              setCoords(position);
              setLocationSource('DEVICE');
              setPage(1);
              setPlaceLabel('Vị trí hiện tại của bạn');
              setDeniedMessage(null);
              setIsChangingLocation(false);
            }}
            onDenied={setDeniedMessage}
          />
          <p className="text-center text-xs text-muted-foreground">— hoặc —</p>
          <AddressForm
            onResolved={(position, label) => {
              setCoords(position);
              setLocationSource('MANUAL');
              setPage(1);
              setPlaceLabel(label);
              setDeniedMessage(null);
              setIsChangingLocation(false);
            }}
          />
          {deniedMessage && <p className="text-xs text-destructive">{deniedMessage}</p>}
        </div>
      )}

      {coords && (
        <>
          <RestaurantFilters
            query={query}
            radiusM={radiusM}
            dietaryTags={dietaryTags}
            onQueryChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            onRadiusChange={(value) => {
              setRadiusM(value);
              setPage(1);
            }}
            onDietaryTagsChange={(value) => {
              setDietaryTags(value);
              setPage(1);
            }}
          />

          {/* Layout Split View phong cách Google Maps / GrabFood */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Cột trái: Bản đồ cố định (Sticky Map), tối ưu hóa chiều cao hiển thị */}
            <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-20">
              <div className="h-[420px] lg:h-[calc(100vh-170px)] min-h-[420px] max-h-[750px] w-full rounded-2xl overflow-hidden shadow-xs">
                <RestaurantMap
                  items={restaurants}
                  userLocation={coords}
                  radiusM={radiusM}
                  selectedId={selectedId}
                  onSelectRestaurant={setSelectedId}
                  onRadiusChange={(value) => {
                    setRadiusM(value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Cột phải: Danh sách thẻ quán chay cuộn độc lập (Scrollable Cards) */}
            <div className="flex flex-col space-y-3 lg:col-span-5 xl:col-span-5">
              <div className="flex items-center justify-between gap-2 bg-background/95 pb-1 backdrop-blur-xs">
                <h2 className="text-base font-bold text-foreground">
                  Quán chay lân cận ({data?.metadata.totalItems ?? 0})
                </h2>
                {isAuthenticated ? (
                  <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5 rounded-full shadow-2xs">
                        <Plus className="size-4" /> Đề xuất quán
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
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

              {/* Danh sách cuộn mượt mà với thanh cuộn tinh tế */}
              <div className="lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1.5">
                <RestaurantList
                  items={restaurants}
                  isLoading={isLoading}
                  isError={isError}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  externalNotice={[
                    data?.externalDataUnavailable
                      ? 'Nguồn bản đồ đang chậm hoặc lỗi; danh sách có thể chưa đầy đủ. Bạn có thể thử lại.'
                      : '',
                    data?.externalResultsSuppressed
                      ? 'Đang áp dụng chế độ ăn, dị ứng hoặc quy tắc của bạn. Chỉ hiển thị quán có thông tin phù hợp đã được quản trị viên xem xét.'
                      : '',
                    data?.resultsTruncated
                      ? 'Danh sách đã đạt giới hạn tìm kiếm của nguồn bản đồ.'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onRetry={() => void refetch()}
                />
                {data && data.metadata.totalPages > 1 && (
                  <nav aria-label="Phân trang quán" className="flex items-center gap-3 py-3">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Trang trước
                    </Button>
                    <span className="text-sm tabular-nums">
                      {page} / {data.metadata.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!data.metadata.hasNextPage}
                      onClick={() => setPage(page + 1)}
                    >
                      Trang sau
                    </Button>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
