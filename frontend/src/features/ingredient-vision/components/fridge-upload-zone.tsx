'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Camera,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Maximize2,
  HelpCircle,
  Refrigerator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  uploadWithReservation,
  validateUploadFile,
  type UploadProgressInfo,
} from '@/features/storage/api/storage-upload';
import { useCreateRecognitionJobMutation } from '../queries/ingredient-recognition.queries';
import type { RecognitionJob } from '../types/ingredient-recognition.model';

interface SelectedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
  assetId?: string;
}

interface FridgeUploadZoneProps {
  onJobCreated: (job: RecognitionJob) => void;
  disabled?: boolean;
}

const MAX_IMAGES = 6;

export function FridgeUploadZone({ onJobCreated, disabled = false }: FridgeUploadZoneProps) {
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Xem trước ảnh phóng to (Lightbox)
  const [previewingImage, setPreviewingImage] = useState<SelectedImageItem | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Thu hồi các Object URL khi component unmount
  const selectedImagesRef = useRef(selectedImages);
  selectedImagesRef.current = selectedImages;

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, []);

  const createJobMutation = useCreateRecognitionJobMutation();

  const handleFilesAdded = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (selectedImages.length + fileArray.length > MAX_IMAGES) {
      toast.error(`Bạn chỉ có thể chọn tối đa ${MAX_IMAGES} ảnh cho mỗi lần quét.`);
      return;
    }

    const newItems: SelectedImageItem[] = [];

    for (const file of fileArray) {
      const validation = validateUploadFile(file, 'FRIDGE_IMAGE');
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error || 'Tệp không hợp lệ'}`);
        continue;
      }

      newItems.push({
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `fridge-img-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'idle',
      });
    }

    if (newItems.length > 0) {
      setSelectedImages((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemoveImage = (id: string) => {
    if (isUploading) return;
    setSelectedImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
    if (previewingImage?.id === id) {
      setPreviewingImage(null);
    }
  };

  const handleClearAll = () => {
    if (isUploading) return;
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
    setPreviewingImage(null);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedImages.length || isUploading) return;
    setSelectedImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleZoomIn = () => setPreviewZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setPreviewZoom((prev) => Math.max(0.75, prev - 0.25));
  const handleRotate = () => setPreviewRotation((prev) => (prev + 90) % 360);
  const handleResetPreview = () => {
    setPreviewZoom(1);
    setPreviewRotation(0);
  };

  const handleStartRecognition = async () => {
    if (selectedImages.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ảnh tủ lạnh.');
      return;
    }

    setIsUploading(true);
    setOverallProgress(5);

    try {
      const committedAssetIds: string[] = [];
      const totalCount = selectedImages.length;

      for (let i = 0; i < totalCount; i++) {
        const item = selectedImages[i];

        setSelectedImages((prev) =>
          prev.map((img) => (img.id === item.id ? { ...img, status: 'uploading' } : img))
        );

        try {
          const asset = await uploadWithReservation(item.file, {
            kind: 'FRIDGE_IMAGE',
            onProgress: (pInfo: UploadProgressInfo) => {
              const currentItemProgress = pInfo.percent;
              setSelectedImages((prev) =>
                prev.map((img) =>
                  img.id === item.id ? { ...img, progress: currentItemProgress } : img
                )
              );
              const calculatedTotal = Math.round(
                ((i + currentItemProgress / 100) / totalCount) * 85
              );
              setOverallProgress(Math.max(5, calculatedTotal));
            },
          });

          committedAssetIds.push(asset.id);

          setSelectedImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? { ...img, status: 'done', progress: 100, assetId: asset.id }
                : img
            )
          );
        } catch (uploadErr) {
          const errMsg = uploadErr instanceof Error ? uploadErr.message : 'Tải lên ảnh thất bại';
          setSelectedImages((prev) =>
            prev.map((img) =>
              img.id === item.id ? { ...img, status: 'error', error: errMsg } : img
            )
          );
          throw new Error(`Lỗi khi tải ảnh ${item.file.name}: ${errMsg}`);
        }
      }

      setOverallProgress(90);

      // Bước 2: Tạo recognition job bất đồng bộ
      const job = await createJobMutation.mutateAsync({
        imageAssetIds: committedAssetIds,
      });

      setOverallProgress(100);
      toast.success('Đã tải ảnh lên và khởi tạo nhận diện thành công!');
      onJobCreated(job);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể khởi tạo tác vụ nhận diện.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Hidden file & camera inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesAdded(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesAdded(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* TRẠNG THÁI 1: CHƯA CHỌN ẢNH NÀO */}
      {selectedImages.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (!disabled && !isUploading && e.dataTransfer.files) {
              handleFilesAdded(e.dataTransfer.files);
            }
          }}
          className={`relative flex flex-col items-center justify-center p-8 sm:p-14 rounded-3xl border-2 border-dashed transition-all duration-200 text-center ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-4 ring-emerald-500/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-card hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 shadow-xs'
          } ${disabled || isUploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="flex items-center justify-center size-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60 shadow-xs mb-4">
            <Refrigerator className="size-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Tải ảnh các ngăn tủ lạnh
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
            Kéo thả ảnh vào đây hoặc chọn từ thiết bị. Bạn có thể chụp từ 1 đến {MAX_IMAGES} ảnh các
            ngăn tủ (ngăn mát, ngăn rau củ, ngăn đông, cánh tủ) để AI quét toàn diện.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="default"
              size="default"
              disabled={isUploading || disabled}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl px-5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium"
            >
              <UploadCloud className="size-4 mr-2" />
              Chọn ảnh từ thiết bị
            </Button>

            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={isUploading || disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-xl px-4 h-11 border-neutral-200 dark:border-neutral-800"
            >
              <Camera className="size-4 mr-2" />
              Chụp ảnh trực tiếp
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <AlertCircle className="size-3.5 text-neutral-500" />
              JPG, PNG, WebP, AVIF • Tối đa 10 MB/ảnh
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
              Tối đa {MAX_IMAGES} ảnh các ngăn tủ
            </span>
          </div>
        </div>
      )}

      {/* TRẠNG THÁI 2: ĐÃ CHỌN TỪ 1 ĐẾN 6 ẢNH — HIỂN THỊ TRỰC TIẾP TRONG KHUNG LÀM VIỆC */}
      {selectedImages.length > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading && !disabled && selectedImages.length < MAX_IMAGES) {
              setIsDragOver(true);
            }
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (!isUploading && !disabled && e.dataTransfer.files) {
              handleFilesAdded(e.dataTransfer.files);
            }
          }}
          className={`relative rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-card p-5 sm:p-7 shadow-xs space-y-6 ${
            isDragOver ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''
          }`}
        >
          {/* Drag Overlay khi đang kéo thả thêm ảnh */}
          {isDragOver && (
            <div className="absolute inset-0 z-30 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/90 backdrop-blur-xs border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center p-6 text-center text-emerald-800 dark:text-emerald-200 animate-in fade-in-50 duration-150">
              <Plus className="size-10 mb-2 text-emerald-600 animate-bounce" />
              <p className="font-semibold text-base">Thả tệp ảnh vào đây để thêm ảnh ngăn tủ</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tối đa {MAX_IMAGES} ảnh cho mỗi lần quét
              </p>
            </div>
          )}

          {/* Thanh tiêu đề & các thao tác đầu khung */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Ảnh tủ lạnh đã chọn
                  </h3>
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs tabular-nums px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {selectedImages.length}/{MAX_IMAGES} ảnh
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI sẽ nhận diện đồng thời các loại rau củ, trái cây, gia vị trong tất cả ảnh
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {selectedImages.length < MAX_IMAGES && !isUploading && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl h-8 px-3 text-xs border-neutral-200 dark:border-neutral-800 hover:border-emerald-500"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Thêm ảnh {selectedImages.length + 1}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    className="rounded-xl h-8 px-2.5 text-xs border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 sm:flex"
                    title="Chụp ảnh ngăn tiếp theo"
                    aria-label="Chụp ảnh ngăn tiếp theo"
                  >
                    <Camera className="size-3.5" />
                  </Button>
                </div>
              )}

              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="rounded-xl h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>

          {/* TRƯỜNG HỢP 1: CHỈ CÓ 1 ẢNH ĐƯỢC CHỌN (BỐ CỤC NỔI BẬT TO RÕ, 100% RESPONSIVE) */}
          {selectedImages.length === 1 && (
            <div className="space-y-4">
              {/* Thẻ hiển thị ảnh tủ lạnh đầy đủ */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold shrink-0">
                      Ảnh 1 (Toàn cảnh / Ngăn chính)
                    </span>
                    <span className="text-xs text-muted-foreground truncate font-mono min-w-0 flex-1">
                      {selectedImages[0].file.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewingImage(selectedImages[0])}
                      className="rounded-lg h-7 px-2.5 text-xs border-neutral-200 dark:border-neutral-700 hover:border-emerald-500"
                    >
                      <ZoomIn className="size-3.5 mr-1 text-emerald-600" />
                      Phóng to
                    </Button>

                    {!isUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImage(selectedImages[0].id)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Xóa ảnh này"
                        aria-label="Xóa ảnh này"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Khung chứa ảnh — Sử dụng object-contain để giữ trọn vẹn chi tiết ngăn tủ */}
                <div
                  onClick={() => setPreviewingImage(selectedImages[0])}
                  className="relative w-full h-[400px] sm:h-[480px] rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center cursor-zoom-in group shadow-inner"
                  title="Bấm để phóng to và kiểm tra chi tiết"
                >
                  <Image
                    src={selectedImages[0].previewUrl}
                    alt={selectedImages[0].file.name}
                    fill
                    unoptimized
                    className="object-contain p-2.5 transition-transform duration-200 group-hover:scale-[1.01]"
                  />

                  {/* Nhãn hướng dẫn tinh tế ở góc dưới phải khi hover */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-md border border-white/10">
                      <Maximize2 className="size-3 text-emerald-400" />
                      Bấm để phóng to
                    </span>
                  </div>
                </div>

                {/* Thông số tệp bên dưới ảnh */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    Dung lượng: {(selectedImages[0].file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3.5" />
                    Đã sẵn sàng nhận diện thực phẩm
                  </span>
                </div>
              </div>

              {/* Dải mời thêm ảnh ngăn tiếp theo nằm ngang bên dưới */}
              <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 bg-neutral-50/40 dark:bg-neutral-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-emerald-500/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Plus className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Chụp thêm các ngăn khác?
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bạn có thể chụp thêm tối đa 5 ảnh nữa (ngăn rau củ, ngăn đông, cánh tủ...) để
                      kiểm kê đầy đủ Tủ bếp.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl text-xs h-9 px-3 border-neutral-200 dark:border-neutral-800"
                  >
                    <UploadCloud className="size-3.5 mr-1.5" />
                    Chọn ảnh ngăn khác
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => cameraInputRef.current?.click()}
                    className="rounded-xl text-xs h-9 px-3 border-neutral-200 dark:border-neutral-800"
                  >
                    <Camera className="size-3.5 mr-1.5" />
                    Chụp tiếp
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: TỪ 2 ĐẾN 6 ẢNH (BỐ CỤC LƯỚI CÓ THỨ TỰ & ĐỔI VỊ TRÍ) */}
          {selectedImages.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-3 space-y-2.5 flex flex-col justify-between shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[11px] font-semibold">
                      Ảnh #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Đổi thứ tự trái/phải */}
                      {idx > 0 && !isUploading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveImage(idx, idx - 1)}
                          className="size-6 rounded-md text-muted-foreground hover:text-foreground"
                          title="Chuyển lên trước"
                          aria-label="Chuyển lên trước"
                        >
                          <ArrowLeft className="size-3" />
                        </Button>
                      )}

                      {idx < selectedImages.length - 1 && !isUploading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveImage(idx, idx + 1)}
                          className="size-6 rounded-md text-muted-foreground hover:text-foreground"
                          title="Chuyển ra sau"
                          aria-label="Chuyển ra sau"
                        >
                          <ArrowRight className="size-3" />
                        </Button>
                      )}

                      {!isUploading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveImage(img.id)}
                          className="size-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Xóa ảnh này"
                          aria-label="Xóa ảnh này"
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Ảnh thu nhỏ có khung xem trước */}
                  <div
                    onClick={() => setPreviewingImage(img)}
                    className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center cursor-zoom-in group shadow-inner"
                    title="Bấm để xem phóng to"
                  >
                    <Image
                      src={img.previewUrl}
                      alt={img.file.name}
                      fill
                      unoptimized
                      className="object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/80 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1">
                        <ZoomIn className="size-3" />
                        Xem chi tiết
                      </span>
                    </div>
                  </div>

                  {/* Thông tin đoạn ảnh */}
                  <div className="space-y-1">
                    <div className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      {img.file.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {(img.file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>

                    {img.status === 'uploading' && (
                      <div className="mt-1 space-y-1">
                        <Progress
                          value={img.progress}
                          className="h-1.5 bg-neutral-200 dark:bg-neutral-800"
                        />
                        <div className="text-[10px] text-muted-foreground text-right tabular-nums">
                          {img.progress}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Ô thêm ảnh nếu chưa đủ MAX_IMAGES */}
              {selectedImages.length < MAX_IMAGES && !isUploading && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 hover:border-emerald-500/60 p-4 min-h-[180px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200 space-y-2.5 group"
                >
                  <div className="size-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-muted-foreground group-hover:text-emerald-600 group-hover:border-emerald-500/40 shadow-2xs">
                    <Plus className="size-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-600">
                      Thêm ảnh #{selectedImages.length + 1}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Kéo thả hoặc bấm để chọn tệp
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thanh tiến trình tổng thể khi đang tải lên */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Loader2 className="size-4 animate-spin text-emerald-600" />
                  Đang tải ảnh tủ lạnh và khởi tạo AI nhận diện...
                </span>
                <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                  {overallProgress}%
                </span>
              </div>
              <Progress
                value={overallProgress}
                className="h-2 bg-emerald-200/50 dark:bg-emerald-900/50"
              />
            </div>
          )}

          {/* Thanh hành động chính dưới đáy khung */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <HelpCircle className="size-4 text-emerald-600 shrink-0" />
              <span>
                Sau khi quét, AI sẽ gợi ý danh sách thực phẩm, bạn có thể kiểm tra và chỉnh sửa
                trước khi lưu vào Tủ bếp.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                size="default"
                disabled={isUploading || disabled}
                onClick={handleClearAll}
                className="rounded-xl px-4 text-muted-foreground hover:text-foreground"
              >
                Hủy / Chọn lại
              </Button>

              <Button
                type="button"
                size="lg"
                disabled={isUploading || disabled || selectedImages.length === 0}
                onClick={handleStartRecognition}
                className="rounded-xl px-6 sm:px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs h-11"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Đang xử lý ({overallProgress}%)
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    Bắt đầu nhận diện AI ({selectedImages.length} ảnh)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG XEM PHÓNG TO ẢNH TỦ LẠNH (LIGHTBOX) */}
      <Dialog
        open={Boolean(previewingImage)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewingImage(null);
            handleResetPreview();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-neutral-950 border-neutral-800 text-white rounded-2xl flex flex-col">
          <DialogHeader className="px-5 py-3 border-b border-neutral-800 flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-400" />
                <span>Xem chi tiết ảnh tủ lạnh</span>
              </DialogTitle>
              {previewingImage && (
                <p className="text-xs text-neutral-400 font-mono mt-0.5 truncate max-w-sm sm:max-w-md">
                  {previewingImage.file.name} •{' '}
                  {(previewingImage.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>

            {/* Các nút công cụ phóng to / xoay */}
            <div className="flex items-center gap-1 mr-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="size-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
                title="Phóng to"
                aria-label="Phóng to"
              >
                <ZoomIn className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="size-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
                title="Thu nhỏ"
                aria-label="Thu nhỏ"
              >
                <ZoomOut className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className="size-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
                title="Xoay 90°"
                aria-label="Xoay 90°"
              >
                <RotateCw className="size-4" />
              </Button>

              {(previewZoom !== 1 || previewRotation !== 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleResetPreview}
                  className="size-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
                  title="Đặt lại"
                  aria-label="Đặt lại"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Vùng hiển thị ảnh có zoom và rotate */}
          <div className="relative flex-1 min-h-[380px] sm:min-h-[500px] overflow-auto flex items-center justify-center p-4 bg-neutral-900/50 select-none">
            {previewingImage && (
              <div
                className="relative transition-transform duration-150 ease-out origin-center will-change-transform max-w-full"
                style={{
                  transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewingImage.previewUrl}
                  alt={previewingImage.file.name}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl"
                  draggable={false}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
