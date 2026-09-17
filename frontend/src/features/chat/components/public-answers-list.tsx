'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { usePublicAnswersQuery } from '../queries/chat-sharing.queries';
import { VerificationBadge } from './verification-badge';

/**
 * Danh sách câu trả lời công khai: tìm kiếm + phân trang client ở phase
 * fixture, tác giả ẩn danh. Mở được không cần đăng nhập.
 */
export function PublicAnswersList({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = React.useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = React.useState(initialQuery);
  const { data, isLoading, isError, refetch } = usePublicAnswersQuery({
    q: submittedQuery,
    limit: 10,
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQuery(query.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm câu hỏi, câu trả lời..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm kiếm câu trả lời công khai"
          />
        </div>
        <Button type="submit">Tìm</Button>
      </form>

      {isLoading && <LoadingState message="Đang tải câu trả lời công khai..." />}
      {isError && <ErrorState title="Không tải được danh sách." onRetry={() => void refetch()} />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Chưa có câu trả lời công khai"
          description={
            submittedQuery
              ? 'Thử từ khóa khác.'
              : 'Hãy là người đầu tiên chia sẻ câu trả lời hữu ích từ trợ lý.'
          }
        />
      )}
      {!isLoading && !isError && items.length > 0 && (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.shareId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/assistant/public?share=${item.shareId}`}
                    className="hover:text-primary hover:underline"
                  >
                    {item.question || '(Câu hỏi)'}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="line-clamp-3 text-sm text-muted-foreground">{item.answer}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <VerificationBadge verification={item.verification} compact />
                  <span className="text-xs text-muted-foreground">{item.authorLabel}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
