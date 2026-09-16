'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Play,
  Pause,
  Clock,
  Eye,
  Heart,
  Share2,
  Bookmark,
  BadgeCheck,
  Sparkles,
  Home,
  ChevronRight,
  Utensils,
  CheckCircle2,
  FileText,
  Volume2,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MOCK_VIDEOS } from '@/features/video/data/mock-videos';
import type { VideoItem } from '@/features/video/types/video.model';
import { VoteControl } from '@/components/shared/vote-control';
import { CommentSection } from '@/components/shared/comment-section';

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const video = React.useMemo(() => {
    return MOCK_VIDEOS.find((v) => v.id === id) || MOCK_VIDEOS[0];
  }, [id]);

  const relatedVideos = React.useMemo(() => {
    return MOCK_VIDEOS.filter((v) => v.id !== video.id);
  }, [video.id]);

  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isLiked, setIsLiked] = React.useState<boolean>(false);
  const [isSaved, setIsSaved] = React.useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = React.useState<number>(0);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const jumpToTimestamp = (seconds: number, index: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
      setActiveStepIndex(index);
      toast.info(
        `Đang chuyển đến mốc thời gian: ${video.aiSummary.timelineSteps[index].timeLabel}`
      );
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(!isLiked ? 'Đã thích video này!' : 'Đã bỏ thích.');
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(!isSaved ? 'Đã lưu video vào danh sách xem sau!' : 'Đã bỏ lưu video.');
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết video!');
    }
  };

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
        {/* LEFT COLUMN: Video Player & AI Recipe Summary */}
        <div className="space-y-6 lg:col-span-8">
          {/* Main Video Player */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-black shadow-lg">
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnail}
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Video Title & Actions */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl leading-snug">
              {video.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3 border-y">
              {/* Author info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                  <AvatarImage src={video.author.avatar} alt={video.author.name} />
                  <AvatarFallback>{video.author.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-sm sm:text-base">
                      {video.author.name}
                    </span>
                    {video.author.verified && (
                      <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {video.author.roleBadge || 'Tác giả video'}
                  </p>
                </div>
              </div>

              {/* Engagement Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <VoteControl
                  initialScore={video.likes || 420}
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

          {/* AI STT RECIPE SUMMARY BOX (UC-10) */}
          <Card className="border-primary/30 shadow-md bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
            <CardHeader className="bg-primary/10 pb-4 border-b border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Tóm tắt công thức AI từ giọng nói (Speech-to-Text • UC-10)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Trích xuất tự động: {video.aiSummary.dishName}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className="bg-background text-primary border-primary/30 text-xs w-fit"
                >
                  Độ chính xác: {(video.aiSummary.confidenceScore * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {/* AI Summary note */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary pl-3">
                "{video.aiSummary.summaryText}"
              </p>

              {/* Detected Ingredients */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" /> Nguyên liệu nhận diện được
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {video.aiSummary.detectedIngredients.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg border bg-background/80 text-xs text-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Timeline Steps */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Mốc thời gian các bước (Bấm để nhảy tới
                  video)
                </h4>
                <div className="space-y-2">
                  {video.aiSummary.timelineSteps.map((step, idx) => {
                    const isActive = activeStepIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => jumpToTimestamp(step.timeSeconds, idx)}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150',
                          isActive
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border/70 hover:border-primary/40 hover:bg-muted/40'
                        )}
                      >
                        <Badge
                          className={cn(
                            'shrink-0 font-mono text-xs cursor-pointer',
                            isActive ? 'bg-primary text-white' : 'bg-muted text-foreground'
                          )}
                        >
                          {step.timeLabel}
                        </Badge>
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="text-sm font-semibold text-foreground">{step.title}</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-2 rounded-2xl border p-4 bg-muted/20">
            <h4 className="text-sm font-bold text-foreground">Mô tả video</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{video.description}</p>
          </div>

          {/* UC-03: Video Comments & Discussion */}
          <div className="pt-4">
            <CommentSection itemTitle={video.title} itemType="video" />
          </div>
        </div>

        {/* RIGHT COLUMN: Related Videos */}
        <div className="space-y-4 lg:col-span-4">
          <h3 className="text-lg font-bold text-foreground">Video công thức liên quan</h3>
          <div className="space-y-3">
            {relatedVideos.map((item) => (
              <Link
                key={item.id}
                href={`/video/${item.id}`}
                className="flex gap-3 p-2.5 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm group"
              >
                <div className="relative aspect-video w-32 shrink-0 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0 font-mono">
                    {item.durationLabel}
                  </Badge>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h5 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-muted-foreground truncate">{item.author.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{item.views.toLocaleString()} lượt xem</span>
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
