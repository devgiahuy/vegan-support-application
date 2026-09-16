'use client';

import * as React from 'react';
import { Search, MapPin, Plus, Moon, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
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
import { EmptyState } from '@/components/shared/empty-state';

const DISTRICTS = ['Quận 1, TP.HCM', 'Quận 3, TP.HCM', 'Bình Thạnh, TP.HCM', 'Thủ Đức, TP.HCM'];
const RADII = ['5km', '10km', '20km', 'Tất cả'];
const PRICES = ['$', '$$', '$$$'];
const TYPES = ['Buffet chay', 'Cơm văn phòng', 'Lẩu dưỡng sinh', 'Cafe hữu cơ'];

export default function RestaurantMapPage() {
  const [radius, setRadius] = React.useState('5km');
  const [price, setPrice] = React.useState('$$');
  const [type, setType] = React.useState('Buffet chay');

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
            <MapPin className="h-3.5 w-3.5 text-primary" /> Bản đồ quán chay sắp ra mắt
          </Badge>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-2xl border bg-background/95 px-4 py-2.5 text-sm shadow-sm">
            <Moon className="h-4 w-4 text-cta" />
            <span>
              <strong>Lịch ăn chay:</strong> Rằm tháng này
            </span>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3 xl:col-span-5">
          <div>
            <h2 className="font-bold">Quán chay xung quanh</h2>
            <p className="text-xs text-muted-foreground">
              Trong bán kính {radius} • Quận 1 &amp; lân cận
            </p>
          </div>

          <EmptyState
            title="Chưa có dữ liệu quán ăn"
            description="Danh sách quán chay sẽ hiển thị ngay khi API địa điểm (SRS UC-12) sẵn sàng. Bạn có thể đóng góp quán quen để lên sóng đầu tiên."
          />
        </div>
      </div>

      <p className="mt-6 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
        Bản đồ minh hoạ giai đoạn UI. Tích hợp Google Maps Platform (Maps SDK, Places, Directions)
        theo SRS UC-12 sẽ được làm khi có API key.
      </p>

      <Card className="mt-4 border-dashed">
        <CardContent className="p-6 text-center">
          <p className="font-semibold text-foreground">Biết quán chay ngon chưa có trên bản đồ?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhấn nút “Đóng góp quán” phía trên — mỗi quán được duyệt nhận 50 Điểm Xanh.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
