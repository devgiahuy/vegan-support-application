'use client';

import * as React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoSource } from '@/common/enums';

interface VideoPlayerProps {
  videoUrl: string;
  videoSource?: VideoSource | string;
  posterUrl?: string;
  title?: string;
  className?: string;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function VideoPlayer({
  videoUrl,
  videoSource,
  posterUrl,
  title = 'Trình phát video',
  className,
}: VideoPlayerProps) {
  const isYouTube =
    videoSource === VideoSource.YOUTUBE ||
    videoUrl.includes('youtube.com') ||
    videoUrl.includes('youtu.be');

  const youtubeId = isYouTube ? extractYouTubeId(videoUrl) : null;
  // URL tự nhận là YouTube nhưng không trích xuất được ID → liên kết lỗi.
  const isBrokenYouTube = isYouTube && !youtubeId;

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg border border-border/60',
        className
      )}
    >
      {isBrokenYouTube || !videoUrl ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted p-6 text-center">
          <Play className="h-12 w-12 stroke-1 opacity-50 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            Video không khả dụng hoặc liên kết bị lỗi
          </p>
          <p className="text-xs text-muted-foreground">
            Đường dẫn video này không phát được. Vui lòng thử nội dung khác.
          </p>
        </div>
      ) : isYouTube && youtubeId ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      ) : (
        <video controls playsInline poster={posterUrl} className="h-full w-full object-contain">
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <p className="p-4 text-center text-sm text-white">
            Trình duyệt của bạn không hỗ trợ phát trực tiếp video này.
          </p>
        </video>
      )}
    </div>
  );
}
