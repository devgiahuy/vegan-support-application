'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Home,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { MOCK_RECIPES } from '@/features/recipe/data/mock-recipes';

const CATEGORIES = [
  { label: 'Món chính thực dưỡng', count: 32 },
  { label: 'Canh & Súp thanh nhiệt', count: 24 },
  { label: 'Bún, Mì & Phở nước', count: 18 },
  { label: 'Món gỏi & Khai vị', count: 12 },
  { label: 'Bánh & Điểm tâm chay', count: 9 },
];

const INGREDIENTS = [
  { label: 'Đậu hũ / Tàu hũ non', count: 28 },
  { label: 'Nấm rơm & Nấm đùi gà', count: 42 },
  { label: 'Rong biển & Tảo xoắn', count: 15 },
  { label: 'Hạt sen & Đậu gà', count: 20 },
  { label: 'Rau củ hữu cơ Đà Lạt', count: 35 },
];

const TIMES = ['Tất cả thời gian', 'Dưới 15 phút', '15 – 30 phút', '30 – 60 phút', 'Trên 1 giờ'];

export default function RecipeDiscoveryPage() {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [tab, setTab] = React.useState<'all' | 'blog' | 'video'>('all');
  const [query, setQuery] = React.useState('dau hu');
  const [time, setTime] = React.useState('15 – 30 phút');
  const [checkedCats, setCheckedCats] = React.useState<string[]>(['Món chính thực dưỡng']);

  const toggleCat = (label: string) =>
    setCheckedCats((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );

  const recipes = MOCK_RECIPES.filter((r) => {
    if (tab === 'blog') return r.contentType === 'blog';
    if (tab === 'video') return r.contentType === 'video';
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-primary">
          <Home className="h-3.5 w-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary">Khám phá công thức</span>
        <span className="ml-auto hidden items-center gap-1 text-xs sm:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Kho tàng 1,280+ món thuần thực vật Việt Nam
        </span>
      </nav>

      {/* Search */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo món ăn, nguyên liệu (đậu hũ, nấm rơm, sả ớt...)"
            className="h-12 rounded-2xl pl-10"
          />
        </div>
        <Button className="h-12 gap-2 rounded-2xl px-6">Tìm kiếm</Button>
      </div>

      <div className="mt-3 rounded-2xl border bg-secondary/40 p-3 text-sm">
        <span className="inline-flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-cta" />
          Đang tìm kiếm: <strong className="text-primary">&quot;{query}&quot;</strong>
          <span className="text-muted-foreground">• Tự động nhận diện không dấu:</span>
          <Badge variant="secondary" className="rounded-full">
            đậu hũ
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            tàu hũ
          </Badge>
        </span>
      </div>

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Đang lọc:</span>
        {['Đậu hũ non', 'Dưới 30 phút', 'Món kho'].map((f) => (
          <Badge key={f} className="gap-1 rounded-full bg-primary/10 text-primary">
            {f}
          </Badge>
        ))}
        <button className="text-sm font-medium text-primary hover:underline">+ Thêm bộ lọc</button>
        <button className="text-sm text-muted-foreground underline decoration-dotted hover:text-destructive">
          Xoá tất cả bộ lọc
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-4 xl:col-span-3">
          <Card className="lg:sticky lg:top-20">
            <CardContent className="space-y-6 p-5">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Danh mục món
                </h3>
                <ul className="mt-3 space-y-2">
                  {CATEGORIES.map((c) => (
                    <li key={c.label}>
                      <label className="flex cursor-pointer items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={checkedCats.includes(c.label)}
                            onCheckedChange={() => toggleCat(c.label)}
                          />
                          {c.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{c.count}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Nguyên liệu chính</h3>
                <ul className="mt-3 space-y-2">
                  {INGREDIENTS.map((ing) => (
                    <li key={ing.label}>
                      <label className="flex cursor-pointer items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Checkbox />
                          {ing.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{ing.count}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Thời gian chế biến</h3>
                <div className="mt-3 space-y-2">
                  {TIMES.map((t) => (
                    <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="time"
                        checked={time === t}
                        onChange={() => setTime(t)}
                        className="h-4 w-4 accent-primary"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full rounded-xl">
                Đặt lại bộ lọc về mặc định
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold sm:text-2xl">
              Kết quả tìm kiếm cho <span className="text-primary">&quot;{query}&quot;</span>{' '}
              <span className="text-sm font-normal text-muted-foreground">
                ({recipes.length} công thức)
              </span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border p-1">
                <button
                  onClick={() => setTab('all')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    tab === 'all' && 'bg-primary text-primary-foreground'
                  )}
                >
                  Tất cả ({MOCK_RECIPES.length})
                </button>
                <button
                  onClick={() => setTab('blog')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    tab === 'blog' && 'bg-primary text-primary-foreground'
                  )}
                >
                  Bài viết
                </button>
                <button
                  onClick={() => setTab('video')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    tab === 'video' && 'bg-primary text-primary-foreground'
                  )}
                >
                  Video ({MOCK_RECIPES.filter((r) => r.contentType === 'video').length})
                </button>
                <Link
                  href="/video"
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  Kho Video ↗
                </Link>
              </div>
              <div className="flex items-center gap-1 rounded-full border p-1">
                <button
                  onClick={() => setView('grid')}
                  aria-label="Xem dạng lưới"
                  className={cn(
                    'rounded-full p-1.5',
                    view === 'grid' && 'bg-primary text-primary-foreground'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  aria-label="Xem dạng danh sách"
                  className={cn(
                    'rounded-full p-1.5',
                    view === 'list' && 'bg-primary text-primary-foreground'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'mt-5 grid gap-5',
              view === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
            )}
          >
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Hiển thị <strong className="text-foreground">1 - {recipes.length}</strong> trên tổng
              số 28 công thức
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled aria-label="Trang trước">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {[1, 2, 3, 4].map((p) => (
                <Button
                  key={p}
                  variant={p === 1 ? 'default' : 'outline'}
                  size="icon"
                  className="rounded-full"
                >
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="icon" aria-label="Trang sau">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* AI card */}
          <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-cta/5">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
              <div className="flex-1">
                <Badge className="gap-1 rounded-full bg-cta/15 text-cta">
                  <Sparkles className="h-3.5 w-3.5" /> Trợ lý AI Dinh dưỡng
                </Badge>
                <h2 className="mt-3 text-xl font-bold">
                  Không tìm thấy công thức với nguyên liệu bạn đang có?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bạn chỉ còn nửa bìa đậu hũ, ít ngô ngọt hoặc muốn thay thế nấm mà không bị hụt
                  chất đạm? Hãy hỏi AI ChayXanh để nhận công thức nấu theo nguyên liệu tủ lạnh của
                  riêng bạn!
                </p>
              </div>
              <Button asChild size="lg" className="gap-2 rounded-full">
                <Link href="/tro-ly-ai">
                  <Sparkles className="h-5 w-5" /> Hỏi AI thay thế nguyên liệu
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
