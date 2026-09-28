'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CandidateCard } from './candidate-card';
import { CandidateEditDialog } from './candidate-edit-dialog';
import { useUpdateCandidateMutation } from '../queries/ingredient-recognition.queries';
import type { RecognitionJob, RecognitionCandidate } from '../types/ingredient-recognition.model';
import { AiArtifactType } from '@/common/enums';
import { SaveArtifactButton } from '@/features/ai-artifacts';

interface CandidateReviewScreenProps {
  job: RecognitionJob;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onViewCandidateEvidence?: (candidate: RecognitionCandidate) => void;
  isConfirming?: boolean;
}

export function CandidateReviewScreen({
  job,
  onConfirm,
  onCancel,
  onRetry,
  onViewCandidateEvidence,
  isConfirming = false,
}: CandidateReviewScreenProps) {
  const [activeTab, setActiveTab] = useState<'proposed' | 'rejected'>('proposed');
  const [editingCandidate, setEditingCandidate] = useState<RecognitionCandidate | null>(null);

  const updateCandidateMutation = useUpdateCandidateMutation();

  const proposedCandidates = job.candidates.filter((c) => !c.isRejected);
  const rejectedCandidates = job.candidates.filter((c) => c.isRejected);

  const handleRejectCandidate = async (candidate: RecognitionCandidate) => {
    await updateCandidateMutation.mutateAsync({
      jobId: job.id,
      candidateId: candidate.id,
      input: {
        expectedVersion: candidate.version,
        decision: 'REJECT',
      },
    });
  };

  const handleRestoreCandidate = async (candidate: RecognitionCandidate) => {
    await updateCandidateMutation.mutateAsync({
      jobId: job.id,
      candidateId: candidate.id,
      input: {
        expectedVersion: candidate.version,
        decision: 'KEEP',
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header điều khiển duyệt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Kết quả nhận diện nguyên liệu
            </h3>
            <Badge variant="secondary" className="text-xs">
              {job.candidates.length} mục
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Rà soát danh sách thực phẩm AI nhận diện. Chỉ các món ở mục &quot;Cần duyệt&quot; mới
            được thêm vào tủ bếp.
          </p>
        </div>

        {/* Nút hành động xác nhận */}
        <div className="flex items-center gap-2 shrink-0">
          <SaveArtifactButton
            type={AiArtifactType.FRIDGE_RECOGNITION}
            sourceId={job.id}
            defaultTitle="Nhận diện nguyên liệu từ ảnh tủ lạnh"
            defaultSummary={`Kết quả AI nhận diện được ${job.candidates.length} nguyên liệu thực phẩm từ ảnh chụp tủ lạnh.`}
            variant="outline"
            size="sm"
            className="text-xs"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Hủy tác vụ
          </Button>

          {job.canRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={onConfirm}
            disabled={proposedCandidates.length === 0 || isConfirming}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu vào kho...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Xác nhận thêm ({proposedCandidates.length})</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs phân nhóm ứng viên */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'proposed' | 'rejected')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="proposed" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span>Cần thêm ({proposedCandidates.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span>Đã loại bỏ ({rejectedCandidates.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Cần thêm */}
        <TabsContent value="proposed" className="pt-4">
          {proposedCandidates.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-card">
              <Sparkles className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                Không còn nguyên liệu nào cần duyệt
              </h4>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Tất cả các món đã bị loại bỏ hoặc chưa có thực phẩm nào được phát hiện.
              </p>
              {rejectedCandidates.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('rejected')}
                  className="mt-4"
                >
                  Xem danh sách đã loại bỏ ({rejectedCandidates.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proposedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onEdit={(c) => setEditingCandidate(c)}
                  onReject={handleRejectCandidate}
                  onViewEvidence={onViewCandidateEvidence}
                  disabled={updateCandidateMutation.isPending || isConfirming}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Đã loại bỏ */}
        <TabsContent value="rejected" className="pt-4">
          {rejectedCandidates.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-card text-muted-foreground text-sm">
              Chưa có nguyên liệu nào bị loại bỏ.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onEdit={(c) => setEditingCandidate(c)}
                  onReject={handleRejectCandidate}
                  onRestore={handleRestoreCandidate}
                  onViewEvidence={onViewCandidateEvidence}
                  disabled={updateCandidateMutation.isPending || isConfirming}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog chỉnh sửa ứng viên */}
      <CandidateEditDialog
        open={Boolean(editingCandidate)}
        onOpenChange={(open) => !open && setEditingCandidate(null)}
        candidate={editingCandidate}
        jobId={job.id}
      />
    </div>
  );
}
