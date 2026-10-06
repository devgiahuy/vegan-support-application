'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FridgeUploadZone } from '@/features/ingredient-vision/components/fridge-upload-zone';
import { RecognitionProgressTracker } from '@/features/ingredient-vision/components/recognition-progress-tracker';
import { CandidateReviewScreen } from '@/features/ingredient-vision/components/candidate-review-screen';
import { RecognitionConfirmationSummary } from '@/features/ingredient-vision/components/recognition-confirmation-summary';
import { FreshnessDisclaimerBanner } from '@/features/ingredient-vision/components/freshness-disclaimer-banner';
import { EvidenceImageModal } from '@/features/ingredient-vision/components/evidence-image-modal';
import {
  useRecognitionJobQuery,
  useConfirmRecognitionJobMutation,
  useCancelRecognitionJobMutation,
  useRetryRecognitionJobMutation,
} from '@/features/ingredient-vision/queries/ingredient-recognition.queries';
import type {
  RecognitionJob,
  RecognitionCandidate,
  RecognitionConfirmationDiff,
} from '@/features/ingredient-vision/types/ingredient-recognition.model';

export function FridgeScanClientView() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [confirmationDiff, setConfirmationDiff] = useState<RecognitionConfirmationDiff | null>(
    null
  );
  const [inspectingCandidate, setInspectingCandidate] = useState<RecognitionCandidate | null>(null);

  // Queries & Mutations
  const { data: job, isLoading: isJobLoading, refetch } = useRecognitionJobQuery(activeJobId);
  const confirmMutation = useConfirmRecognitionJobMutation();
  const cancelMutation = useCancelRecognitionJobMutation();
  const retryMutation = useRetryRecognitionJobMutation();

  const handleJobCreated = (newJob: RecognitionJob) => {
    setActiveJobId(newJob.id);
  };

  const handleConfirm = async () => {
    if (!job || !activeJobId) return;

    // Lọc các ứng viên không bị REJECTED
    const validCandidates = job.candidates
      .filter((c) => !c.isRejected)
      .map((c) => ({
        id: c.id,
        expectedVersion: c.version,
      }));

    if (validCandidates.length === 0) return;

    const diff = await confirmMutation.mutateAsync({
      jobId: activeJobId,
      candidates: validCandidates,
    });

    setConfirmationDiff(diff);
  };

  const handleCancel = async () => {
    if (!activeJobId) {
      setActiveJobId(null);
      return;
    }

    try {
      await cancelMutation.mutateAsync(activeJobId);
    } finally {
      setActiveJobId(null);
      setConfirmationDiff(null);
    }
  };

  const handleRetry = async () => {
    if (!activeJobId) return;
    await retryMutation.mutateAsync({ jobId: activeJobId });
    refetch();
  };

  const handleScanAnother = () => {
    setActiveJobId(null);
    setConfirmationDiff(null);
  };

  return (
    <div
      className={`container mx-auto px-4 py-6 sm:py-8 space-y-6 transition-all duration-300 ${
        job?.isReadyForReview ? 'max-w-7xl' : 'max-w-5xl'
      }`}
    >
      {/* Header thanh điều hướng */}
      <div className="flex items-center justify-between gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Link href="/pantry">
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Tủ bếp</span>
          </Link>
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          <span>Trợ lý Nhận diện Tủ lạnh AI</span>
        </div>
      </div>

      {/* Banner khuyến cáo an toàn thực phẩm cố định */}
      <FreshnessDisclaimerBanner disclaimer={job?.freshnessDisclaimer} />

      {/* Giai đoạn 4: Đã xác nhận thành công */}
      {confirmationDiff ? (
        <RecognitionConfirmationSummary diff={confirmationDiff} onScanAnother={handleScanAnother} />
      ) : activeJobId && job ? (
        /* Giai đoạn 2 & 3: Đang phân tích hoặc Đã có kết quả duyệt */
        <div className="space-y-6">
          {!job.isReadyForReview && (
            <RecognitionProgressTracker
              job={job}
              onCancel={handleCancel}
              onRetry={handleRetry}
              isCancelling={cancelMutation.isPending}
              isRetrying={retryMutation.isPending}
            />
          )}

          {job.isReadyForReview && (
            <CandidateReviewScreen
              job={job}
              onConfirmSuccess={(diff) => setConfirmationDiff(diff)}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onRetry={handleRetry}
              onViewCandidateEvidence={(c) => setInspectingCandidate(c)}
              isConfirming={confirmMutation.isPending}
            />
          )}
        </div>
      ) : (
        /* Giai đoạn 1: Tải ảnh lên */
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Quét ảnh tủ lạnh
            </h1>
            <p className="text-sm text-muted-foreground">
              Chụp hoặc tải ảnh các ngăn tủ lạnh để AI tự động nhận diện thực phẩm và đưa vào tủ bếp
              của bạn.
            </p>
          </div>

          <FridgeUploadZone onJobCreated={handleJobCreated} disabled={isJobLoading} />
        </div>
      )}

      {/* Modal xem ảnh bằng chứng chi tiết */}
      <EvidenceImageModal
        open={Boolean(inspectingCandidate)}
        onOpenChange={(open) => !open && setInspectingCandidate(null)}
        candidate={inspectingCandidate}
        images={job?.images || []}
      />
    </div>
  );
}
