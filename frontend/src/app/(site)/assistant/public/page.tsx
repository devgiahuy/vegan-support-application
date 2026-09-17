'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/loading-state';
import { PublicAnswersList } from '@/features/chat/components/public-answers-list';
import { PublicAnswerView } from '@/features/chat/components/public-answer-view';

/**
 * Khám phá câu trả lời công khai — mở được không cần đăng nhập (KHÔNG AuthGuard).
 * `?share=<shareId>` mở thẳng 1 mục; link 2 chiều với `/assistant`.
 */
function PublicAssistantContent() {
  const searchParams = useSearchParams();
  const shareId = searchParams.get('share') ?? '';

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 lg:px-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/assistant">
            <ArrowLeft data-icon="inline-start" />
            Trợ lý
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Khám phá công khai</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Những câu trả lời hữu ích được cộng đồng chia sẻ.
        </p>
      </div>

      {shareId ? <PublicAnswerView shareId={shareId} /> : <PublicAnswersList />}
    </div>
  );
}

export default function PublicAssistantPage() {
  return (
    <Suspense fallback={<LoadingState message="Đang tải khám phá..." />}>
      <PublicAssistantContent />
    </Suspense>
  );
}
