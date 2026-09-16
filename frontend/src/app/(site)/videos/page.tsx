'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Play,
  Clock,
  Eye,
  Heart,
  Search,
  SlidersHorizontal,
  UploadCloud,
  BadgeCheck,
  Sparkles,
  Home,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useVideosQuery } from '@/features/video/queries/video.queries';
import { VideoCard } from '@/features/video/components/video-card';
import type { Video } from '@/features/video/types/video.model';

const CATEGORIES = [
  'Tất cả',
  'Món chính',
  'Canh / Súp',
  'Lẩu chay',
  'Salad & Gỏi',
  'Món chiên & rim',
];
const DIET_FILTERS = [
  { id: 'all', label: 'Tất cả trường phái' },
  { id: 'PHAT_GIAO', label: 'Phật giáo' },
  { id: 'DAO_GIAO', label: 'Đạo giáo' },
  { id: 'THUAN_CHAY', label: 'Thuần chay (Vegan)' },
];

export default function VideoDiscoveryPage() {
  const [selectedCat, setSelectedCat] = React.useState('Tất cả');
  const [selectedDiet, setSelectedDiet] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const {
    data: videosPagination,
    isLoading: isVideosLoading,
    isError: isVideosError,
    refetch: refetchVideos,
  } = useVideosQuery({
    q: searchQuery.trim() || undefined,
  });

  const videos = videosPagination?.items || [];

  const filteredVideos = React.useMemo(() => {
    return videos.filter((v) => {
      const catName = typeof v.category === 'string' ? v.category : v.category?.name || '';
      if (selectedCat !== 'Tất cả' && catName !== selectedCat) return false;
      return true;
    });
  }, [videos, selectedCat]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary">Video dạy nấu ăn chay</span>
      </nav>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/30 p-6 sm:p-8">
        <div className="max-w-2xl space-y-3">
          <Badge className="bg-primary text-white gap-1.5 px-3 py-1 font-semibold text-xs">
            <Sparkles className="h-3.5 w-3.5" /> AI Video Summarization (UC-10)
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Kho Video Nấu Chay Trực Quan
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Học nấu ăn chay dễ dàng qua các video chất lượng cao từ Chuyên gia dinh dưỡng và Đầu bếp
            có kinh nghiệm. Mọi video đều có{' '}
            <strong>tóm tắt công thức và mốc thời gian tự động từ AI</strong>.
          </p>
          <div className="pt-2">
            <Button asChild className="gap-2 font-semibold shadow-md">
              <Link href="/videos/new">
                <UploadCloud className="h-4 w-4" /> Đăng tải video của bạn (UC-05)
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm video công thức, nguyên liệu..."
              className="pl-10 h-11 bg-background"
            />
          </div>
          <Button asChild className="gap-2 font-semibold shrink-0 h-11 px-5">
            <Link href="/videos/new">
              <UploadCloud className="h-4 w-4" /> Đăng video
            </Link>
          </Button>
        </div>

        {/* Categories strip */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">
            Chuyên mục:
          </span>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCat === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCat(cat)}
              className={cn(
                'rounded-full text-xs shrink-0',
                selectedCat === cat && 'shadow-sm font-semibold'
              )}
            >
              {cat}
            </Button>
          ))}

          <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-3 mr-1">
            Trường phái:
          </span>
          {DIET_FILTERS.map((diet) => (
            <Button
              key={diet.id}
              variant={selectedDiet === diet.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedDiet(diet.id)}
              className={cn(
                'rounded-full text-xs shrink-0',
                selectedDiet === diet.id &&
                  'bg-primary/10 text-primary font-semibold border border-primary/30'
              )}
            >
              {diet.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Video Grid - 4 States */}
      {isVideosLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
            />
          ))}
        </div>
      ) : isVideosError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="font-semibold text-destructive">Không thể tải danh sách video.</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Đã có lỗi xảy ra khi nạp video từ máy chủ. Vui lòng thử lại.
          </p>
          <Button
            variant="outline"
            className="rounded-xl mt-2"
            onClick={() => void refetchVideos()}
          >
            Thử lại
          </Button>
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <VideoCard key={video.id} video={video} priority={index === 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center space-y-3 bg-muted/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Play className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy video nào phù hợp</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Hãy thử tìm bằng từ khoá khác hoặc đổi chuyên mục/trường phái.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCat('Tất cả');
              setSelectedDiet('all');
            }}
            className="rounded-full text-xs mt-2"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
}
