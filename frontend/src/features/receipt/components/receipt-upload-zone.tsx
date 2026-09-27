'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Camera, X, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  uploadWithReservation,
  validateUploadFile,
  type UploadProgressInfo,
} from '@/features/storage/api/storage-upload';
import { useCreateReceiptJobMutation } from '../queries/receipt.queries';
import type { ReceiptJob } from '../types/receipt.model';

interface SelectedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
  assetId?: string;
}

interface ReceiptUploadZoneProps {
  onJobCreated: (job: ReceiptJob) => void;
  disabled?: boolean;
}

const MAX_IMAGES = 4;

export function ReceiptUploadZone({ onJobCreated, disabled = false }: ReceiptUploadZoneProps) {
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createJobMutation = useCreateReceiptJobMutation();

  const handleFilesAdded = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (selectedImages.length + fileArray.length > MAX_IMAGES) {
      toast.error(`Bạn chỉ có thể chọn tối đa ${MAX_IMAGES} ảnh hóa đơn cho mỗi lần quét.`);
      return;
    }

    const newItems: SelectedImageItem[] = [];

    for (const file of fileArray) {
      const validation = validateUploadFile(file, 'RECEIPT_IMAGE');
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error || 'Tệp không hợp lệ'}`);
        continue;
      }

      newItems.push({
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `img-${Date.now()}-${Math.random()}`,
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
    setSelectedImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleStartUploadAndJob = async () => {
    if (selectedImages.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ảnh hóa đơn.');
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

        const asset = await uploadWithReservation(item.file, {
          kind: 'RECEIPT_IMAGE',
          onProgress: (prog: UploadProgressInfo) => {
            const currentItemProgress = prog.percent;
            setSelectedImages((prev) =>
              prev.map((img) =>
                img.id === item.id ? { ...img, progress: currentItemProgress } : img
              )
            );
            const calculatedTotal = Math.round(((i + currentItemProgress / 100) / totalCount) * 85);
            setOverallProgress(Math.max(5, calculatedTotal));
          },
        });

        committedAssetIds.push(asset.id);

        setSelectedImages((prev) =>
          prev.map((img) =>
            img.id === item.id ? { ...img, status: 'done', progress: 100, assetId: asset.id } : img
          )
        );
      }

      setOverallProgress(90);

      // Tạo tác vụ nhận diện
      const newJob = await createJobMutation.mutateAsync({
        imageAssetIds: committedAssetIds,
        idempotencyKey:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `receipt-job-${Date.now()}`,
      });

      setOverallProgress(100);
      onJobCreated(newJob);
    } catch (err: any) {
      const errMsg = err?.message || 'Có lỗi xảy ra trong quá trình tải ảnh hoặc tạo tác vụ';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Khung tải lên / Kéo thả */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading && !disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (!isUploading && !disabled && e.dataTransfer.files) {
            handleFilesAdded(e.dataTransfer.files);
          }
        }}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-colors duration-200 text-center ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/70'
        } ${isUploading || disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
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

        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white dark:bg-neutral-800 shadow-xs mb-4 text-emerald-600 dark:text-emerald-400">
          <Receipt className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          Tải ảnh hóa đơn siêu thị
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Kéo thả tệp ảnh vào đây hoặc chọn từ máy tính. Hóa đơn dài có thể chụp từ 1 đến{' '}
          {MAX_IMAGES} ảnh liên tiếp.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={isUploading || disabled || selectedImages.length >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Chọn ảnh từ thiết bị
          </Button>

          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isUploading || disabled || selectedImages.length >= MAX_IMAGES}
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-xl px-4 sm:flex"
          >
            <Camera className="h-4 w-4 mr-2" />
            Chụp ảnh trực tiếp
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Hỗ trợ JPG, PNG, WebP, AVIF. Tối đa 10 MB/ảnh. Tối đa {MAX_IMAGES} ảnh.</span>
        </div>
      </div>

      {/* Danh sách ảnh đã chọn */}
      {selectedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Ảnh đã chọn ({selectedImages.length}/{MAX_IMAGES})
            </h4>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                  setSelectedImages([]);
                }}
              >
                Xóa tất cả
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {selectedImages.map((img, idx) => (
              <div
                key={img.id}
                className="relative group rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-card aspect-3/4 flex flex-col justify-end"
              >
                <Image
                  src={img.previewUrl}
                  alt={`Hóa đơn đoạn ${idx + 1}`}
                  fill
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-medium text-white">
                  Đoạn {idx + 1}
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    aria-label={`Xóa đoạn ${idx + 1}`}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-destructive text-white transition-colors duration-150"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="relative p-3 z-10 text-white text-xs">
                  <div className="truncate font-medium">{img.file.name}</div>
                  <div className="text-[11px] text-neutral-300">
                    {(img.file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>

                  {img.status === 'uploading' && (
                    <div className="mt-2 space-y-1">
                      <Progress value={img.progress} className="h-1.5 bg-white/20" />
                      <div className="text-[10px] text-neutral-200 text-right">{img.progress}%</div>
                    </div>
                  )}

                  {img.status === 'done' && (
                    <div className="mt-1 text-[11px] text-emerald-400 font-medium">
                      ✓ Đã tải lên
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Thanh tiến trình tổng thể */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                  Đang tải ảnh và khởi tạo tác vụ bóc tách...
                </span>
                <span className="text-muted-foreground">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          {/* Nút bắt đầu bóc tách */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="lg"
              disabled={isUploading || disabled || selectedImages.length === 0}
              onClick={handleStartUploadAndJob}
              className="rounded-xl px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý ({overallProgress}%)
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Bắt đầu bóc tách hóa đơn ({selectedImages.length} ảnh)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
