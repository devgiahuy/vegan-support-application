'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Sparkles,
  BadgeCheck,
  TrendingUp,
  Clock,
  ArrowUpDown,
  CheckCircle2,
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
import { usePostStore } from '@/store/usePostStore';
import type { DietSchool, Post } from '@/features/post/types/post.model';

const CATEGORIES = [
  'Tất cả',
  'Sức khỏe & Dinh dưỡng',
  'Kinh nghiệm ăn chay',
  'Mẹo nhà bếp',
  'Lối sống xanh',
  'Văn hóa & Tinh thần',
];

const DIET_SCHOOL_FILTERS: { value: 'ALL' | DietSchool; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trường phái' },
  { value: 'PHAT_GIAO', label: 'Chay Phật giáo' },
  { value: 'DAO_GIAO', label: 'Chay Đạo giáo / Cao Đài' },
  { value: 'THUAN_CHAY', label: 'Thuần chay (Vegan)' },
];

export default function BlogListingPage() {
  const { posts } = usePostStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Tất cả');
  const [selectedSchool, setSelectedSchool] = React.useState<'ALL' | DietSchool>('ALL');
  const [sortBy, setSortBy] = React.useState<'newest' | 'score' | 'views'>('newest');

  // Lọc chỉ lấy bài đã xuất bản (PUBLISHED) để hiển thị trên cẩm nang công khai
  const publicPosts = React.useMemo(() => {
    return posts.filter((p) => p.status === 'PUBLISHED');
  }, [posts]);

  // Áp dụng bộ lọc & tìm kiếm
  const filteredPosts = React.useMemo(() => {
    let list = [...publicPosts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'Tất cả') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (selectedSchool !== 'ALL') {
      list = list.filter((p) => p.dietSchool === selectedSchool || p.dietSchool === 'ALL');
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'score') {
      list.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'views') {
      list.sort((a, b) => b.views - a.views);
    }

    return list;
  }, [publicPosts, searchQuery, selectedCategory, selectedSchool, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-8">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold gap-1.5 px-3 py-1">
              <BookOpen className="h-3.5 w-3.5" /> Cẩm Nang Thực Dưỡng Chay
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
              <Link href="/bai-viet/tao-moi">
                <Plus className="h-5 w-5" /> Viết bài chia sẻ mới
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-2xl gap-2 bg-background/80"
            >
              <Link href="/ho-so?tab=posts">Bài viết của tôi</Link>
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
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
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

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
          <span className="text-xs text-muted-foreground mr-1">Chủ đề:</span>
          {CATEGORIES.map((c) => (
            <Badge
              key={c}
              variant={selectedCategory === c ? 'default' : 'secondary'}
              onClick={() => setSelectedCategory(c)}
              className="cursor-pointer rounded-lg text-xs py-1 px-2.5 transition-all"
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
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
              setSelectedCategory('Tất cả');
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
          <Link href="/bai-viet/tao-moi">Tham gia đóng góp bài viết</Link>
        </Button>
      </div>
    </div>
  );
}
