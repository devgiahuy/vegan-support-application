'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Video,
  UtensilsCrossed,
  ArrowUpDown,
  ChevronRight,
  TrendingUp,
  Compass,
  X,
} from 'lucide-react';
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
import { VideoCard } from '@/features/video/components/video-card';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useArticlesQuery } from '@/features/post/queries/post.queries';
import { useVideosQuery } from '@/features/video/queries/video.queries';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';

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

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = React.useState(initialQuery);
  const [activeTab, setActiveTab] = React.useState<'all' | 'posts' | 'videos' | 'recipes'>('all');
  const [sortBy, setSortBy] = React.useState<'relevance' | 'newest'>('relevance');

  // Đồng bộ khi URL query params thay đổi (back/forward). Guard trong render
  // thay vì setState trong effect để tránh cascading renders.
  const qParam = searchParams.get('q') ?? '';
  const [prevQueryParam, setPrevQueryParam] = React.useState(qParam);
  if (qParam !== prevQueryParam) {
    setPrevQueryParam(qParam);
    setQuery(qParam);
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeywordClick = (kw: string) => {
    setQuery(kw);
    router.push(`/search?q=${encodeURIComponent(kw)}`);
  };

  const normalizedQuery = query.trim();
  const hasQuery = normalizedQuery.length > 0;

  // Tìm kiếm thật qua API (backend hỗ trợ `q` không dấu). Chưa nhập từ khóa thì không gọi.
  const articlesQuery = useArticlesQuery(hasQuery ? { q: normalizedQuery, limit: 12 } : undefined, {
    enabled: hasQuery,
  });
  const videosQuery = useVideosQuery(hasQuery ? { q: normalizedQuery, limit: 12 } : undefined, {
    enabled: hasQuery,
  });
  const recipesQuery = useRecipesQuery(hasQuery ? { q: normalizedQuery, limit: 12 } : undefined, {
    enabled: hasQuery,
  });

  const isLoading = articlesQuery.isLoading || videosQuery.isLoading || recipesQuery.isLoading;

  const matchedPosts = React.useMemo(() => {
    const list = [...(articlesQuery.data?.items || [])];
    if (sortBy === 'newest') {
      list.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
    }
    return list;
  }, [articlesQuery.data?.items, sortBy]);

  const matchedVideos = React.useMemo(() => {
    const list = [...(videosQuery.data?.items || [])];
    if (sortBy === 'newest') {
      list.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
    }
    return list;
  }, [videosQuery.data?.items, sortBy]);

  const matchedRecipes = React.useMemo(() => {
    const list = [...(recipesQuery.data?.items || [])];
    if (sortBy === 'newest') {
      list.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
    }
    return list;
  }, [recipesQuery.data?.items, sortBy]);

  const totalResults = hasQuery
    ? matchedPosts.length + matchedVideos.length + matchedRecipes.length
    : 0;

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
                  router.push('/search');
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

      {!hasQuery ? (
        <div className="rounded-3xl border border-dashed border-border/80 p-10 text-center space-y-4 bg-muted/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Compass className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-foreground">Bắt đầu tìm kiếm</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nhập từ khóa ở khung tìm kiếm phía trên hoặc chọn một gợi ý để khám phá các món ăn
              thanh lành.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Control Bar: Tabs & Sorting */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border/70 pb-4">
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

              <div className="flex flex-wrap items-center gap-2.5">
                <Select
                  value={sortBy}
                  onValueChange={(val) => setSortBy(val as 'relevance' | 'newest')}
                >
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Tìm thấy <strong>{totalResults}</strong> kết quả phù hợp cho từ khoá &quot;
              <span className="text-primary font-semibold">{query}</span>&quot;
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
                />
              ))}
            </div>
          ) : totalResults === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 p-10 text-center space-y-6 bg-muted/20">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Compass className="h-8 w-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-foreground">
                  Không tìm thấy kết quả cho &quot;{query}&quot;
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Hãy thử kiểm tra lại chính tả hoặc chọn các từ khoá cẩm nang phổ biến dưới đây để
                  khám phá các món ăn thanh lành:
                </p>
              </div>

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
                  <Link href="/articles">Xem Cẩm Nang Ăn Chay</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="rounded-full text-xs">
                  <Link href="/recipes">Khám Phá Công Thức</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab "Tất cả" */}
              {activeTab === 'all' && (
                <div className="space-y-12">
                  {matchedPosts.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookOpen className="h-4 w-4" />
                          </span>
                          <h2 className="text-lg font-bold text-foreground">
                            Bài viết &amp; Cẩm nang dinh dưỡng ({matchedPosts.length})
                          </h2>
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

                  {matchedVideos.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cta/15 text-cta">
                            <Video className="h-4 w-4" />
                          </span>
                          <h2 className="text-lg font-bold text-foreground">
                            Video hướng dẫn nấu món ({matchedVideos.length})
                          </h2>
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
                        {matchedVideos.slice(0, 3).map((video) => (
                          <VideoCard key={video.id} video={video} />
                        ))}
                      </div>
                    </section>
                  )}

                  {matchedRecipes.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                            <UtensilsCrossed className="h-4 w-4" />
                          </span>
                          <h2 className="text-lg font-bold text-foreground">
                            Công thức món chay ({matchedRecipes.length})
                          </h2>
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

              {/* Tab: Chỉ hiển thị Bài viết */}
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
                    <p className="text-sm text-muted-foreground">
                      Không có bài viết nào khớp với bộ lọc.
                    </p>
                  )}
                </div>
              )}

              {/* Tab: Chỉ hiển thị Video */}
              {activeTab === 'videos' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-foreground">
                    Video hướng dẫn nấu món ({matchedVideos.length})
                  </h3>
                  {matchedVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {matchedVideos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Không có video nào khớp với bộ lọc.
                    </p>
                  )}
                </div>
              )}

              {/* Tab: Chỉ hiển thị Công thức */}
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
                    <p className="text-sm text-muted-foreground">
                      Không có công thức nào khớp với bộ lọc.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
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
