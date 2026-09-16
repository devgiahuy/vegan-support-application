'use client';

import * as React from 'react';
import {
  Search,
  MapPin,
  Star,
  Clock,
  BadgeCheck,
  Navigation,
  Plus,
  Heart,
  Radar,
  Moon,
  Crosshair,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RestaurantDetailSheet } from '@/features/restaurant/components/restaurant-detail-sheet';
import { MOCK_RESTAURANTS } from '@/features/restaurant/data/mock-restaurants';
import type { Restaurant } from '@/features/restaurant/types/restaurant.model';

const DISTRICTS = ['Quận 1, TP.HCM', 'Quận 3, TP.HCM', 'Bình Thạnh, TP.HCM', 'Thủ Đức, TP.HCM'];
const RADII = ['5km', '10km', '20km', 'Tất cả'];
const PRICES = ['$', '$$', '$$$'];
const TYPES = ['Buffet chay', 'Cơm văn phòng', 'Lẩu dưỡng sinh', 'Cafe hữu cơ'];

const RESTAURANTS = MOCK_RESTAURANTS;

const MAP_MARKERS = [
  { label: 'Đóa Sen Vàng • 800m', top: '38%', left: '52%', active: true, id: 'sen-vang' },
  { label: 'Bình An • 1.2km', top: '60%', left: '30%', id: 'binh-an' },
  { label: 'Pi Bistro • 2.1km', top: '25%', left: '70%', id: 'pi-bistro' },
  { label: 'Mẹ Nấu • 3.4km', top: '70%', left: '62%', id: 'me-nau' },
];

export default function RestaurantMapPage() {
  const [radius, setRadius] = React.useState('5km');
  const [price, setPrice] = React.useState('$$');
  const [type, setType] = React.useState('Buffet chay');
  const [activeId, setActiveId] = React.useState('sen-vang');
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [selectedRestaurantForSheet, setSelectedRestaurantForSheet] =
    React.useState<Restaurant | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState<boolean>(false);

  const openSheetForRestaurant = (rest: Restaurant) => {
    setSelectedRestaurantForSheet(rest);
    setIsSheetOpen(true);
  };

  const toggleFav = (id: string) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6">
      {/* Search row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue="Quán chay thực dưỡng gần đây"
            placeholder="Tìm tên quán, món ăn hoặc địa chỉ..."
            className="h-12 rounded-full pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="h-2 w-2 rounded-full bg-primary" />
            </span>
            Vị trí hiện tại
          </Badge>
          <select
            aria-label="Chọn quận"
            className="h-9 rounded-full border bg-background px-3 text-sm"
            defaultValue={DISTRICTS[0]}
          >
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-1.5 rounded-full">
                <Plus className="h-4 w-4" /> Đóng góp quán
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Đóng góp quán chay mới</DialogTitle>
                <DialogDescription>
                  Bạn biết một quán chay ngon, nguyên liệu sạch chưa có trên bản đồ ChayXanh? Mỗi
                  quán được duyệt nhận 50 Điểm Xanh.
                </DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Cảm ơn bạn! ChayXanh sẽ xác minh trong 24 giờ.');
                }}
              >
                <div className="grid gap-1.5">
                  <Label>Tên quán chay *</Label>
                  <Input required placeholder="Ví dụ: Quán chay An Yên" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Quận / Huyện *</Label>
                  <Input required placeholder="Quận 1, TP.HCM" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Địa chỉ chính xác *</Label>
                  <Input required placeholder="Số nhà, đường..." />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Hủy
                    </Button>
                  </DialogClose>
                  <Button type="submit">Gửi kiểm duyệt</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter strip */}
      <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-sm text-muted-foreground">Bán kính:</span>
        {RADII.map((r) => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium',
              radius === r
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            )}
          >
            {r}
          </button>
        ))}
        <span className="ml-2 shrink-0 text-sm text-muted-foreground">Giá:</span>
        {PRICES.map((p) => (
          <button
            key={p}
            onClick={() => setPrice(p)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium',
              price === p
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            )}
          >
            {p}
          </button>
        ))}
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium',
              type === t
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            )}
          >
            {t}
          </button>
        ))}
        <label className="ml-2 flex shrink-0 items-center gap-2 text-sm">
          <Checkbox defaultChecked /> Đang mở cửa
        </label>
      </div>

      {/* Split view */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Map */}
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl border bg-secondary/30 xl:col-span-7">
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_25%_30%,rgba(46,125,50,0.16),transparent_45%),radial-gradient(circle_at_75%_60%,rgba(139,195,74,0.2),transparent_50%),linear-gradient(rgba(46,125,50,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(46,125,50,0.06)_1px,transparent_1px)] [background-size:auto,auto,44px_44px,44px_44px]" />

          {MAP_MARKERS.map((m) => {
            const isActive = m.label.startsWith('Đóa');
            return (
              <button
                key={m.label}
                onClick={() => {
                  setActiveId(m.id);
                  const found = RESTAURANTS.find((r) => r.id === m.id);
                  if (found) openSheetForRestaurant(found);
                }}
                aria-label={m.label}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: m.top, left: m.left }}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full shadow-md',
                    isActive ? 'bg-cta text-cta-foreground' : 'bg-primary text-primary-foreground'
                  )}
                >
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="absolute left-1/2 top-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-medium shadow-sm">
                  {m.label}
                </span>
              </button>
            );
          })}

          {/* Controls */}
          <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-full border bg-background/95 p-1 shadow-sm">
            <button aria-label="Phóng to" className="rounded-full p-2 hover:bg-accent">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button aria-label="Thu nhỏ" className="rounded-full p-2 hover:bg-accent">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button aria-label="Vị trí của tôi" className="rounded-full p-2 hover:bg-accent">
              <Crosshair className="h-4 w-4" />
            </button>
          </div>

          <Badge className="absolute left-3 top-3 gap-1.5 rounded-full bg-background/95 text-foreground shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-primary" /> 18 quán chay quanh bạn
          </Badge>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-2xl border bg-background/95 px-4 py-2.5 text-sm shadow-sm">
            <Moon className="h-4 w-4 text-cta" />
            <span>
              <strong>Lịch ăn chay:</strong> Rằm tháng này • 20+ quán có buffet đặc biệt
            </span>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3 xl:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">24 quán chay xung quanh</h2>
              <p className="text-xs text-muted-foreground">
                Trong bán kính {radius} • Quận 1 &amp; lân cận
              </p>
            </div>
            <select
              aria-label="Sắp xếp"
              className="rounded-full border bg-background px-3 py-1.5 text-sm"
            >
              <option>Gần nhất</option>
              <option>Đánh giá cao nhất</option>
              <option>Giá tốt nhất</option>
              <option>Nổi bật nhất</option>
            </select>
          </div>

          {RESTAURANTS.map((r) => (
            <Card key={r.id} className={cn(activeId === r.id && 'ring-2 ring-primary')}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{r.name}</h3>
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {r.badge && <Badge className={cn('rounded-full', r.badgeTone)}>{r.badge}</Badge>}
                  <Badge variant="outline" className="gap-1 rounded-full text-primary">
                    <Clock className="h-3 w-3" /> {r.open}
                  </Badge>
                  <button
                    aria-label="Lưu quán"
                    onClick={() => toggleFav(r.id)}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4',
                        favorites.includes(r.id) && 'fill-destructive text-destructive'
                      )}
                    />
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {r.distance} • {r.area} •{' '}
                  <span className="font-medium text-foreground">
                    <Star className="mr-0.5 inline h-3.5 w-3.5 fill-cta text-cta" />
                    {r.rating} ({r.reviews}) • {r.price}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{r.hours}</p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full text-[11px]">
                      {t}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full"
                    onClick={() => {
                      setActiveId(r.id);
                      openSheetForRestaurant(r);
                    }}
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 rounded-full"
                    onClick={() => toast.info('Mở dẫn đường với Google Maps (tích hợp sau)')}
                  >
                    <Navigation className="h-3.5 w-3.5" /> Chỉ đường
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="rounded-2xl border bg-accent p-4 text-sm">
            <p className="flex items-center gap-1.5 font-semibold">
              <Radar className="h-4 w-4 text-primary" /> Mở rộng vùng tìm kiếm?
            </p>
            <p className="mt-1 text-muted-foreground">
              Nâng bán kính lên 10km sẽ hiển thị thêm 18 quán chay phong phú khác tại Quận 3 và Bình
              Thạnh.
            </p>
            <button className="mt-2 font-medium text-primary hover:underline">
              Xem 18 quán trong 10km
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
        Bản đồ minh hoạ giai đoạn UI. Tích hợp Google Maps Platform (Maps SDK, Places, Directions)
        theo SRS UC-12 sẽ được làm khi có API key.
      </p>

      {/* Side Sheet xem nhanh chi tiết quán ăn */}
      <RestaurantDetailSheet
        restaurant={selectedRestaurantForSheet}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
}
