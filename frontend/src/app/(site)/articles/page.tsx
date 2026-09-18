'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Search, BadgeCheck, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PostCard } from '@/features/post/components/post-card';
import type { DietSchool } from '@/features/post/types/post.model';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import {
  findCategoryById,
  matchesCategoryName,
} from '@/features/category/utils/flatten-categories';
import { useArticlesQuery } from '@/features/post/queries/post.queries';

const DIET_SCHOOL_FILTERS: { value: 'ALL' | DietSchool; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trường phái' },
  { value: 'PHAT_GIAO', label: 'Chay Phật giáo' },
  { value: 'DAO_GIAO', label: 'Chay Đạo giáo / Cao Đài' },
  { value: 'THUAN_CHAY', label: 'Thuần chay (Vegan)' },
];

export default function BlogListingPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = React.useState<'ALL' | DietSchool>('ALL');
  const [sortBy, setSortBy] = React.useState<'newest' | 'score' | 'views'>('newest');

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);

  const {
    data: articlesPagination,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    refetch: refetchArticles,
  } = useArticlesQuery({
    q: searchQuery.trim() || undefined,
    category: selectedCategoryId || undefined,
  });

  const selectedCategory = selectedCategoryId
    ? findCategoryById(categoryTree, selectedCategoryId)
    : undefined;

  const articles = articlesPagination?.items || [];

  // Áp dụng bộ lọc & tìm kiếm
  const filteredPosts = React.useMemo(() => {
    let list = [...articles];

    if (selectedSchool !== 'ALL') {
      list = list.filter((p) => {
        if ('dietSchool' in p) {
          return p.dietSchool === selectedSchool || p.dietSchool === 'ALL';
        }
        return true;
      });
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'score') {
      list.sort((a, b) => b.stats.likes - a.stats.likes);
    } else if (sortBy === 'views') {
      list.sort((a, b) => b.stats.views - a.stats.views);
    }

    return list;
  }, [articles, selectedSchool, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-8">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold gap-1.5 px-3 py-1">
              <BookOpen className="h-3.5 w-3.5" /> Tin Tức Dinh Dưỡng Chay
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Kiến Thức &amp; Kinh Nghiệm Ăn Chay Khoa Học
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Tổng hợp các bài chia sẻ dinh dưỡng đã được Chuyên gia kiểm chứng, mẹo nấu nước dùng
              thanh ngọt, và các nét đẹp văn hoá ăn chay Phật giáo, Đạo giáo tại Việt Nam.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-2xl gap-2 font-bold shadow-md shadow-primary/20"
            >
              <Link href="/articles/new">
                <Plus className="h-5 w-5" /> Viết bài chia sẻ mới
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-2xl gap-2 bg-background/80"
            >
              <Link href="/profile?tab=posts">Bài viết của tôi</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết, vitamin B12, mẹo hầm nấm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-2xl bg-card border-border/80"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground shrink-0 hidden sm:inline">
              Sắp xếp theo:
            </span>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as 'newest' | 'score' | 'views')}
            >
              <SelectTrigger className="h-11 rounded-2xl text-xs w-[160px] bg-card">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">
                  Mới nhất
                </SelectItem>
                <SelectItem value="score" className="text-xs">
                  Điểm vote cao nhất
                </SelectItem>
                <SelectItem value="views" className="text-xs">
                  Xem nhiều nhất
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Diet School Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {DIET_SCHOOL_FILTERS.map((s) => (
            <Button
              key={s.value}
              variant={selectedSchool === s.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSchool(s.value)}
              className="rounded-full text-xs h-8"
            >
              {s.label}
            </Button>
          ))}
        </div>

        {/* Category Pills (danh mục thật từ catalog) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
          <span className="text-xs text-muted-foreground mr-1">Chủ đề:</span>
          {isCategoryLoading ? (
            <span className="flex flex-wrap gap-1.5" aria-label="Đang tải danh mục">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-6 w-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </span>
          ) : isCategoryError ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Không tải được danh mục.
              <button
                onClick={() => void refetchCategories()}
                className="font-medium text-primary hover:underline"
              >
                Thử lại
              </button>
            </span>
          ) : categoryTree.length === 0 ? (
            <span className="text-xs text-muted-foreground">Chưa có chủ đề nội dung.</span>
          ) : (
            <CategoryFilterPills
              items={categoryTree}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          )}
          <Link
            href="/categories?type=CONTENT_TOPIC"
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            Tất cả chủ đề
          </Link>
        </div>
      </div>

      {/* Posts Grid - 4 States */}
      {isArticlesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
            />
          ))}
        </div>
      ) : isArticlesError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="font-semibold text-destructive">Không thể tải danh sách bài viết.</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Đã có lỗi xảy ra trong quá trình nạp bài viết từ máy chủ. Vui lòng thử lại.
          </p>
          <Button
            variant="outline"
            className="rounded-xl mt-2"
            onClick={() => void refetchArticles()}
          >
            Thử lại
          </Button>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center space-y-3 bg-muted/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy bài viết phù hợp</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Hãy thử tìm bằng từ khoá khác hoặc xoá bộ lọc trường phái/chuyên mục để xem nhiều nội
            dung hơn.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryId(null);
              setSelectedSchool('ALL');
            }}
            className="rounded-full text-xs mt-2"
          >
            Đặt lại tất cả bộ lọc
          </Button>
        </div>
      )}

      {/* Expert Verification Notice Callout */}
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
            <BadgeCheck className="h-6 w-6" />
          </span>
          <div>
            <h4 className="font-bold text-foreground">
              Quy trình Kiểm chứng Dinh dưỡng (SRS UC-11 &amp; UC-17)
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mọi bài viết về vi chất, phòng chống thiếu máu và thực dưỡng trên VeggieConnect đều
              được thẩm định bởi ThS. Bác sĩ Dinh dưỡng trước khi gắn nhãn{' '}
              <strong>Đã kiểm chứng</strong>.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shrink-0"
        >
          <Link href="/articles/new">Tham gia đóng góp bài viết</Link>
        </Button>
      </div>
    </div>
  );
}
