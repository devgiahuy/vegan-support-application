'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, History, Share2, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { usePublicAiArtifactsQuery } from '../queries/ai-artifact.queries';
import { AdminVerificationActionMenu } from './admin-verification-action-menu';
import { ArtifactContentRenderer } from './artifact-content-renderer';
import { MedicalDisclaimer } from './medical-disclaimer';
import { ShareArtifactDialog } from './share-artifact-dialog';
import { VerificationBadge } from './verification-badge';
import { VerifyArtifactButton } from './verify-artifact-button';

export function PublicArtifactView({ shareId }: { shareId: string }) {
  const { data, isLoading, isError, refetch } = usePublicAiArtifactsQuery({
    limit: 50,
  });
  const [shareOpen, setShareOpen] = React.useState(false);

  if (isLoading) {
    return <LoadingState message="Đang tải tri thức AI..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Không thể tải nội dung."
        error="Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại."
        onRetry={() => void refetch()}
      />
    );
  }

  const artifact = data?.items.find((item) => item.id === shareId);

  if (!artifact) {
    return (
      <EmptyState
        title="Liên kết không khả dụng"
        description="Tri thức AI này không tồn tại hoặc chủ sở hữu đã thu hồi quyền chia sẻ công khai."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/assistant/public">Về trang khám phá</Link>
          </Button>
        }
      />
    );
  }

  const formattedDate = artifact.createdAt
    ? new Date(artifact.createdAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/assistant/public">
            <ArrowLeft className="size-4" />
            <span>Khám phá tri thức</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1.5"
          >
            <Share2 className="size-4" />
            <span>Chia sẻ</span>
          </Button>
          <VerifyArtifactButton artifact={artifact} />
          <AdminVerificationActionMenu verification={artifact.activeVerification} />
        </div>
      </div>

      {/* Main card */}
      <Card className="border shadow-sm">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {artifact.typeLabel}
            </span>
            <VerificationBadge verification={artifact.activeVerification} />
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {artifact.title}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground/70" />
              <span>{artifact.author.name}</span>
            </span>
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground/70" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {artifact.summary && (
            <div className="rounded-lg bg-muted/40 p-3.5 text-sm leading-relaxed text-muted-foreground">
              {artifact.summary}
            </div>
          )}

          <Separator />

          {/* Artifact snapshot content */}
          <ArtifactContentRenderer content={artifact.content} />

          {/* Medical disclaimer */}
          <MedicalDisclaimer />

          {/* Verification Audit History */}
          {artifact.verificationHistory.length > 0 && (
            <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <History className="size-4" />
                <span>Lịch sử kiểm toán & thẩm định chuyên môn</span>
              </div>
              <div className="space-y-2 text-xs">
                {artifact.verificationHistory.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="flex flex-wrap items-center justify-between gap-2 border-b pb-1.5 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{v.conclusionLabel}</span>
                      <span className="text-muted-foreground">bởi {v.reviewer.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Trạng thái: {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ShareArtifactDialog open={shareOpen} onOpenChange={setShareOpen} artifact={artifact} />
    </div>
  );
}
