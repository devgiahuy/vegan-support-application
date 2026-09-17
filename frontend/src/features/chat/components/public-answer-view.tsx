import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Disclaimer } from './disclaimer';
import { VerificationBadge } from './verification-badge';
import { VerifyAnswerButton } from './verify-answer-button';
import { usePublicAnswerQuery } from '../queries/chat-sharing.queries';

/**
 * Xem 1 mục công khai: đủ hỏi + đáp + disclaimer + huy hiệu.
 * Hết hiệu lực (null) → empty rõ ràng. Có nút Mở trong trợ lý.
 */
export function PublicAnswerView({ shareId }: { shareId: string }) {
  const { data: item, isLoading, isError, refetch } = usePublicAnswerQuery(shareId);

  if (isLoading) return <LoadingState message="Đang tải câu trả lời..." />;
  if (isError) {
    return <ErrorState title="Không tải được nội dung." onRetry={() => void refetch()} />;
  }
  if (!item) {
    return (
      <EmptyState
        title="Liên kết hết hiệu lực"
        description="Câu trả lời này đã bị thu hồi hoặc không tồn tại."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/assistant/public">Về trang khám phá</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{item.question || '(Câu hỏi)'}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge verification={item.verification} />
            <span className="text-xs text-muted-foreground">{item.authorLabel}</span>
            {item.messageId && <VerifyAnswerButton messageId={item.messageId} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.answer}</p>
          <Disclaimer />
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/assistant/public">
            <ArrowLeft data-icon="inline-start" />
            Khám phá thêm
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/assistant">Mở trong trợ lý</Link>
        </Button>
      </div>
    </div>
  );
}
