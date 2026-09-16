'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Clock,
  Eye,
  MessageSquare,
  Bookmark,
  BadgeCheck,
  Sparkles,
  ArrowBigUp,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Post } from '../types/post.model';
import { usePostStore } from '@/store/usePostStore';

interface PostCardProps {
  post: Post;
  className?: string;
  horizontal?: boolean;
}

export function PostCard({ post, className, horizontal = false }: PostCardProps) {
  const { toggleSavePost } = usePostStore();
  const [isSaved, setIsSaved] = React.useState<boolean>(post.saved || false);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    toggleSavePost(post.id);
    toast.success(
      !isSaved ? 'Đã lưu bài viết vào danh sách của bạn!' : 'Đã bỏ lưu bài viết khỏi danh sách.'
    );
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/articles/${post.id}`);
      toast.success('Đã sao chép liên kết bài viết!');
    }
  };

  const dietSchoolLabel =
    post.dietSchool === 'PHAT_GIAO'
      ? 'Chay Phật giáo'
      : post.dietSchool === 'DAO_GIAO'
        ? 'Chay Đạo giáo'
        : 'Thuần chay';

  const roleBadgeInfo = React.useMemo(() => {
    if (post.author.role === 'NUTRITION_EXPERT') {
      return {
        label: 'Chuyên gia Dinh dưỡng',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: BadgeCheck,
      };
    }
    if (post.author.role === 'EXPERIENCED_COOK') {
      return {
        label: 'Đầu bếp kinh nghiệm',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: Sparkles,
      };
    }
    return {
      label: post.author.roleTitle || 'Thành viên',
      className: 'bg-muted text-muted-foreground border-transparent',
      icon: null,
    };
  }, [post.author]);

  const RoleIcon = roleBadgeInfo.icon;

  if (horizontal) {
    return (
      <Card
        className={cn(
          'group overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
          className
        )}
      >
        <Link href={`/articles/${post.id}`} className="flex flex-col sm:flex-row h-full">
          {/* Cover Image */}
          <div className="relative aspect-video sm:aspect-[4/3] sm:w-56 shrink-0 overflow-hidden bg-muted">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
              <Badge className="bg-background/90 text-foreground backdrop-blur text-[11px] font-medium shadow-sm">
                {post.category}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal border-primary/20 text-primary"
                >
                  {dietSchoolLabel}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {post.readingMinutes} phút đọc
                </span>
                <span>•</span>
                <span>{post.publishedAt}</span>
              </div>

              <h3 className="text-base font-bold text-foreground line-clamp-2 transition-colors group-hover:text-primary">
                {post.title}
              </h3>

              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {post.summary}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-7 w-7 ring-1 ring-primary/20">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {post.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {post.author.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className={cn('text-[9px] px-1 py-0 h-4 gap-0.5', roleBadgeInfo.className)}
                    >
                      {RoleIcon && <RoleIcon className="h-2.5 w-2.5" />}
                      {roleBadgeInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  <ArrowBigUp className="h-4 w-4 fill-primary/20" /> {post.score}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> {post.commentCount}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg',
        className
      )}
    >
      <Link
        href={`/articles/${post.id}`}
        className="block relative aspect-video w-full overflow-hidden bg-muted"
      >
        <img
          src={post.coverImage}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge className="bg-background/90 text-foreground backdrop-blur text-xs font-medium shadow-sm">
            {post.category}
          </Badge>
          <Badge
            variant="outline"
            className="bg-background/80 text-primary border-primary/30 backdrop-blur text-[11px]"
          >
            {dietSchoolLabel}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleToggleSave}
            aria-label="Lưu bài viết"
            className={cn(
              'h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow-sm hover:bg-background transition-colors',
              isSaved && 'text-primary fill-primary'
            )}
          >
            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current text-primary')} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleShare}
            aria-label="Chia sẻ bài viết"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow-sm hover:bg-background"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readingMinutes} phút đọc
            </span>
            <span>•</span>
            <span>{post.publishedAt}</span>
          </div>

          <Link href={`/articles/${post.id}`}>
            <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {post.title}
            </h3>
          </Link>

          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.summary}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 ring-1 ring-primary/20">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {post.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{post.author.name}</p>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 h-4 font-normal gap-0.5',
                  roleBadgeInfo.className
                )}
              >
                {RoleIcon && <RoleIcon className="h-2.5 w-2.5 shrink-0" />}
                <span className="truncate">{roleBadgeInfo.label}</span>
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1 font-semibold text-primary">
              <ArrowBigUp className="h-4 w-4 fill-primary/20" /> {post.score}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {post.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> {post.commentCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
