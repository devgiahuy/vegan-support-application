import { MessageSquareHeart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunitySummaryQuery } from '../queries/community.queries';

/**
 * Tóm tắt cộng đồng 1 nguồn duy nhất: tổng vote, rating trung bình, viewer.
 * Null-safe cho guest (viewer null → chỉ hiện tổng).
 */
export function CommunitySummary({ postId }: { postId: string }) {
  const { data: summary, isLoading } = useCommunitySummaryQuery(postId);

  if (isLoading) return <Skeleton className="h-16 w-full rounded-xl" />;
  if (!summary) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <span className="flex items-center gap-1.5 text-sm">
          <MessageSquareHeart className="size-4 text-primary" />
          <strong>{summary.voteCount}</strong> lượt ủng hộ
        </span>
        {summary.ratingCount > 0 && summary.tasteAverage !== null && (
          <span className="flex items-center gap-1.5 text-sm">
            <Star className="size-4 text-amber-500" />
            Vị {summary.tasteAverage.toFixed(1)} · Khó{' '}
            {summary.difficultyAverage?.toFixed(1) ?? '—'}
            <span className="text-muted-foreground">({summary.ratingCount})</span>
          </span>
        )}
        {(summary.viewerVoted || summary.viewerBookmarked) && (
          <Badge variant="secondary">Bạn đã tương tác</Badge>
        )}
      </CardContent>
    </Card>
  );
}
