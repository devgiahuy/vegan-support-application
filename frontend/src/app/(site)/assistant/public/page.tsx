'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/loading-state';
import { PublicArtifactsList, PublicArtifactView } from '@/features/ai-artifacts';

/**
 * Khám phá tri thức AI công khai — mở được không cần đăng nhập (KHÔNG AuthGuard).
 * `?share=<shareId>` mở thẳng 1 mục; liên kết 2 chiều với `/assistant`.
 */
function PublicAssistantContent() {
  const searchParams = useSearchParams();
  const shareId = searchParams.get('share') ?? '';

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/assistant">
            <ArrowLeft className="size-4" />
            <span>Trợ lý AI</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Khám phá Tri thức AI Công khai
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tổng hợp các giải đáp, phân tích dinh dưỡng và nhận diện thực phẩm hữu ích đã được cộng
          đồng và chuyên gia kiểm chứng.
        </p>
      </div>

      {shareId ? <PublicArtifactView shareId={shareId} /> : <PublicArtifactsList />}
    </div>
  );
}

export default function PublicAssistantPage() {
  return (
    <Suspense fallback={<LoadingState message="Đang tải tri thức AI..." />}>
      <PublicAssistantContent />
    </Suspense>
  );
}
