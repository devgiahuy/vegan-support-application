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
import { MOCK_VIDEOS } from '@/features/video/data/mock-videos';
import type { VideoItem } from '@/features/video/types/video.model';

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

  const filteredVideos = React.useMemo(() => {
    return MOCK_VIDEOS.filter((v) => {
      if (selectedCat !== 'Tất cả' && v.category !== selectedCat) return false;
      if (selectedDiet !== 'all' && v.dietSchool !== selectedDiet) return false;
      if (
        searchQuery &&
        !v.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [selectedCat, selectedDiet, searchQuery]);

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
              <Link href="/dang-video">
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
            <Link href="/dang-video">
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

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card
            key={video.id}
            className="group overflow-hidden rounded-2xl border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col"
          >
            {/* Thumbnail with duration badge and play button */}
            <Link
              href={`/video/${video.id}`}
              className="relative aspect-video w-full overflow-hidden bg-muted block"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5">
                <Badge className="bg-black/60 text-white backdrop-blur border-0 text-[11px] px-2 py-0.5">
                  {video.category}
                </Badge>
              </div>
              <div className="absolute bottom-2.5 right-2.5">
                <Badge className="bg-black/70 text-white backdrop-blur border-0 text-[11px] px-2 py-0.5 font-mono">
                  {video.durationLabel}
                </Badge>
              </div>
            </Link>

            {/* Video content */}
            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 ring-1 ring-border">
                    <AvatarImage src={video.author.avatar} alt={video.author.name} />
                    <AvatarFallback>{video.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground truncate">
                      <span>{video.author.name}</span>
                      {video.author.verified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  <Link href={`/video/${video.id}`}>{video.title}</Link>
                </h3>
              </div>

              {/* Stats & AI badge */}
              <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {video.views.toLocaleString()}
                  </span>
                  <span>{video.uploadedAt}</span>
                </div>
                <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Summary
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
