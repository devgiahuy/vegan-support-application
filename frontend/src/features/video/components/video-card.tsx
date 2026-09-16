'use client';

import * as React from 'react';
import Link from 'next/link';
import { Play, Clock, Eye, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SafeImage } from '@/components/shared/safe-image';
import { cn } from '@/lib/utils';
import type { Video } from '../types/video.model';
import { VIDEO_FALLBACK_COVER, resolveVideoCover } from '@/lib/safe-image';

interface VideoCardProps {
  video: Video;
  priority?: boolean;
  className?: string;
}

export function VideoCard({ video, priority = false, className }: VideoCardProps) {
  // Lọc URL video (youtube watch, blob:...) khỏi `next/image`:
  // YouTube watch → thumbnail i.ytimg.com, còn lại → ảnh fallback.
  const coverImage = resolveVideoCover(video.coverImageUrl);
  const categoryName =
    typeof video.category === 'string' ? video.category : video.category?.name || 'Món chay';
  const authorName = video.author?.name || 'Bếp Chay An Nhiên';
  const authorAvatar = video.author?.avatarUrl || '';
  const duration =
    video.formattedDuration ||
    (video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)} phút` : '05:00');
  const views = 'stats' in video && video.stats ? video.stats.views : 0;

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg',
        className
      )}
    >
      <Link
        href={`/videos/${video.id}`}
        className="relative block aspect-video overflow-hidden bg-muted"
      >
        <SafeImage
          src={coverImage}
          fallbackSrc={VIDEO_FALLBACK_COVER}
          alt={video.title}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Center Play Button Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary">
            <Play className="h-5 w-5 fill-current translate-x-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <Badge className="absolute bottom-2.5 right-2.5 gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs text-white backdrop-blur-md">
          <Clock className="h-3 w-3" /> {duration}
        </Badge>

        {/* Category badge */}
        <Badge className="absolute top-2.5 left-2.5 rounded-full bg-background/90 text-[11px] text-foreground backdrop-blur">
          {categoryName}
        </Badge>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors">
          <Link href={`/videos/${video.id}`}>{video.title}</Link>
        </h3>

        {video.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {video.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 ring-1 ring-primary/20">
              {authorAvatar ? <AvatarImage src={authorAvatar} alt={authorName} /> : null}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium text-foreground">{authorName}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Eye className="h-3.5 w-3.5" />
            <span>{views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
