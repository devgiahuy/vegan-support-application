'use client';

import * as React from 'react';
import { Play, Video as VideoIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VideoPreviewPlayerProps {
  source?: 'UPLOAD' | 'YOUTUBE';
  url: string;
  durationFormatted?: string;
  className?: string;
}

export function VideoPreviewPlayer({
  source = 'UPLOAD',
  url,
  durationFormatted,
  className = '',
}: VideoPreviewPlayerProps) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs gap-2">
        <VideoIcon className="h-8 w-8 text-muted-foreground/60" />
        <span>Không tìm thấy đường dẫn video để phát thử</span>
      </div>
    );
  }

  // Nếu là YouTube video (URL dạng youtube.com hoặc youtu.be)
  const isYoutube =
    source === 'YOUTUBE' ||
    url.includes('youtube.com') ||
    url.includes('youtu.be');

  let youtubeEmbedUrl = '';
  if (isYoutube) {
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        youtubeEmbedUrl = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('watch?v=')) {
        const id = new URL(url).searchParams.get('v');
        youtubeEmbedUrl = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('embed/')) {
        youtubeEmbedUrl = url;
      }
    } catch {
      youtubeEmbedUrl = url;
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black/90 shadow-sm">
        {isYoutube && youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            title="Xem trước Video nấu ăn"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          >
            Trình duyệt của bạn không hỗ trợ phát thẻ video HTML5.
          </video>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0">
            {isYoutube ? 'Nguồn: YouTube' : 'Nguồn: Tải lên trực tiếp'}
          </Badge>
          {durationFormatted && durationFormatted !== '00:00' && (
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Play className="h-3 w-3" /> {durationFormatted}
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">
          Video xem trước cho Quản trị viên thẩm định
        </span>
      </div>
    </div>
  );
}
