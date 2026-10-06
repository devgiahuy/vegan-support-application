'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  Trash2,
  Layers,
  ArrowRight,
  Camera,
  Maximize2,
  Scale,
  Pencil,
  Eye,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CandidateEditDialog } from './candidate-edit-dialog';
import {
  useUpdateCandidateMutation,
  useConfirmRecognitionJobMutation,
} from '../queries/ingredient-recognition.queries';
import type {
  RecognitionJob,
  RecognitionCandidate,
  RecognitionConfirmationDiff,
} from '../types/ingredient-recognition.model';
import { AiArtifactType } from '@/common/enums';
import { SaveArtifactButton } from '@/features/ai-artifacts';

interface CandidateReviewScreenProps {
  job: RecognitionJob;
  onConfirm?: () => void;
  onConfirmSuccess?: (diff: RecognitionConfirmationDiff) => void;
  onCancel: () => void;
  onRetry: () => void;
  onViewCandidateEvidence?: (candidate: RecognitionCandidate) => void;
  isConfirming?: boolean;
}

interface EditableCandidateItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  isRejected: boolean;
  version: number;
  ingredientId: string | null;
  ingredientName?: string;
  confidencePercent: number;
  confidenceTier: 'high' | 'medium' | 'low';
  freshnessObservation: string | null;
  evidence: Array<{ imageId: string; imagePosition: number; confidencePercent: number }>;
  initialName: string;
  initialQuantity: string;
  initialUnit: string;
  initialIsRejected: boolean;
}

const COMMON_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'quả',
  'trái',
  'củ',
  'bó',
  'gói',
  'hộp',
  'cây',
  'miếng',
  'tép',
  'phần',
];

export function CandidateReviewScreen({
  job,
  onConfirm,
  onConfirmSuccess,
  onCancel,
  onRetry,
  onViewCandidateEvidence,
  isConfirming = false,
}: CandidateReviewScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'rejected'>('all');
  const [editingCandidate, setEditingCandidate] = useState<RecognitionCandidate | null>(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const updateCandidateMutation = useUpdateCandidateMutation();
  const confirmMutation = useConfirmRecognitionJobMutation();

  // Local state for list of candidates with inline quantity & unit inputs
  const [items, setItems] = useState<EditableCandidateItem[]>(() =>
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
        freshnessObservation: c.freshnessObservation,
        evidence: c.evidence,
        initialName: c.name,
        initialQuantity: qVal,
        initialUnit: qUnit,
        initialIsRejected: c.isRejected,
      };
    })
  );

  // Sync state if job ID changes
  useEffect(() => {
    setItems(
      job.candidates.map((c) => {
        const qVal =
          c.quantity.value !== null && c.quantity.value !== undefined
            ? String(c.quantity.value)
            : '';
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
          freshnessObservation: c.freshnessObservation,
          evidence: c.evidence,
          initialName: c.name,
          initialQuantity: qVal,
          initialUnit: qUnit,
          initialIsRejected: c.isRejected,
        };
      })
    );
  }, [job.id]);

  const updateItem = (id: string, updates: Partial<EditableCandidateItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const images = job.images || [];
  const currentImage = images[currentImageIndex] || images[0] || null;

  const activeCandidatesCount = items.filter((c) => !c.isRejected).length;
  const rejectedCandidatesCount = items.filter((c) => c.isRejected).length;

  const displayedItems = items.filter((item) => {
    if (filterTab === 'active') return !item.isRejected;
    if (filterTab === 'rejected') return item.isRejected;
    return true;
  });

  // Chuyển ảnh góc chụp sang đúng vị trí của nguyên liệu khi người dùng bấm xem
  const handleFocusCandidateImage = (candidate: EditableCandidateItem) => {
    if (candidate.evidence && candidate.evidence.length > 0) {
      const targetPos = candidate.evidence[0].imagePosition;
      const targetIdx = images.findIndex(
        (img) => img.position === targetPos || img.id === candidate.evidence[0].imageId
      );
      if (targetIdx !== -1) {
        setCurrentImageIndex(targetIdx);
        toast.info(`Đã chuyển sang góc chụp #${targetPos} của ${candidate.name}`);
        return;
      }
    }

    const fullCand = job.candidates.find((c) => c.id === candidate.id);
    if (fullCand && onViewCandidateEvidence) {
      onViewCandidateEvidence(fullCand);
    }
  };

  // Lưu toàn bộ thay đổi và hoàn tất luồng thêm vào tủ bếp
  const handleSave = async () => {
    const activeItems = items.filter((it) => !it.isRejected);
    if (activeItems.length === 0) {
      toast.error('Vui lòng giữ lại ít nhất một nguyên liệu để lưu vào Tủ bếp.');
      return;
    }

    // Kiểm tra các món còn thiếu trọng lượng hoặc đơn vị
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
            jobId: job.id,
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

      if (onConfirmSuccess) {
        const diff = await confirmMutation.mutateAsync({
          jobId: job.id,
          candidates: validCandidatesToConfirm,
        });
        onConfirmSuccess(diff);
      } else if (onConfirm) {
        onConfirm();
      }
    } catch (err) {
      console.error('Lỗi khi lưu nguyên liệu vào tủ bếp:', err);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const isSaving = isSavingLocal || isConfirming || confirmMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header thanh công cụ trên cùng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Kiểm tra & Nhập thông tin nguyên liệu
            </h2>
            <Badge variant="secondary" className="text-xs">
              {job.candidates.length} món nhận diện
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Đối chiếu hình ảnh tủ lạnh bên trái và hoàn tất trọng lượng, đơn vị bên phải trước khi
            lưu.
          </p>
        </div>

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
            disabled={isSaving}
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
              disabled={isSaving}
              className="text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
          )}
        </div>
      </div>

      {/* CHIA LÀM 2 PHẦN TRÊN TRANG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* PHẦN BÊN TRÁI (5 CỘT TRÊN DESKTOP): HIỂN THỊ ẢNH TỦ LẠNH */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-4 sm:p-5 shadow-xs space-y-3 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-sm text-foreground">Ảnh chụp tủ lạnh</h3>
              </div>
              {images.length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {currentImageIndex + 1} / {images.length} ảnh
                </Badge>
              )}
            </div>

            {/* Khung hiển thị ảnh lớn */}
            {currentImage ? (
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-inner group flex items-center justify-center">
                <Image
                  src={currentImage.url}
                  alt={`Ảnh tủ lạnh góc ${currentImage.position || currentImageIndex + 1}`}
                  fill
                  className="object-contain transition-transform duration-200"
                  unoptimized
                  priority
                />

                {/* Badge góc chụp */}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-xs">
                  Góc ảnh #{currentImage.position || currentImageIndex + 1}
                </div>

                {/* Nút xem phóng to */}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-full bg-black/65 backdrop-blur-md text-white hover:bg-black/85 transition-opacity"
                  title="Xem phóng to ảnh"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl border border-dashed border-border/80 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Camera className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-xs">Không tìm thấy ảnh tủ lạnh trong tác vụ này.</p>
              </div>
            )}

            {/* Thumbnails chuyển đổi góc chụp khi có nhiều ảnh */}
            {images.length > 1 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Chọn góc chụp để đối chiếu:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === idx
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={`Xem góc ảnh #${idx + 1}`}
                    >
                      <Image
                        src={img.url}
                        alt={`Ảnh thu nhỏ ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hộp gợi ý */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Hướng dẫn</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Nhìn ảnh tủ lạnh bên trái để kiểm tra món đồ, điền trọng lượng và đơn vị vào danh
                sách bên phải. Sau đó nhấn <strong>Lưu vào Tủ bếp</strong> để hoàn tất.
              </p>
            </div>
          </div>
        </div>

        {/* PHẦN BÊN PHẢI (7 CỘT TRÊN DESKTOP): DANH SÁCH TÊN, Ô NHẬP TRỌNG LƯỢNG, ĐƠN VỊ VÀ NÚT SAVE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-4 sm:p-6 shadow-xs space-y-5">
            {/* Header danh sách */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Danh sách nguyên liệu</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeCandidatesCount} món sẽ thêm
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Điền số lượng và đơn vị cho các món thực tế có trong tủ lạnh.
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

            {/* Danh sách các nguyên liệu với ô nhập trọng lượng, đơn vị */}
            <div className="space-y-3">
              {displayedItems.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground text-sm">
                  Không có nguyên liệu nào trong mục này.
                </div>
              ) : (
                displayedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      item.isRejected
                        ? 'bg-muted/30 border-dashed border-border/60 opacity-60'
                        : 'bg-card border-border/80 hover:border-emerald-500/40 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Cột Tên & Badges */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            disabled={item.isRejected || isSaving}
                            placeholder="Tên nguyên liệu..."
                            className={`h-9 font-semibold text-sm sm:text-base border-transparent hover:border-input focus:border-ring bg-transparent px-2 -ml-2 rounded-lg transition-colors ${
                              item.isRejected
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                            }`}
                          />
                        </div>

                        {/* Metadata: gợi ý từ điển & độ tin cậy */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-0.5 flex-wrap">
                          {item.ingredientName ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span>Khớp: {item.ingredientName}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              Độ tin cậy: {item.confidencePercent}%
                            </span>
                          )}

                          {item.freshnessObservation && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400">
                              · {item.freshnessObservation}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Các ô nhập Trọng lượng, Đơn vị và Nút thao tác */}
                      <div className="flex items-end gap-2.5 shrink-0 pt-1 sm:pt-0">
                        {/* Ô nhập trọng lượng */}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground block text-left">
                            Trọng lượng
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                            disabled={item.isRejected || isSaving}
                            placeholder="VD: 500"
                            className="h-9 w-20 sm:w-24 text-center font-medium text-sm"
                          />
                        </div>

                        {/* Ô nhập / chọn đơn vị */}
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground block text-left">
                            Đơn vị
                          </Label>
                          <div className="relative w-24 sm:w-28">
                            <Input
                              value={item.unit}
                              onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                              disabled={item.isRejected || isSaving}
                              placeholder="g, kg, quả..."
                              list={`units-${item.id}`}
                              className="h-9 text-sm px-2.5"
                            />
                            <datalist id={`units-${item.id}`}>
                              {COMMON_UNITS.map((u) => (
                                <option key={u} value={u} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        {/* Các nút hành động */}
                        <div className="flex items-center gap-1">
                          {/* Nút xem góc ảnh */}
                          {/* <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFocusCandidateImage(item)}
                            className="h-9 w-9 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                            title="Xem góc ảnh chụp món này"
                          >
                            <Eye className="h-4 w-4" />
                          </Button> */}

                          {/* Nút sửa nâng cao */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const cand = job.candidates.find((c) => c.id === item.id);
                              if (cand) setEditingCandidate(cand);
                            }}
                            disabled={isSaving}
                            className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
                            title="Chỉnh sửa nâng cao (liên kết từ điển)"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* Nút xóa / khôi phục */}
                          {item.isRejected ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItem(item.id, { isRejected: false })}
                              disabled={isSaving}
                              className="h-9 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Khôi phục nguyên liệu này"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Khôi phục
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => updateItem(item.id, { isRejected: true })}
                              disabled={isSaving}
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              title="Loại bỏ món này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Thanh Footer: Nút SAVE Hoàn tất luồng */}
            <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground text-center sm:text-left">
                Đã chọn <strong className="text-foreground">{activeCandidatesCount}</strong> nguyên
                liệu để thêm vào kho Tủ bếp gia đình.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Hủy bỏ
                </Button>

                {/* NÚT SAVE - LƯU VÀO TỦ BẾP */}
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || activeCandidatesCount === 0}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal phóng to ảnh tủ lạnh */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="sm:max-w-[850px] p-2 bg-neutral-950 border-neutral-800">
          <DialogHeader className="px-4 pt-3 pb-2 text-white">
            <DialogTitle className="text-sm font-semibold">
              Ảnh tủ lạnh góc chụp #{currentImage?.position || currentImageIndex + 1}
            </DialogTitle>
          </DialogHeader>
          {currentImage && (
            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-neutral-900">
              <Image
                src={currentImage.url}
                alt="Ảnh phóng to"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal chỉnh sửa chi tiết ứng viên */}
      <CandidateEditDialog
        open={Boolean(editingCandidate)}
        onOpenChange={(open) => !open && setEditingCandidate(null)}
        candidate={editingCandidate}
        jobId={job.id}
      />
    </div>
  );
}
