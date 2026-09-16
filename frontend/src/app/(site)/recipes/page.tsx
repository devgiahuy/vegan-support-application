'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Home, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { CategoryFilterList } from '@/features/category/components/category-filter-list';
import { findCategoryById } from '@/features/category/utils/flatten-categories';

const TIMES = ['Tất cả thời gian', 'Dưới 15 phút', '15 – 30 phút', '30 – 60 phút', 'Trên 1 giờ'];

export default function RecipeDiscoveryPage() {
  const [query, setQuery] = React.useState('');
  const [time, setTime] = React.useState('Tất cả thời gian');
  const [checkedIds, setCheckedIds] = React.useState<string[]>([]);

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);

  const toggleCat = (id: string) =>
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const selectedCategoryNames = checkedIds
    .map((id) => findCategoryById(categoryTree, id)?.name)
    .filter((name): name is string => typeof name === 'string');

  // Backend chưa có endpoint công thức (`/posts` hay `/recipes` đều chưa có
  // trong swagger) nên danh sách để trống trung thực thay vì dùng dữ liệu mẫu.
  // Khi API READY, thay bằng query thật + filter server-side theo danh mục.
  const recipes: never[] = [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-primary">
          <Home className="h-3.5 w-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary">Khám phá công thức</span>
        {/* Số lượng thật sẽ hiện khi API công thức READY. */}
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

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Đang lọc:</span>
        {selectedCategoryNames.length === 0 ? (
          <span className="text-sm text-muted-foreground">Tất cả danh mục</span>
        ) : (
          selectedCategoryNames.map((name) => (
            <Badge key={name} className="gap-1 rounded-full bg-primary/10 text-primary">
              {name}
            </Badge>
          ))
        )}
        {selectedCategoryNames.length > 0 && (
          <button
            onClick={() => setCheckedIds([])}
            className="text-sm text-muted-foreground underline decoration-dotted hover:text-destructive"
          >
            Xoá tất cả bộ lọc
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-4 xl:col-span-3">
          <Card className="lg:sticky lg:top-20">
            <CardContent className="space-y-6 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <SlidersHorizontal className="h-4 w-4 text-primary" /> Danh mục món
                  </h3>
                  <Link
                    href="/categories?type=RECIPE_GROUP"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Xem tất cả
                  </Link>
                </div>
                {isCategoryLoading ? (
                  <ul className="mt-3 space-y-2" aria-label="Đang tải danh mục">
                    {[0, 1, 2, 3].map((i) => (
                      <li key={i} className="h-5 animate-pulse rounded bg-muted" />
                    ))}
                  </ul>
                ) : isCategoryError ? (
                  <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium">Không tải được danh mục.</p>
                    <button
                      onClick={() => void refetchCategories()}
                      className="mt-1 font-medium text-primary hover:underline"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : categoryTree.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Chưa có danh mục nhóm công thức.
                  </p>
                ) : (
                  <div className="mt-3">
                    <CategoryFilterList
                      items={categoryTree}
                      selectedIds={checkedIds}
                      onToggle={toggleCat}
                    />
                  </div>
                )}
              </div>

              {/* Lọc theo nguyên liệu sẽ thêm khi API công thức READY. */}

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

              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  setCheckedIds([]);
                  setQuery('');
                  setTime('Tất cả thời gian');
                }}
              >
                Đặt lại bộ lọc về mặc định
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold sm:text-2xl">
              Khám phá công thức{' '}
              <span className="text-sm font-normal text-muted-foreground">
                ({recipes.length} công thức)
              </span>
            </h1>
          </div>

          <div className="mt-5">
            <EmptyState
              title="Chưa có công thức nào"
              description={
                query.trim()
                  ? `Không tìm thấy công thức cho "${query.trim()}". API công thức chưa sẵn sàng nên danh sách đang trống.`
                  : 'API công thức chưa sẵn sàng nên danh sách đang trống. Danh sách thật sẽ hiện ở đây khi backend có endpoint.'
              }
              action={
                <Button asChild variant="outline" className="mt-2 rounded-xl">
                  <Link href="/categories?type=RECIPE_GROUP">Xem danh mục món chay</Link>
                </Button>
              }
            />
          </div>

          {/* Phân trang sẽ thêm khi API công thức READY. */}

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
                <Link href="/assistant">
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
