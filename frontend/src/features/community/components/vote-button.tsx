'use client';

import { ArrowBigUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCommunitySummaryQuery, useVoteMutation } from '../queries/community.queries';

/**
 * Nút upvote thật (idempotent): bấm lại để gỡ. Trạng thái từ summary query.
 * Khác `VoteControl` shared (mock local-state) — nút này đi qua community API.
 */
export function VoteButton({ postId }: { postId: string }) {
  const { data: summary } = useCommunitySummaryQuery(postId);
  const voteMutation = useVoteMutation();

  const voted = summary?.viewerVoted ?? false;
  const count = summary?.voteCount ?? 0;

  return (
    <Button
      variant={voted ? 'default' : 'outline'}
      size="sm"
      disabled={voteMutation.isPending}
      onClick={() => voteMutation.mutate({ postId, voted: !voted })}
      className={cn('gap-1.5')}
      aria-pressed={voted}
      aria-label={voted ? 'Gỡ upvote' : 'Upvote nội dung này'}
    >
      <ArrowBigUp data-icon="inline-start" className={cn(voted && 'fill-current')} />
      {count}
    </Button>
  );
}
