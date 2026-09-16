'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Home, ChevronRight, SlidersHorizontal, Sparkles, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { CategoryFilterList } from '@/features/category/components/category-filter-list';
import { findCategoryById } from '@/features/category/utils/flatten-categories';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { RecipeCard } from '@/features/recipe/components/recipe-card';

const TIMES = ['Tất cả thời gian', 'Dưới 15 phút', '15 – 30 phút', '30 – 60 phút', 'Trên 1 giờ'];
const DIFFICULTIES = [
  { label: 'Tất cả độ khó', value: '' },
  { label: 'Dễ', value: 'EASY' },
  { label: 'Trung bình', value: 'MEDIUM' },
  { label: 'Nâng cao', value: 'HARD' },
];

export default function RecipeDiscoveryPage() {
  const [query, setQuery] = React.useState('');
  const [time, setTime] = React.useState('Tất cả thời gian');
  const [difficulty, setDifficulty] = React.useState('');
  const [checkedIds, setCheckedIds] = React.useState<string[]>([]);

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);

  const {
    data: recipesPagination,
    isLoading: isRecipesLoading,
    isError: isRecipesError,
    refetch: refetchRecipes,
  } = useRecipesQuery({
    q: query.trim() || undefined,
    category: checkedIds[0] || undefined,
    difficulty: difficulty || undefined,
  });

  const recipes = recipesPagination?.items || [];

  const toggleCat = (id: string) =>
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const selectedCategoryNames = checkedIds
    .map((id) => findCategoryById(categoryTree, id)?.name)
    .filter((name): name is string => typeof name === 'string');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-primary">
            <Home className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-primary">Khám phá công thức</span>
          <span className="text-xs font-normal text-muted-foreground">
            ({recipesPagination?.metadata?.totalItems ?? recipes.length} món)
          </span>
        </div>
        <Button asChild size="sm" className="gap-1.5 rounded-xl">
          <Link href="/recipes/new">
            <PlusCircle className="h-4 w-4" /> Đăng công thức mới
          </Link>
        </Button>
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
        <Button className="h-12 gap-2 rounded-2xl px-6" onClick={() => void refetchRecipes()}>
          Tìm kiếm
        </Button>
      </div>

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Đang lọc:</span>
        {selectedCategoryNames.length === 0 && !difficulty ? (
          <span className="text-sm text-muted-foreground">Tất cả danh mục & độ khó</span>
        ) : (
          <>
            {selectedCategoryNames.map((name) => (
              <Badge key={name} className="gap-1 rounded-full bg-primary/10 text-primary">
                {name}
              </Badge>
            ))}
            {difficulty && (
              <Badge className="gap-1 rounded-full bg-cta/10 text-cta">
                Độ khó: {DIFFICULTIES.find((d) => d.value === difficulty)?.label}
              </Badge>
            )}
          </>
        )}
        {(selectedCategoryNames.length > 0 || difficulty || query) && (
          <button
            onClick={() => {
              setCheckedIds([]);
              setDifficulty('');
              setQuery('');
            }}
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

              {/* Lọc theo độ khó */}
              <div>
                <h3 className="text-sm font-semibold">Độ khó</h3>
                <div className="mt-3 space-y-2">
                  {DIFFICULTIES.map((d) => (
                    <label key={d.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="difficulty"
                        checked={difficulty === d.value}
                        onChange={() => setDifficulty(d.value)}
                        className="h-4 w-4 accent-primary"
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
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

              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  setCheckedIds([]);
                  setDifficulty('');
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
                ({recipesPagination?.metadata?.totalItems ?? recipes.length} công thức)
              </span>
            </h1>
          </div>

          {/* 4 Trạng thái: Loading, Error, Empty, Success */}
          <div className="mt-5">
            {isRecipesLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
                  />
                ))}
              </div>
            ) : isRecipesError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <p className="font-semibold text-destructive">Không thể tải danh sách công thức.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => void refetchRecipes()}
                >
                  Thử lại
                </Button>
              </div>
            ) : recipes.length === 0 ? (
              <EmptyState
                title="Chưa có công thức nào"
                description={
                  query.trim()
                    ? `Không tìm thấy công thức phù hợp với từ khóa "${query.trim()}". Hãy thử từ khóa khác.`
                    : 'Không tìm thấy công thức nào phù hợp với bộ lọc hiện tại.'
                }
                action={
                  <Button
                    variant="outline"
                    className="mt-2 rounded-xl"
                    onClick={() => {
                      setCheckedIds([]);
                      setDifficulty('');
                      setQuery('');
                    }}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
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
