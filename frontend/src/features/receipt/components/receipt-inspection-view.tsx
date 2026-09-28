'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Receipt,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReceiptImageViewer } from './receipt-image-viewer';
import { ReceiptMetadataHeader } from './receipt-metadata-header';
import { ReceiptCandidateRow } from './receipt-candidate-row';
import { ReceiptCandidateEditDialog } from './receipt-candidate-edit-dialog';
import { ReceiptProgressTracker } from './receipt-progress-tracker';
import {
  useConfirmReceiptJobMutation,
  useCancelReceiptJobMutation,
  useRetryReceiptJobMutation,
  useUpdateReceiptCandidateMutation,
} from '../queries/receipt.queries';
import type { ReceiptCandidate, ReceiptConfirmationDiff, ReceiptJob } from '../types/receipt.model';
import { AiArtifactType } from '@/common/enums';
import { SaveArtifactButton } from '@/features/ai-artifacts';

interface ReceiptInspectionViewProps {
  job: ReceiptJob;
  onConfirmationSuccess?: (diff: ReceiptConfirmationDiff) => void;
}

export function ReceiptInspectionView({ job, onConfirmationSuccess }: ReceiptInspectionViewProps) {
  const router = useRouter();
  const [editingCandidate, setEditingCandidate] = useState<ReceiptCandidate | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'rejected'>('active');

  const confirmMutation = useConfirmReceiptJobMutation(job.id);
  const cancelMutation = useCancelReceiptJobMutation(job.id);
  const retryMutation = useRetryReceiptJobMutation(job.id);
  const updateCandidateMutation = useUpdateReceiptCandidateMutation(job.id);

  const handleToggleReject = async (candidate: ReceiptCandidate) => {
    try {
      await updateCandidateMutation.mutateAsync({
        candidateId: candidate.id,
        input: {
          expectedVersion: candidate.version,
          decision: candidate.isRejected ? 'KEEP' : 'REJECT',
        },
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleConfirm = async () => {
    if (job.activeCandidates.length === 0) return;

    try {
      const candidatesPayload = job.activeCandidates.map((c) => ({
        id: c.id,
        expectedVersion: c.version,
      }));

      const diff = await confirmMutation.mutateAsync({
        candidates: candidatesPayload,
        idempotencyKey:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `confirm-${job.id}-${Date.now()}`,
      });

      if (onConfirmationSuccess) {
        onConfirmationSuccess(diff);
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy tác vụ bóc tách hóa đơn này không?')) {
      await cancelMutation.mutateAsync();
      router.push('/pantry');
    }
  };

  const handleRetry = async () => {
    await retryMutation.mutateAsync();
  };

  // Nếu tác vụ đang xử lý (QUEUED hoặc PROCESSING), hiển thị tracker nổi bật
  if (job.isProcessing) {
    return (
      <div className="space-y-6">
        <ReceiptProgressTracker
          job={job}
          onCancel={handleCancel}
          isCancelling={cancelMutation.isPending}
        />
        <div className="max-w-md mx-auto aspect-3/4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <ReceiptImageViewer images={job.images} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tracker trạng thái (nếu có lỗi thất bại) */}
      {(job.isFailed || job.status === 'PARTIAL_FAILED') && (
        <ReceiptProgressTracker
          job={job}
          onRetry={handleRetry}
          isRetrying={retryMutation.isPending}
        />
      )}

      {/* Header thông tin hóa đơn */}
      <ReceiptMetadataHeader job={job} />

      {/* Bố cục đối chiếu 2 cột (Side-by-side Inspection) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái (5/12): Trình xem ảnh hóa đơn có zoom/pan/rotate */}
        <div className="lg:col-span-5 sticky top-20">
          <ReceiptImageViewer images={job.images} />
        </div>

        {/* Cột phải (7/12): Danh sách các dòng hàng bóc tách */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'active' | 'rejected')}
            className="w-full"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <TabsList className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-1">
                <TabsTrigger value="active" className="rounded-lg text-xs font-medium px-3">
                  Cần kiểm duyệt ({job.activeCandidates.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg text-xs font-medium px-3">
                  Đã loại bỏ ({job.rejectedCandidates.length})
                </TabsTrigger>
              </TabsList>

              <span className="text-xs text-muted-foreground hidden sm:inline">
                Bấm vào biểu tượng sửa để khớp nguyên liệu chuẩn
              </span>
            </div>

            {/* Tab mặt hàng hợp lệ */}
            <TabsContent value="active" className="space-y-3 pt-3">
              {job.activeCandidates.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-muted-foreground text-sm space-y-2">
                  <p>Tất cả các dòng hàng đã bị loại bỏ hoặc không có sản phẩm nào hợp lệ.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('rejected')}
                    className="rounded-xl text-xs"
                  >
                    Xem lại các mục đã loại bỏ
                  </Button>
                </div>
              ) : (
                job.activeCandidates.map((candidate) => (
                  <ReceiptCandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    onEdit={(cand) => setEditingCandidate(cand)}
                    onToggleReject={handleToggleReject}
                    disabled={job.isConfirmed || job.isCancelled}
                  />
                ))
              )}
            </TabsContent>

            {/* Tab mặt hàng đã loại bỏ */}
            <TabsContent value="rejected" className="space-y-3 pt-3">
              {job.rejectedCandidates.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-muted-foreground text-sm">
                  Chưa có mặt hàng nào bị loại bỏ.
                </div>
              ) : (
                job.rejectedCandidates.map((candidate) => (
                  <ReceiptCandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    onEdit={(cand) => setEditingCandidate(cand)}
                    onToggleReject={handleToggleReject}
                    disabled={job.isConfirmed || job.isCancelled}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Thanh hành động xác nhận cố định (Sticky Bottom Action Bar) */}
          <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {job.activeCandidates.length}
              </span>
              <span>mặt hàng sẽ được thêm vào Tủ bếp</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <SaveArtifactButton
                type={AiArtifactType.RECEIPT_EXTRACTION}
                sourceId={job.id}
                defaultTitle={`Bóc tách hóa đơn: ${job.receiptMetadata?.merchantName || 'Mua sắm thực phẩm'}`}
                defaultSummary={`Trích xuất ${job.candidates.length} mặt hàng từ hóa đơn mua sắm ngày ${job.receiptMetadata?.formattedDate || ''}.`}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
              />

              {job.canCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Hủy tác vụ
                </Button>
              )}

              {job.canConfirm && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending || job.activeCandidates.length === 0}
                  className="rounded-xl px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Đang nhập kho...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Xác nhận nhập vào tủ bếp
                    </>
                  )}
                </Button>
              )}

              {job.isConfirmed && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => router.push('/pantry')}
                  className="rounded-xl px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  Đến Tủ bếp của tôi
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa dòng hàng */}
      <ReceiptCandidateEditDialog
        open={Boolean(editingCandidate)}
        onOpenChange={(open) => {
          if (!open) setEditingCandidate(null);
        }}
        candidate={editingCandidate}
        jobId={job.id}
      />
    </div>
  );
}
