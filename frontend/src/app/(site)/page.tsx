'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Leaf,
  UtensilsCrossed,
  MapPin,
  Navigation,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  Moon,
  CheckCircle2,
  BookOpen,
  Layers,
  ChefHat,
  ShieldAlert,
  Scale,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { RecommendedForYou } from '@/features/recommendation/components/recommended-for-you';
import { WhyRecommendedDialog } from '@/components/shared/why-recommended-dialog';
import { HeroFoodAnimation } from '@/components/home/hero-food-animation';
import { VerticalCutReveal } from '@/components/ui/vertical-cut-reveal';

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
  const { data: recipesPagination, isLoading: isRecipesLoading } = useRecipesQuery({ limit: 4 });
  const recipes = recipesPagination?.items || [];
  const [personalizationEnabled, setPersonalizationEnabled] = React.useState(true);
  const [isWhyDialogOpen, setIsWhyDialogOpen] = React.useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 lg:px-6">
      {/* Hero */}
      <section className="relative grid gap-8 pt-10 pb-12 lg:grid-cols-12 lg:pt-14 overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-secondary/50 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-56 w-56 rounded-full bg-cta/10 blur-3xl" />

        <div className="relative lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
          {/* Badge với hiệu ứng glow nhẹ */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary shadow-xs backdrop-blur-md transition-all hover:border-primary/40 hover:bg-primary/15">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <Leaf className="h-3.5 w-3.5 text-primary" />
              <span>Ứng dụng hỗ trợ ăn chay #1 tại Việt Nam</span>
            </span>
          </motion.div>

          {/* Tiêu đề chính sử dụng VerticalCutReveal animation */}
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] xl:text-[3.65rem] leading-[1.14]">
            <span className="block">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.08}
                staggerFrom="first"
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              >
                Ăn chay
              </VerticalCutReveal>{' '}
              <span className="inline-block bg-gradient-to-r from-primary via-emerald-500 to-sprout bg-clip-text text-transparent">
                <VerticalCutReveal
                  splitBy="characters"
                  staggerDuration={0.035}
                  staggerFrom="first"
                  transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.15 }}
                >
                  đủ chất,
                </VerticalCutReveal>
              </span>
            </span>
            <span className="block mt-1 sm:mt-1.5 text-foreground">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.08}
                staggerFrom="first"
                transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.35 }}
              >
                dễ dàng mỗi ngày
              </VerticalCutReveal>
            </span>
          </h1>

          {/* Mô tả giải pháp với hiệu ứng fade-in mượt mà */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty"
          >
            Khám phá hàng trăm món chay thuần Việt chuẩn vị, tự động tính toán đạm &amp; calo cùng
            trợ lý AI dinh dưỡng thông minh cá nhân hoá theo thể trạng của bạn.
          </motion.p>

          {/* Nhóm nút kêu gọi hành động (CTAs) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 flex flex-wrap items-center gap-3.5"
          >
            <Button
              asChild
              size="lg"
              className="group relative gap-2.5 rounded-full px-6 py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
            >
              <Link href="/recipes">
                <UtensilsCrossed className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
                <span>Tìm công thức ngay</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group relative gap-2.5 rounded-full border border-border/80 bg-background/80 px-6 py-6 text-base font-semibold backdrop-blur-md hover:bg-accent hover:border-border hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
            >
              <Link href="/assistant">
                <Sparkles className="h-5 w-5 text-cta transition-transform duration-200 group-hover:scale-110" />
                <span>Hỏi AI Dinh dưỡng</span>
              </Link>
            </Button>
          </motion.div>

          {/* Social Proof & Cam kết */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1 font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Miễn phí 100%
            </span>
            <span>•</span>
            <span>Không yêu cầu thẻ tín dụng</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Cá nhân hóa theo thể trạng</span>
          </motion.div>

          {/* Thống kê nổi bật (Metric Cards) */}
          <motion.dl
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 grid grid-cols-3 gap-3 border-t border-border/70 pt-6 sm:gap-4"
          >
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card/90 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <UtensilsCrossed className="size-3.5" />
                </div>
                <dt className="text-xl sm:text-2xl font-bold tracking-tight text-primary">500+</dt>
              </div>
              <dd className="mt-1.5 text-xs font-medium text-foreground">Món thuần Việt</dd>
              <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                Định lượng &amp; chuẩn vị
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card/90 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <MapPin className="size-3.5" />
                </div>
                <dt className="text-xl sm:text-2xl font-bold tracking-tight text-primary">50+</dt>
              </div>
              <dd className="mt-1.5 text-xs font-medium text-foreground">Quán verified</dd>
              <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                Review từ cộng đồng
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-sm transition-all duration-200 hover:border-cta/40 hover:bg-card/90 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta transition-transform group-hover:scale-105">
                  <TrendingUp className="size-3.5" />
                </div>
                <dt className="text-xl sm:text-2xl font-bold tracking-tight text-cta">100%</dt>
              </div>
              <dd className="mt-1.5 text-xs font-medium text-foreground">Đo Calo &amp; Đạm</dd>
              <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                Tự động theo mục tiêu
              </p>
            </div>
          </motion.dl>
        </div>

        <div className="relative lg:col-span-6 xl:col-span-5">
          <HeroFoodAnimation />
        </div>
      </section>

      {/* Gợi ý cá nhân (member) — guest giữ khối phổ biến bên dưới */}
      <RecommendedForYou />

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
          {isRecipesLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
              />
            ))
          ) : recipes.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border/70 p-8 text-center">
              <p className="font-semibold text-foreground">Chưa có công thức nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hãy là người đầu tiên chia sẻ món chay của bạn với cộng đồng.
              </p>
              <Button asChild size="sm" className="mt-4 gap-1.5 rounded-full">
                <Link href="/recipes/new">Đăng công thức mới</Link>
              </Button>
            </div>
          ) : (
            recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)
          )}
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

      {/* Kho Dữ liệu Dinh dưỡng & Tra cứu Khoa học (Phase 12) */}
      <section className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <BookOpen className="h-4 w-4" /> Cơ sở dữ liệu chuẩn hóa
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Tra cứu Dinh dưỡng &amp; Kiến thức Khoa học
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Số liệu dinh dưỡng 100g có kiểm nghiệm nguồn gốc (USDA/NIN), quy tắc kiêng kỵ và
              phương pháp bảo tồn vi chất.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2 rounded-full">
            <Link href="/categories#tra-cuu">
              Xem toàn bộ tra cứu <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/categories#tra-cuu"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Scale className="size-5" />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                Dinh dưỡng chuẩn 100g
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Đo đạm, béo, xơ và vi chất nhạy cảm có minh bạch nguồn kiểm định khoa học.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
              <span>Tra cứu ngay</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/categories#kieng-ky"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-md"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110">
                <Layers className="size-5" />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Kiêng kỵ thực phẩm
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Quy tắc phối hợp nguyên liệu theo 3 cấp độ: Cùng món, Cùng bữa ăn hoặc Cùng ngày.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>Xem quy tắc</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/categories#phuong-phap-nau"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-md"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110">
                <ChefHat className="size-5" />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Phương pháp nấu nướng
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Hệ số hao hụt khối lượng và tỷ lệ bảo tồn vitamin nhạy nhiệt sau khi luộc, hấp,
                xào...
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Khám phá</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/categories#nhu-cau-khuyen-nghi"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md"
          >
            <div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110">
                <ShieldAlert className="size-5" />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Nhu cầu khuyến nghị &amp; UL
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Chuẩn tiêu thụ RDA/AI hàng ngày và giới hạn dung nạp tối đa theo nhóm đối tượng.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Đối chiếu</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
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
              <MapPin className="mr-1 inline h-4 w-4 text-primary" /> Bản đồ quán chay sắp ra mắt
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <p className="font-semibold text-foreground">Đang hoàn thiện bản đồ quán chay</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Danh sách quán ăn sẽ hiển thị ngay khi API địa điểm sẵn sàng.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4 gap-2 rounded-full">
                  <Link href="/restaurants">
                    <Navigation className="h-4 w-4" /> Xem trang quán ăn
                  </Link>
                </Button>
              </CardContent>
            </Card>
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
