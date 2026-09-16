'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Leaf,
  Star,
  Flame,
  BadgeCheck,
  UtensilsCrossed,
  MapPin,
  Navigation,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { MOCK_RECIPES } from '@/features/recipe/data/mock-recipes';
import { WhyRecommendedDialog } from '@/components/shared/why-recommended-dialog';
import { HeroFoodAnimation } from '@/components/home/hero-food-animation';

const CATEGORIES = [
  'Tất cả',
  'Món chính đậm vị',
  'Canh / Súp thanh nhiệt',
  'Salad & Gỏi tươi cuốn',
  'Bún / Mì / Phở',
  'Bánh chay truyền thống',
  'Đồ uống & Sữa hạt',
  'Mâm cỗ & Giả mặn',
];

const RESTAURANTS = [
  {
    name: 'Nhà hàng Chay Mãn Tự',
    rating: 4.9,
    distance: '0.8 km',
    open: 'Mở cửa (07:00 - 21:30)',
    desc: 'Buffet tùy tâm • Không gian thiền thanh tịnh',
    tag: 'Buffet chay',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
  },
  {
    name: 'Bếp Chay Thanh Lương',
    rating: 4.8,
    distance: '1.2 km',
    open: 'Mở cửa (06:30 - 20:00)',
    desc: 'Bún bò Huế chay, cơm phần văn phòng thơm ngon',
    tag: 'Bình dân',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200&q=80',
  },
  {
    name: 'Quán Cơm Chay Tịnh Tâm',
    rating: 4.7,
    distance: '2.1 km',
    open: 'Mở cửa (08:00 - 22:00)',
    desc: 'Cơm niêu nấm kho quẹt • Lẩu nấm tươi dưỡng sinh',
    tag: 'Gia đình',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=200&q=80',
  },
];

const WEEK_DAYS = [
  { label: 'T2', date: 14 },
  { label: 'T3', date: 15, active: true },
  { label: 'T4', date: 16 },
  { label: 'T5', date: 17 },
  { label: 'T6', date: 18 },
  { label: 'T7', date: 19, weekend: true },
  { label: 'CN', date: 20, weekend: true },
];

export default function HomePage() {
  const recipes = MOCK_RECIPES.slice(0, 4);
  const [personalizationEnabled, setPersonalizationEnabled] = React.useState(true);
  const [isWhyDialogOpen, setIsWhyDialogOpen] = React.useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 lg:px-6">
      {/* Hero */}
      <section className="relative grid gap-8 pt-10 pb-12 lg:grid-cols-12 lg:pt-14">
        <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-secondary/50 blur-3xl" />
        <div className="absolute right-0 top-40 h-56 w-56 rounded-full bg-cta/10 blur-3xl" />

        <div className="relative lg:col-span-6 xl:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Leaf className="h-3.5 w-3.5" /> Ứng dụng hỗ trợ ăn chay #1 tại Việt Nam
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Ăn chay <span className="text-primary">đủ chất</span>, dễ dàng mỗi ngày
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Khám phá hàng trăm món chay thuần Việt chuẩn vị, tự động tính toán đạm &amp; calo cùng
            trợ lý AI dinh dưỡng thông minh cá nhân hoá theo thể trạng của bạn.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 rounded-full">
              <Link href="/recipes">
                <UtensilsCrossed className="h-5 w-5" /> Tìm công thức ngay
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2 rounded-full">
              <Link href="/assistant">
                <Sparkles className="h-5 w-5" /> Hỏi AI Dinh dưỡng
              </Link>
            </Button>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div>
              <dt className="text-2xl font-bold text-primary">500+</dt>
              <dd className="text-xs text-muted-foreground">Món thuần Việt</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-primary">50+</dt>
              <dd className="text-xs text-muted-foreground">Quán verified</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-cta">100%</dt>
              <dd className="text-xs text-muted-foreground">Đo Calo miễn phí</dd>
            </div>
          </dl>
        </div>

        <div className="relative lg:col-span-6 xl:col-span-5">
          <HeroFoodAnimation />
        </div>
      </section>

      {/* Categories */}
      <section className="py-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UtensilsCrossed className="h-4 w-4 text-primary" /> Danh mục món chay chọn lọc
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat, i) => (
            <span
              key={cat}
              className={
                i === 0
                  ? 'whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
                  : 'whitespace-nowrap rounded-full border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary'
              }
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Popular recipes */}
      <section className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cta">
              <TrendingUp className="h-4 w-4" /> Xu hướng tuần này
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Món chay được yêu thích nhất
            </h2>
          </div>
          <div className="flex gap-2">
            <Badge className="rounded-full bg-card text-primary shadow-sm">Mới nhất</Badge>
            <Badge variant="secondary" className="rounded-full">
              Nhanh gọn &lt;20p
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              Giàu đạm thực vật
            </Badge>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      {/* AI + Weekly plan split */}
      <section className="grid gap-6 py-10 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cta/15 text-cta">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cta">
                  ChayXanh AI Chat
                </p>
                <h3 className="text-lg font-bold">Hỏi AI Dinh Dưỡng Thực Vật</h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                Hôm nay tủ lạnh nhà em còn đậu hũ và bí đỏ thì nấu món gì vừa nhanh vừa đủ đạm vậy
                ChayXanh?
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-semibold">Gợi ý hoàn hảo cho bạn:</p>
                <div className="mt-2 rounded-xl border bg-card p-3">
                  <p className="font-medium">Canh bí đỏ hầm đậu hũ non &amp; hạt phỉ</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nấu chỉ 18 phút. Cung cấp 17.5g protein thực vật, giàu Vitamin A và kẽm giúp
                    tăng cường hệ miễn dịch mùa mưa.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full text-[11px]">
                      Bổ sung B12 từ nấm
                    </Badge>
                    <Badge variant="secondary" className="rounded-full text-[11px]">
                      Ít calo (220 kcal)
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Button asChild variant="secondary" className="mt-5 w-full gap-2 rounded-xl">
              <Link href="/assistant">
                Hỏi bất kỳ nguyên liệu hoặc mục tiêu cân nặng... <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kế hoạch ăn uống
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-lg font-bold">Thực đơn tuần cân bằng</h3>
                  <Badge
                    variant={personalizationEnabled ? 'default' : 'secondary'}
                    className={cn(
                      'text-[10px] rounded-full font-medium',
                      personalizationEnabled
                        ? 'bg-cta text-white hover:bg-cta/90'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {personalizationEnabled ? 'AI Cá nhân hoá' : 'Quy chuẩn'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWhyDialogOpen(true)}
                  className="h-8 gap-1 rounded-full text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Vì sao gợi ý này?
                </Button>
                <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full border">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    Cá nhân hoá:
                  </span>
                  <Switch
                    checked={personalizationEnabled}
                    onCheckedChange={(val) => {
                      setPersonalizationEnabled(val);
                      toast.success(
                        val
                          ? 'Đã bật gợi ý thực đơn cá nhân hóa theo hành vi.'
                          : 'Đã tắt cá nhân hóa. Thực đơn chuyển về quy chuẩn cố định.'
                      );
                    }}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2">
              {WEEK_DAYS.map((d) => (
                <div
                  key={d.label + d.date}
                  className={
                    d.active
                      ? 'rounded-xl bg-primary py-2 text-center text-primary-foreground'
                      : 'rounded-xl border py-2 text-center'
                  }
                >
                  <p className="text-xs font-medium">{d.label}</p>
                  <p
                    className={
                      d.weekend ? 'text-sm font-semibold text-cta' : 'text-sm font-semibold'
                    }
                  >
                    {d.date}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">☀️ Bữa trưa thuần khiết</p>
                  <p className="text-sm font-medium">
                    Cơm gạo lứt + Nấm kho tiêu + Canh cải bẹ xanh
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs font-semibold">480 kcal / 21g Đạm</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    <Moon className="mr-1 inline h-3 w-3" />
                    Bữa tối thanh nhẹ
                  </p>
                  <p className="text-sm font-medium">Phở nấm rơm rau củ quả ngọt lành</p>
                </div>
                <span className="whitespace-nowrap text-xs font-semibold">320 kcal / 14g Đạm</span>
              </div>
            </div>

            <Button asChild className="mt-5 w-full gap-2 rounded-xl">
              <Link href="/meal-plans">
                <CalendarDays className="h-4 w-4" /> Tạo thực đơn 7 ngày của riêng bạn
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Restaurants */}
      <section className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <MapPin className="h-4 w-4" /> Bản đồ ẩm thực
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Khám phá quán chay quanh bạn
            </h2>
          </div>
          <Button asChild variant="outline" className="gap-2 rounded-full">
            <Link href="/restaurants">
              <Navigation className="h-4 w-4" /> Mở bản đồ
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-3xl border bg-secondary/40 lg:col-span-5">
            <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_30%,rgba(46,125,50,0.18),transparent_45%),radial-gradient(circle_at_75%_70%,rgba(255,143,0,0.12),transparent_45%)]" />
            <div className="relative z-10 rounded-full border bg-background/90 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur">
              <MapPin className="mr-1 inline h-4 w-4 text-primary" /> 18 quán chay quanh bạn
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            {RESTAURANTS.map((r) => (
              <Card key={r.name} className="overflow-hidden">
                <CardContent className="flex gap-4 p-3 sm:p-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <Image src={r.image} alt={r.name} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{r.name}</h3>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Star className="h-3.5 w-3.5 fill-cta text-cta" /> {r.rating}
                      </span>
                      <span>{r.distance}</span>
                      <span className="text-primary">{r.open}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{r.desc}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="secondary" className="rounded-full">
                        {r.tag}
                      </Badge>
                      <Link
                        href="/restaurants"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Navigation className="h-3.5 w-3.5" /> Đường đi
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile FAB */}
      <Button
        asChild
        size="lg"
        className="fixed bottom-6 right-6 z-40 gap-2 rounded-full shadow-lg lg:hidden"
      >
        <Link href="/assistant">
          <Sparkles className="h-5 w-5" /> Hỏi AI nhanh
        </Link>
      </Button>

      {/* Why Recommended Dialog */}
      <WhyRecommendedDialog
        isOpen={isWhyDialogOpen}
        onClose={() => setIsWhyDialogOpen(false)}
        targetTitle="Gợi ý Thực đơn tuần tại Trang chủ"
      />
    </div>
  );
}
