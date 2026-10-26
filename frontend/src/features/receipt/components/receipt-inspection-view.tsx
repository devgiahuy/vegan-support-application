'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Receipt,
  RotateCcw,
  Loader2,
  Sparkles,
  ArrowRight,
  Store,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  FieldContent,
  FieldDescription,
  FieldLegend,
  FieldSet,
  FieldTitle,
  FieldLabel,
} from '@/components/ui/field';
import { toast } from 'sonner';
import { ReceiptImageViewer } from './receipt-image-viewer';
import { ReceiptCandidateRow, type EditableReceiptCandidateItem } from './receipt-candidate-row';
import { ReceiptCandidateEditDialog } from './receipt-candidate-edit-dialog';
import { ReceiptProgressTracker } from './receipt-progress-tracker';
import {
  useConfirmReceiptJobMutation,
  useCancelReceiptJobMutation,
  useRetryReceiptJobMutation,
  useUpdateReceiptCandidateMutation,
} from '../queries/receipt.queries';
import type {
  ReceiptCandidate,
  ReceiptConfirmationDiff,
  ReceiptJob,
  ReceiptReviewDecision,
} from '../types/receipt.model';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ReceiptAddPhotosButton } from './receipt-add-photos-button';
import { getApiErrorCode } from '@/lib/api-error';

interface ReceiptInspectionViewProps {
  job: ReceiptJob;
  onConfirmationSuccess?: (diff: ReceiptConfirmationDiff) => void;
  onCancel?: () => void;
}

export function ReceiptInspectionView({
  job,
  onConfirmationSuccess,
  onCancel,
}: ReceiptInspectionViewProps) {
  const router = useRouter();
  const [editingCandidate, setEditingCandidate] = useState<ReceiptCandidate | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'rejected'>('all');
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [receiptDecisionState, setReceiptDecisionState] = useState<{
    jobId: string;
    imageCount: number;
    decision?: ReceiptReviewDecision;
    requiredByServer: boolean;
  }>(() => ({ jobId: job.id, imageCount: job.images.length, requiredByServer: false }));
  const hasCurrentReceiptDecisionState =
    receiptDecisionState.jobId === job.id && receiptDecisionState.imageCount === job.images.length;
  const receiptReviewDecision = hasCurrentReceiptDecisionState
    ? receiptDecisionState.decision
    : undefined;
  const decisionRequiredByServer =
    hasCurrentReceiptDecisionState && receiptDecisionState.requiredByServer;

  const confirmMutation = useConfirmReceiptJobMutation(job.id);
  const cancelMutation = useCancelReceiptJobMutation(job.id);
  const retryMutation = useRetryReceiptJobMutation(job.id);
  const updateCandidateMutation = useUpdateReceiptCandidateMutation(job.id);

  // Khởi tạo state nội bộ cho danh sách ứng viên có ô nhập số lượng & đơn vị
  const [items, setItems] = useState<EditableReceiptCandidateItem[]>(() =>
    job.candidates.map((c) => {
      const qVal =
        c.quantity.value !== null && c.quantity.value !== undefined ? String(c.quantity.value) : '';
      const qUnit = c.quantity.unit || '';
      return {
        id: c.id,
        name: c.name,
        quantity: qVal,
        unit: qUnit,
        isRejected: c.isRejected,
        version: c.version,
        ingredientId: c.ingredientSuggestion?.id || null,
        ingredientName: c.ingredientSuggestion?.name,
        confidencePercent: c.confidencePercent,
        confidenceTier: c.confidenceTier,
        uncertaintyNote: c.uncertaintyNote,
        lineText: c.lineText,
        pricing: c.pricing,
        initialName: c.name,
        initialQuantity: qVal,
        initialUnit: qUnit,
        initialIsRejected: c.isRejected,
      };
    })
  );

  // Đồng bộ lại khi job thay đổi, bảo toàn các chỉnh sửa thủ công của người dùng
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- TanStack Query refreshes this external job; merge it while retaining in-progress row edits.
    setItems((prevItems) => {
      const prevMap = new Map(prevItems.map((it) => [it.id, it]));
      return job.candidates.map((c) => {
        const existing = prevMap.get(c.id);
        const qVal =
          c.quantity.value !== null && c.quantity.value !== undefined
            ? String(c.quantity.value)
            : '';
        const qUnit = c.quantity.unit || '';

        if (existing) {
          const isUserEdited =
            existing.name !== existing.initialName ||
            existing.quantity !== existing.initialQuantity ||
            existing.unit !== existing.initialUnit ||
            existing.isRejected !== existing.initialIsRejected;

          return {
            ...existing,
            version: c.version,
            confidencePercent: c.confidencePercent,
            confidenceTier: c.confidenceTier,
            uncertaintyNote: c.uncertaintyNote,
            pricing: c.pricing,
            name: isUserEdited ? existing.name : c.name,
            quantity: isUserEdited ? existing.quantity : qVal,
            unit: isUserEdited ? existing.unit : qUnit,
            isRejected: isUserEdited ? existing.isRejected : c.isRejected,
          };
        }

        return {
          id: c.id,
          name: c.name,
          quantity: qVal,
          unit: qUnit,
          isRejected: c.isRejected,
          version: c.version,
          ingredientId: c.ingredientSuggestion?.id || null,
          ingredientName: c.ingredientSuggestion?.name,
          confidencePercent: c.confidencePercent,
          confidenceTier: c.confidenceTier,
          uncertaintyNote: c.uncertaintyNote,
          lineText: c.lineText,
          pricing: c.pricing,
          initialName: c.name,
          initialQuantity: qVal,
          initialUnit: qUnit,
          initialIsRejected: c.isRejected,
        };
      });
    });
  }, [job.id, job.candidates]);

  const updateItem = (id: string, updates: Partial<EditableReceiptCandidateItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const activeCandidatesCount = items.filter((c) => !c.isRejected).length;
  const rejectedCandidatesCount = items.filter((c) => c.isRejected).length;
  const mustChooseReceiptDecision = job.identityDecisionRequired || decisionRequiredByServer;

  const restoreExcludedItem = async (item: ReceiptJob['excludedItems'][number]) => {
    try {
      await updateCandidateMutation.mutateAsync({
        candidateId: item.id,
        input: { expectedVersion: item.version, decision: 'KEEP' },
      });
    } catch (error) {
      console.error('Lỗi khi khôi phục mặt hàng đã loại:', error);
    }
  };

  const displayedItems = items.filter((item) => {
    if (filterTab === 'active') return !item.isRejected;
    if (filterTab === 'rejected') return item.isRejected;
    return true;
  });

  // Lưu toàn bộ chỉnh sửa và xác nhận nhập vào Tủ bếp
  const handleSave = async () => {
    const activeItems = items.filter((it) => !it.isRejected);
    if (activeItems.length === 0) {
      toast.error('Vui lòng giữ lại ít nhất một mặt hàng thực phẩm để lưu vào Tủ bếp.');
      return;
    }

    // Kiểm tra các món thiếu trọng lượng hoặc đơn vị
    const invalidItems = activeItems.filter((it) => {
      const q = it.quantity.trim();
      const u = it.unit.trim();
      return !q || !u || isNaN(Number(q)) || Number(q) <= 0;
    });

    if (invalidItems.length > 0) {
      toast.error(
        `Vui lòng nhập trọng lượng (> 0) và đơn vị cho món "${invalidItems[0].name}" trước khi lưu.`
      );
      return;
    }

    setIsSavingLocal(true);
    try {
      // 1. Cập nhật các món có thay đổi so với dữ liệu ban đầu
      const currentVersions: Record<string, number> = {};
      job.candidates.forEach((c) => {
        currentVersions[c.id] = c.version;
      });

      for (const item of items) {
        const isNameChanged = item.name.trim() !== item.initialName.trim();
        const isQtyChanged = item.quantity.trim() !== item.initialQuantity.trim();
        const isUnitChanged = item.unit.trim() !== item.initialUnit.trim();
        const isRejectChanged = item.isRejected !== item.initialIsRejected;

        if (isNameChanged || isQtyChanged || isUnitChanged || isRejectChanged) {
          const parsedQty = item.quantity.trim() ? Number(item.quantity) : null;
          const parsedUnit = item.unit.trim() || null;

          const updatedJob = await updateCandidateMutation.mutateAsync({
            candidateId: item.id,
            input: {
              expectedVersion: currentVersions[item.id] ?? item.version,
              detectedName: item.name.trim(),
              quantity: parsedQty,
              unit: parsedUnit,
              decision: item.isRejected ? 'REJECT' : 'KEEP',
              ingredientId: item.ingredientId,
            },
          });

          const updatedCandidate = updatedJob.candidates.find((c) => c.id === item.id);
          if (updatedCandidate) {
            currentVersions[item.id] = updatedCandidate.version;
          }
        }
      }

      // 2. Gom danh sách ứng viên hợp lệ để xác nhận vào kho Tủ bếp
      const validCandidatesToConfirm = items
        .filter((it) => !it.isRejected)
        .map((it) => ({
          id: it.id,
          expectedVersion: currentVersions[it.id] ?? it.version,
        }));

      const diff = await confirmMutation.mutateAsync({
        candidates: validCandidatesToConfirm,
        ...(mustChooseReceiptDecision && receiptReviewDecision ? { receiptReviewDecision } : {}),
        idempotencyKey:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `confirm-${job.id}-${Date.now()}`,
      });

      if (onConfirmationSuccess) {
        onConfirmationSuccess(diff);
      }
    } catch (err) {
      if (getApiErrorCode(err) === 'RECEIPT_REVIEW_DECISION_REQUIRED') {
        setReceiptDecisionState({
          jobId: job.id,
          imageCount: job.images.length,
          decision: receiptReviewDecision,
          requiredByServer: true,
        });
        toast.error(
          'BE cần bạn xác nhận đây là cùng hóa đơn hay lần mua riêng trước khi nhập kho.'
        );
        return;
      }
      console.error('Lỗi khi lưu hóa đơn vào tủ bếp:', err);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleConfirmCancelJob = async () => {
    try {
      await cancelMutation.mutateAsync();
      setIsCancelConfirmOpen(false);
      if (onCancel) {
        onCancel();
      } else {
        router.push('/pantry');
      }
    } catch (err) {
      console.error('Lỗi khi hủy tác vụ bóc tách:', err);
    }
  };

  const handleRetryInternal = async () => {
    await retryMutation.mutateAsync();
  };

  // Trạng thái đang xử lý OCR
  if (job.isProcessing) {
    return (
      <div className="space-y-6">
        <ReceiptProgressTracker
          job={job}
          onCancel={() => setIsCancelConfirmOpen(true)}
          isCancelling={cancelMutation.isPending}
        />
        <div className="max-w-md mx-auto aspect-3/4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <ReceiptImageViewer images={job.images} />
        </div>

        <ConfirmDialog
          open={isCancelConfirmOpen}
          onOpenChange={setIsCancelConfirmOpen}
          title="Hủy tác vụ bóc tách hóa đơn"
          description="Bạn có chắc chắn muốn hủy tác vụ bóc tách hóa đơn này không? Tiến trình và các dữ liệu bóc tách chưa lưu sẽ bị xóa."
          confirmLabel="Hủy tác vụ"
          cancelLabel="Quay lại"
          danger
          loading={cancelMutation.isPending}
          onConfirm={handleConfirmCancelJob}
        />
      </div>
    );
  }

  const isSaving = isSavingLocal || confirmMutation.isPending || updateCandidateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Tracker trạng thái khi có lỗi */}
      {(job.isFailed || job.status === 'PARTIAL_FAILED') && (
        <ReceiptProgressTracker
          job={job}
          onRetry={handleRetryInternal}
          isRetrying={retryMutation.isPending}
        />
      )}

      {/* Header thanh công cụ trên cùng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Kiểm tra & Nhập thông tin hóa đơn
            </h2>
            <Badge variant="secondary" className="text-xs">
              {job.candidates.length} dòng hàng nhận diện
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Đối chiếu hóa đơn bên trái và kiểm tra, nhập trọng lượng, đơn vị bên phải trước khi lưu.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ReceiptAddPhotosButton job={job} disabled={isSaving} size="sm" className="text-xs" />

          {job.canCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelConfirmOpen(true)}
              disabled={isSaving || cancelMutation.isPending}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Hủy tác vụ
            </Button>
          )}

          {job.canRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetryInternal}
              disabled={isSaving || retryMutation.isPending}
              className="text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
          )}
        </div>
      </div>

      {/* BỐ CỤC CHIA LÀM 2 PHẦN TRÊN TRANG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* PHẦN BÊN TRÁI (5 CỘT TRÊN DESKTOP): HIỂN THỊ ẢNH HÓA ĐƠN & THÔNG TIN HÓA ĐƠN */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          {/* Card Trình xem ảnh hóa đơn */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-sm text-foreground">Ảnh chụp hóa đơn</h3>
              </div>
              {job.images.length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {job.images.length} ảnh đoạn
                </Badge>
              )}
            </div>

            {/* Trình xem ảnh có tương tác zoom / pan / rotate */}
            <ReceiptImageViewer images={job.images} />

            {/* Thông tin hóa đơn tóm tắt */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60 flex items-start gap-2">
                <Store className="h-3.5 w-3.5 text-neutral-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground">Cửa hàng</div>
                  <div className="font-semibold truncate">
                    {job.receiptMetadata?.merchantName || '—'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60 flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 text-neutral-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground">Thời gian</div>
                  <div className="font-semibold truncate">
                    {job.receiptMetadata?.formattedDate || '—'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 flex items-start gap-2">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground">Tổng tiền</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 truncate">
                    {job.receiptMetadata?.formattedTotalAmount || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Hộp gợi ý */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Hướng dẫn đối chiếu</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Nhìn ảnh hóa đơn bên trái để kiểm tra món đồ, điền trọng lượng và đơn vị vào danh
                sách bên phải. Sau đó nhấn <strong>Lưu vào Tủ bếp</strong> để hoàn tất.
              </p>
            </div>
          </div>
        </div>

        {/* PHẦN BÊN PHẢI (7 CỘT TRÊN DESKTOP): DANH SÁCH TÊN, Ô NHẬP TRỌNG LƯỢNG, ĐƠN VỊ VÀ NÚT SAVE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-4 sm:p-6 shadow-xs space-y-5">
            <Alert>
              <Receipt className="size-4" />
              <AlertTitle>Phân biệt lần mua</AlertTitle>
              <AlertDescription>
                Mua lại cùng món vào ngày khác được tính là lần mua mới và cộng dồn vào Tủ bếp. Ảnh
                trùng của cùng hóa đơn sẽ không làm tăng số lượng lần nữa.
              </AlertDescription>
            </Alert>

            {job.reviewRequired && !mustChooseReceiptDecision && (
              <Alert>
                <AlertTitle>Cần kiểm tra các dòng trùng</AlertTitle>
                <AlertDescription>
                  Backend phát hiện các dòng có thể thuộc cùng một hóa đơn. Hãy đối chiếu ảnh và bỏ
                  chọn dòng nào không nên nhập thêm.
                </AlertDescription>
              </Alert>
            )}

            {job.notices.map((notice, index) => (
              <Alert key={`${notice.code}-${index}`}>
                <AlertTitle>Đã loại mặt hàng không phải thực phẩm</AlertTitle>
                <AlertDescription>{notice.message}</AlertDescription>
              </Alert>
            ))}

            {job.excludedItems.length > 0 && (
              <section
                className="rounded-xl border border-border p-4"
                aria-labelledby="excluded-items-title"
              >
                <div className="mb-3">
                  <h4 id="excluded-items-title" className="font-semibold text-sm">
                    Mặt hàng đã loại ({job.excludedItems.length})
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground text-pretty">
                    Nếu một món bị nhận nhầm là phi thực phẩm, khôi phục và nhập số lượng trước khi
                    xác nhận.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {job.excludedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving || updateCandidateMutation.isPending}
                        onClick={() => void restoreExcludedItem(item)}
                      >
                        Khôi phục để kiểm tra
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {mustChooseReceiptDecision && (
              <section
                className="rounded-xl border border-amber-300/70 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20"
                aria-labelledby="receipt-decision-title"
              >
                <FieldSet className="gap-2">
                  <FieldLegend id="receipt-decision-title" variant="label" className="mb-0 text-sm">
                    Đây là ảnh của hóa đơn cũ hay một lần mua mới?
                  </FieldLegend>
                  <p className="mb-1 text-xs text-muted-foreground text-pretty">
                    Backend chưa phân biệt được các ảnh có dòng hàng giống nhau. Chọn một phương án
                    để tránh bỏ sót hoặc cộng kho hai lần.
                  </p>
                  <RadioGroup
                    value={receiptReviewDecision}
                    onValueChange={(value) =>
                      setReceiptDecisionState({
                        jobId: job.id,
                        imageCount: job.images.length,
                        decision: value as ReceiptReviewDecision,
                        requiredByServer: decisionRequiredByServer,
                      })
                    }
                    className="gap-2"
                  >
                    <FieldLabel
                      htmlFor="receipt-same"
                      className="items-start rounded-lg border bg-background p-3"
                    >
                      <RadioGroupItem value="SAME_RECEIPT" id="receipt-same" className="mt-0.5" />
                      <FieldContent>
                        <FieldTitle>Cùng hóa đơn / cùng lần mua</FieldTitle>
                        <FieldDescription className="text-xs">
                          Bỏ qua các dòng đã có từ hóa đơn trước.
                        </FieldDescription>
                      </FieldContent>
                    </FieldLabel>
                    <FieldLabel
                      htmlFor="receipt-separate"
                      className="items-start rounded-lg border bg-background p-3"
                    >
                      <RadioGroupItem
                        value="SEPARATE_RECEIPTS"
                        id="receipt-separate"
                        className="mt-0.5"
                      />
                      <FieldContent>
                        <FieldTitle>Hóa đơn khác / lần mua mới</FieldTitle>
                        <FieldDescription className="text-xs">
                          Giữ cả các món giống nhau và cộng số lượng mua mới vào kho.
                        </FieldDescription>
                      </FieldContent>
                    </FieldLabel>
                  </RadioGroup>
                </FieldSet>
              </section>
            )}

            {/* Header danh sách */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Danh sách mặt hàng</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeCandidatesCount} món sẽ thêm
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Điền trọng lượng và đơn vị cho các mặt hàng thực phẩm muốn lưu vào Tủ bếp.
                </p>
              </div>

              {/* Tabs lọc hiển thị */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterTab === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('active')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterTab === 'active'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cần thêm ({activeCandidatesCount})
                </button>
                {rejectedCandidatesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterTab('rejected')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      filterTab === 'rejected'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Đã loại ({rejectedCandidatesCount})
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách các dòng hàng với ô nhập trọng lượng, đơn vị */}
            <div className="space-y-3">
              {displayedItems.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground text-sm space-y-2">
                  <p>Không có mặt hàng nào trong mục này.</p>
                  {filterTab === 'active' && rejectedCandidatesCount > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterTab('rejected')}
                      className="rounded-xl text-xs"
                    >
                      Xem các mục đã loại bỏ ({rejectedCandidatesCount})
                    </Button>
                  )}
                </div>
              ) : (
                displayedItems.map((item) => (
                  <ReceiptCandidateRow
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => updateItem(item.id, updates)}
                    onOpenAdvancedEdit={() => {
                      const cand = job.candidates.find((c) => c.id === item.id);
                      if (cand) setEditingCandidate(cand);
                    }}
                    disabled={isSaving || job.isConfirmed || job.isCancelled}
                  />
                ))
              )}
            </div>

            {/* Thanh Footer: Nút SAVE Hoàn tất luồng */}
            <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 bg-card/95 backdrop-blur-md p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                Đã chọn <strong className="text-foreground">{activeCandidatesCount}</strong> mặt
                hàng để thêm vào kho Tủ bếp gia đình.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {job.canCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    disabled={isSaving}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Hủy bỏ
                  </Button>
                )}

                {/* NÚT SAVE - LƯU VÀO TỦ BẾP */}
                {job.canConfirm && (
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      isSaving ||
                      activeCandidatesCount === 0 ||
                      (mustChooseReceiptDecision && !receiptReviewDecision)
                    }
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all text-xs sm:text-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang lưu vào Tủ bếp...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Lưu vào Tủ bếp ({activeCandidatesCount})</span>
                        <ArrowRight className="h-4 w-4" />
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
      </div>

      {/* Modal chỉnh sửa chi tiết ứng viên */}
      <ReceiptCandidateEditDialog
        open={Boolean(editingCandidate)}
        onOpenChange={(open) => {
          if (!open) setEditingCandidate(null);
        }}
        candidate={editingCandidate}
        jobId={job.id}
      />

      {/* Modal xác nhận hủy tác vụ */}
      <ConfirmDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        title="Hủy tác vụ bóc tách hóa đơn"
        description="Bạn có chắc chắn muốn hủy tác vụ bóc tách hóa đơn này không? Mọi thông tin và dữ liệu bóc tách chưa lưu sẽ bị xóa."
        confirmLabel="Hủy tác vụ"
        cancelLabel="Quay lại"
        danger
        loading={cancelMutation.isPending}
        onConfirm={handleConfirmCancelJob}
      />
    </div>
  );
}
