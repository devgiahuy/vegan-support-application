'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Clock,
  Eye,
  Bookmark,
  BadgeCheck,
  Home,
  ChevronRight,
  Utensils,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { VideoPlayer } from './video-player';
import { SafeImage } from '@/components/shared/safe-image';
import { VIDEO_FALLBACK_COVER, resolveVideoCover } from '@/lib/safe-image';
import { VoteControl } from '@/components/shared/vote-control';
import { CommentSection } from '@/components/shared/comment-section';
import { CommunitySummary } from '@/features/community/components/community-summary';
import { VoteButton } from '@/features/community/components/vote-button';
import { BookmarkButton } from '@/features/community/components/bookmark-button';
import { ReportButton } from '@/components/shared/report-button';
import { ReportTargetKind } from '@/common/enums';
import type { Video } from '../types/video.model';

interface VideoDetailViewProps {
  video: Video;
  relatedVideos: Video[];
}

export function VideoDetailView({ video, relatedVideos }: VideoDetailViewProps) {
  const [isSaved, setIsSaved] = React.useState<boolean>(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(!isSaved ? 'Đã lưu video vào danh sách xem sau!' : 'Đã bỏ lưu video.');
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết video vào bộ nhớ tạm!');
    }
  };

  const authorName = video.author?.name || 'Bếp Chay An Nhiên';
  const authorAvatar = video.author?.avatarUrl || '';
  const categoryName =
    typeof video.category === 'string' ? video.category : video.category?.name || 'Món chay';
  const views = 'stats' in video && video.stats ? video.stats.views : 0;
  const likes = 'stats' in video && video.stats ? video.stats.likes : 120;

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
        <Link href="/videos" className="hover:text-primary transition-colors">
          Video nấu ăn
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary truncate max-w-xs sm:max-w-md">
          {video.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Video Player & Recipe Info */}
        <div className="space-y-6 lg:col-span-8">
          {/* Main Dual Player (YouTube / HTML5) */}
          <VideoPlayer
            videoUrl={video.videoUrl}
            videoSource={video.videoSource}
            posterUrl={video.coverImageUrl}
            title={video.title}
          />

          {/* Video Title & Author Bar */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1">
                {categoryName}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {video.formattedDuration}
              </Badge>
              {video.statusLabel && (
                <Badge variant="secondary" className="text-xs">
                  {video.statusLabel}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl leading-snug">
              {video.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3 border-y border-border/70">
              {/* Author info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                  {authorAvatar ? <AvatarImage src={authorAvatar} alt={authorName} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {authorName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-sm sm:text-base">
                      {authorName}
                    </span>
                    <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                  </div>
                  <p className="text-xs text-muted-foreground">Tác giả video</p>
                </div>
              </div>

              {/* Engagement Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <VoteControl
                  initialScore={likes}
                  orientation="horizontal"
                  size="sm"
                  itemTitle={video.title}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className={cn(
                    'gap-1.5',
                    isSaved && 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30'
                  )}
                >
                  <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
                  <span>{isSaved ? 'Đã lưu' : 'Lưu video'}</span>
                </Button>

                <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                  <Share2 className="h-4 w-4" />
                  <span>Chia sẻ</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="space-y-2 rounded-2xl border p-5 bg-muted/20">
              <h4 className="text-sm font-bold text-foreground">Mô tả video</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{video.description}</p>
            </div>
          )}

          {/* Ingredients Section */}
          {video.ingredients && video.ingredients.length > 0 && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" /> Nguyên liệu chuẩn bị trong video
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {video.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border bg-card text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">{ing.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-primary shrink-0 ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                        {ing.amount} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps Section */}
          {video.steps && video.steps.length > 0 && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Tóm tắt các bước thực hiện
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {video.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="flex items-start gap-3 p-3 rounded-xl border bg-card"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {step.stepNumber}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">
                      {step.instruction}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Comments & Discussion */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <CommunitySummary postId={video.id} />
              <VoteButton postId={video.id} />
              <BookmarkButton postId={video.id} />
              <ReportButton targetKind={ReportTargetKind.POST} targetId={video.id} />
            </div>
            <CommentSection postId={video.id} itemType="video" />
          </div>
        </div>

        {/* RIGHT COLUMN: Related Videos */}
        <div className="space-y-4 lg:col-span-4">
          <h3 className="text-lg font-bold text-foreground">Video công thức liên quan</h3>
          <div className="space-y-3">
            {relatedVideos.map((item) => (
              <Link
                key={item.id}
                href={`/videos/${item.id}`}
                className="flex gap-3 p-2.5 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm group"
              >
                <div className="relative aspect-video w-32 shrink-0 rounded-lg overflow-hidden bg-muted">
                  <SafeImage
                    src={resolveVideoCover(item.coverImageUrl, VIDEO_FALLBACK_COVER)}
                    fallbackSrc={VIDEO_FALLBACK_COVER}
                    alt={item.title}
                    fill
                    sizes="128px"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0 font-mono">
                    {item.formattedDuration || '05:00'}
                  </Badge>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h5 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.author?.name || 'Bếp Chay An Nhiên'}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {(
                        ('stats' in item && item.stats ? item.stats.views : 0) || 0
                      ).toLocaleString()}{' '}
                      lượt xem
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
