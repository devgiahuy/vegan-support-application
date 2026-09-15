'use client';

import * as React from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type UserVoteState = 'up' | 'down' | null;

interface VoteControlProps {
  initialScore?: number;
  initialUserVote?: UserVoteState;
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  onVoteChange?: (vote: UserVoteState, score: number) => void;
  className?: string;
  itemTitle?: string;
}

export function VoteControl({
  initialScore = 0,
  initialUserVote = null,
  orientation = 'vertical',
  size = 'md',
  onVoteChange,
  className,
  itemTitle,
}: VoteControlProps) {
  const [score, setScore] = React.useState<number>(initialScore);
  const [userVote, setUserVote] = React.useState<UserVoteState>(initialUserVote);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let newScore = score;
    let newVote: UserVoteState = null;

    if (userVote === 'up') {
      // Hủy upvote
      newVote = null;
      newScore = score - 1;
      toast.info('Đã hủy bình chọn.');
    } else if (userVote === 'down') {
      // Đổi từ down sang up (+2 điểm)
      newVote = 'up';
      newScore = score + 2;
      toast.success('Đã chuyển sang Upvote bài viết!');
    } else {
      // Upvote mới (+1 điểm)
      newVote = 'up';
      newScore = score + 1;
      toast.success('Cảm ơn bạn đã Upvote nội dung này!');
    }

    setUserVote(newVote);
    setScore(newScore);
    onVoteChange?.(newVote, newScore);
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let newScore = score;
    let newVote: UserVoteState = null;

    if (userVote === 'down') {
      // Hủy downvote
      newVote = null;
      newScore = score + 1;
      toast.info('Đã hủy bỏ phiếu.');
    } else if (userVote === 'up') {
      // Đổi từ up sang down (-2 điểm)
      newVote = 'down';
      newScore = score - 2;
      toast.info('Đã đổi thành Downvote.');
    } else {
      // Downvote mới (-1 điểm)
      newVote = 'down';
      newScore = score - 1;
      toast.info('Đã ghi nhận phản hồi Downvote.');
    }

    setUserVote(newVote);
    setScore(newScore);
    onVoteChange?.(newVote, newScore);
  };

  const isVertical = orientation === 'vertical';

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-bold',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-border/80 bg-background/80 shadow-xs transition-all',
        isVertical ? 'flex-col p-1 gap-0.5' : 'flex-row px-2 py-1 gap-1.5',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Upvote button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleUpvote}
        className={cn(
          'rounded-lg transition-colors',
          size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-9 w-9' : 'h-7 w-7',
          userVote === 'up'
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
            : 'text-muted-foreground hover:text-emerald-600 hover:bg-muted'
        )}
        aria-label="Upvote (Đồng tình / Hữu ích)"
      >
        <ArrowBigUp className={cn(iconSizes[size], userVote === 'up' && 'fill-current')} />
      </Button>

      {/* Net Score */}
      <span
        className={cn(
          'font-semibold font-mono tracking-tight select-none px-1 text-center min-w-[24px]',
          textSizes[size],
          userVote === 'up' && 'text-emerald-600 dark:text-emerald-400 font-bold',
          userVote === 'down' && 'text-rose-600 dark:text-rose-400 font-bold',
          !userVote && 'text-foreground'
        )}
      >
        {score}
      </span>

      {/* Downvote button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownvote}
        className={cn(
          'rounded-lg transition-colors',
          size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-9 w-9' : 'h-7 w-7',
          userVote === 'down'
            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
            : 'text-muted-foreground hover:text-rose-600 hover:bg-muted'
        )}
        aria-label="Downvote (Chưa hữu ích / Phản đối)"
      >
        <ArrowBigDown className={cn(iconSizes[size], userVote === 'down' && 'fill-current')} />
      </Button>
    </div>
  );
}
