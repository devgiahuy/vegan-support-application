'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Video,
  UtensilsCrossed,
  Filter,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag,
  Clock,
  ArrowRight,
  X,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePostStore } from '@/store/usePostStore';
import { PostCard } from '@/features/post/components/post-card';
import { MOCK_VIDEOS } from '@/features/video/data/mock-videos';
import { MOCK_RECIPES } from '@/features/recipe/data/mock-recipes';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import type { DietSchool } from '@/features/post/types/post.model';

const POPULAR_KEYWORDS = [
  'Phở nấm',
  'Vitamin B12',
  'Đậu hũ',
  'Nem rán chay',
  'Nước dùng thanh ngọt',
  'Chay Phật giáo',
  'Chay ngày Rằm',
  'Chả lụa chay',
];

const DIET_FILTERS: { value: 'ALL' | DietSchool; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trường phái' },
  { value: 'PHAT_GIAO', label: 'Chay Phật giáo' },
  { value: 'DAO_GIAO', label: 'Chay Đạo giáo' },
  { value: 'THUAN_CHAY', label: 'Thuần chay' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = React.useState(initialQuery);
  const [activeTab, setActiveTab] = React.useState<'all' | 'posts' | 'videos' | 'recipes'>('all');
  const [schoolFilter, setSchoolFilter] = React.useState<'ALL' | DietSchool>('ALL');
  const [sortBy, setSortBy] = React.useState<'relevance' | 'newest' | 'score'>('relevance');

  const { posts } = usePostStore();

  // Đồng bộ khi URL query params thay đổi
  React.useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null) {
      setQuery(qParam);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push(`/tim-kiem?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeywordClick = (kw: string) => {
    setQuery(kw);
    router.push(`/tim-kiem?q=${encodeURIComponent(kw)}`);
  };

  const normalizedQuery = query.trim().toLowerCase();

  // 1. Lọc Bài viết (Posts)
  const matchedPosts = React.useMemo(() => {
    let list = posts.filter((p) => p.status === 'PUBLISHED');

    if (normalizedQuery) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(normalizedQuery) ||
          p.summary.toLowerCase().includes(normalizedQuery) ||
          p.contentMarkdown.toLowerCase().includes(normalizedQuery) ||
          p.tags?.some((t) => t.toLowerCase().includes(normalizedQuery)) ||
          p.category.toLowerCase().includes(normalizedQuery)
      );
    }

    if (schoolFilter !== 'ALL') {
      list = list.filter((p) => p.dietSchool === schoolFilter || p.dietSchool === 'ALL');
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'score') {
      list.sort((a, b) => b.score - a.score);
    }

    return list;
  }, [posts, normalizedQuery, schoolFilter, sortBy]);

  // 2. Lọc Video nấu ăn
  const matchedVideos = React.useMemo(() => {
    let list = [...MOCK_VIDEOS];

    if (normalizedQuery) {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(normalizedQuery) ||
          v.description.toLowerCase().includes(normalizedQuery) ||
          v.category.toLowerCase().includes(normalizedQuery) ||
          v.aiSummary.dishName.toLowerCase().includes(normalizedQuery) ||
          v.aiSummary.detectedIngredients.some((i) => i.toLowerCase().includes(normalizedQuery)) ||
          v.author.name.toLowerCase().includes(normalizedQuery)
      );
    }

    if (schoolFilter !== 'ALL') {
      list = list.filter((v) => v.dietSchool === schoolFilter || !v.dietSchool);
    }

    if (sortBy === 'score') {
      list.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.views - a.views);
    }

    return list;
  }, [normalizedQuery, schoolFilter, sortBy]);

  // 3. Lọc Công thức nấu ăn (Recipes)
  const matchedRecipes = React.useMemo(() => {
    let list = [...MOCK_RECIPES];

    if (normalizedQuery) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(normalizedQuery) ||
          (r.description && r.description.toLowerCase().includes(normalizedQuery)) ||
          r.category.toLowerCase().includes(normalizedQuery) ||
          (r.dietTag && r.dietTag.toLowerCase().includes(normalizedQuery))
      );
    }

    if (schoolFilter !== 'ALL') {
      list = list.filter((r) => r.dietSchool === schoolFilter || !r.dietSchool);
    }

    if (sortBy === 'score') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [normalizedQuery, schoolFilter, sortBy]);

  const totalResults = matchedPosts.length + matchedVideos.length + matchedRecipes.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-8">
      {/* Header & Big Search Input */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-background border border-primary/20 p-6 sm:p-10 shadow-sm">
        <div className="max-w-3xl mx-auto space-y-5 text-center">
          <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1">
            Trung Tâm Tìm Kiếm Hợp Nhất (UC-04)
          </Badge>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Tìm Kiếm Món Chay, Cẩm Nang &amp; Video
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Khám phá công thức nấu ăn, mẹo thực dưỡng dinh dưỡng và các video hướng dẫn từng bước.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập món ăn, thành phần (vd: nấm, vitamin b12, bún bò)..."
              className="h-14 pl-12 pr-28 rounded-2xl text-base shadow-inner bg-background border-border/80 focus-visible:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  router.push('/tim-kiem');
                }}
                className="absolute right-24 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label="Xoá từ khoá"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-10 px-5 font-bold"
            >
              Tìm kiếm
            </Button>
          </form>

          {/* Popular Search Keywords */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Từ khoá gợi ý:
            </span>
            {POPULAR_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => handleKeywordClick(kw)}
                className="rounded-full bg-muted/60 hover:bg-primary/15 hover:text-primary transition-colors px-2.5 py-1 text-xs font-medium text-foreground border border-border/50"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border/70 pb-4">
          {/* Main Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-muted/40 border">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5 h-9"
            >
              Tất cả ({totalResults})
            </Button>
            <Button
              variant={activeTab === 'posts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('posts')}
              className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5 h-9"
            >
              <BookOpen className="h-4 w-4" /> Bài viết ({matchedPosts.length})
            </Button>
            <Button
              variant={activeTab === 'videos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('videos')}
              className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5 h-9"
            >
              <Video className="h-4 w-4" /> Video ({matchedVideos.length})
            </Button>
            <Button
              variant={activeTab === 'recipes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('recipes')}
              className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5 h-9"
            >
              <UtensilsCrossed className="h-4 w-4" /> Công thức ({matchedRecipes.length})
            </Button>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Diet School Filter */}
            <Select value={schoolFilter} onValueChange={(val) => setSchoolFilter(val as any)}>
              <SelectTrigger className="h-9 text-xs rounded-xl w-[150px] bg-card">
                <Filter className="h-3.5 w-3.5 mr-1 text-primary" />
                <SelectValue placeholder="Trường phái" />
              </SelectTrigger>
              <SelectContent>
                {DIET_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
              <SelectTrigger className="h-9 text-xs rounded-xl w-[140px] bg-card">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-primary" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance" className="text-xs">
                  Phù hợp nhất
                </SelectItem>
                <SelectItem value="newest" className="text-xs">
                  Mới nhất
                </SelectItem>
                <SelectItem value="score" className="text-xs">
                  Vote cao nhất
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results summary message */}
        {query && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tìm thấy <strong>{totalResults}</strong> kết quả phù hợp cho từ khoá "
            <span className="text-primary font-semibold">{query}</span>"
          </p>
        )}
      </div>

      {/* ZERO-STATE: When no results are found (SRS UC-04 Alternative Flow) */}
      {totalResults === 0 && (
        <div className="rounded-3xl border border-dashed border-border/80 p-10 text-center space-y-6 bg-muted/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Compass className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-foreground">
              Không tìm thấy kết quả cho "{query}"
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Hãy thử kiểm tra lại chính tả hoặc chọn các từ khoá cẩm nang phổ biến dưới đây để khám
              phá các món ăn thanh lành:
            </p>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {POPULAR_KEYWORDS.map((kw) => (
              <Button
                key={kw}
                variant="outline"
                size="sm"
                onClick={() => handleKeywordClick(kw)}
                className="rounded-full text-xs"
              >
                🔍 {kw}
              </Button>
            ))}
          </div>

          <div className="pt-4 border-t border-border/60 max-w-lg mx-auto flex justify-center gap-3">
            <Button asChild variant="default" size="sm" className="rounded-full text-xs">
              <Link href="/bai-viet">Xem Cẩm Nang Ăn Chay</Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-full text-xs">
              <Link href="/cong-thuc">Khám Phá Công Thức</Link>
            </Button>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY */}

      {/* 1. SECTION-BASED: Tab "Tất cả" */}
      {activeTab === 'all' && totalResults > 0 && (
        <div className="space-y-12">
          {/* Section: Bài viết cẩm nang */}
          {matchedPosts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Bài viết &amp; Cẩm nang dinh dưỡng ({matchedPosts.length})
                    </h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('posts')}
                  className="gap-1 text-xs text-primary font-medium"
                >
                  Xem tất cả bài viết <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedPosts.slice(0, 3).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Section: Video nấu ăn */}
          {matchedVideos.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cta/15 text-cta">
                    <Video className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Video hướng dẫn nấu món ({matchedVideos.length})
                    </h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('videos')}
                  className="gap-1 text-xs text-primary font-medium"
                >
                  Xem tất cả video <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedVideos.slice(0, 3).map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-border/70 group hover:border-primary/50 transition-all shadow-sm"
                  >
                    <Link
                      href={`/video/${item.id}`}
                      className="relative aspect-video block overflow-hidden bg-muted"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono">
                        {item.durationLabel}
                      </Badge>
                    </Link>
                    <CardContent className="p-4 space-y-2">
                      <Link href={`/video/${item.id}`}>
                        <h4 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                        <span>{item.author.name}</span>
                        <span>{item.views.toLocaleString()} lượt xem</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Section: Công thức món chay */}
          {matchedRecipes.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <UtensilsCrossed className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Công thức món chay ({matchedRecipes.length})
                    </h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('recipes')}
                  className="gap-1 text-xs text-primary font-medium"
                >
                  Xem tất cả công thức <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedRecipes.slice(0, 3).map((r) => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 2. TAB: Chỉ hiển thị Bài viết */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-foreground">
            Danh sách bài viết cẩm nang ({matchedPosts.length})
          </h3>
          {matchedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có bài viết nào khớp với bộ lọc.</p>
          )}
        </div>
      )}

      {/* 3. TAB: Chỉ hiển thị Video */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-foreground">
            Video hướng dẫn nấu món ({matchedVideos.length})
          </h3>
          {matchedVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedVideos.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border/70 group hover:border-primary/50 transition-all shadow-sm"
                >
                  <Link
                    href={`/video/${item.id}`}
                    className="relative aspect-video block overflow-hidden bg-muted"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono">
                      {item.durationLabel}
                    </Badge>
                  </Link>
                  <CardContent className="p-4 space-y-2">
                    <Link href={`/video/${item.id}`}>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                      <span>{item.author.name}</span>
                      <span>{item.views.toLocaleString()} lượt xem</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có video nào khớp với bộ lọc.</p>
          )}
        </div>
      )}

      {/* 4. TAB: Chỉ hiển thị Công thức */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-foreground">
            Công thức món chay ({matchedRecipes.length})
          </h3>
          {matchedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có công thức nào khớp với bộ lọc.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function UniversalSearchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">
          Đang tải trung tâm tìm kiếm...
        </div>
      }
    >
      <SearchContent />
    </React.Suspense>
  );
}
