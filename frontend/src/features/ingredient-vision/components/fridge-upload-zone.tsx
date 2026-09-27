'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Camera, X, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
        id: crypto.randomUUID(),
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
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
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

      for (let i = 0; i < selectedImages.length; i++) {
        const item = selectedImages[i];

        // Cập nhật trạng thái từng ảnh
        setSelectedImages((prev) =>
          prev.map((img) => (img.id === item.id ? { ...img, status: 'uploading' } : img))
        );

        try {
          const asset = await uploadWithReservation(item.file, {
            kind: 'FRIDGE_IMAGE',
            onProgress: (pInfo: UploadProgressInfo) => {
              setSelectedImages((prev) =>
                prev.map((img) => (img.id === item.id ? { ...img, progress: pInfo.percent } : img))
              );
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

          setOverallProgress(Math.round(((i + 1) / selectedImages.length) * 80));
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể khởi tạo tác vụ nhận diện.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Khung tải ảnh / Dropzone */}
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
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-neutral-300 dark:border-neutral-700 bg-card hover:border-emerald-400'
        } ${disabled || isUploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesAdded(e.target.files);
            e.target.value = '';
          }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesAdded(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <UploadCloud className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Kéo thả hoặc tải ảnh tủ lạnh lên
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Hỗ trợ 1 đến 6 ảnh các ngăn bên trong tủ lạnh (JPG, PNG, WebP, AVIF, tối đa 10
              MB/ảnh).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || selectedImages.length >= MAX_IMAGES}
              className="flex items-center gap-1.5"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Chọn ảnh từ máy</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading || selectedImages.length >= MAX_IMAGES}
              className="flex items-center gap-1.5"
            >
              <Camera className="h-4 w-4" />
              <span>Chụp từ camera</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Danh sách ảnh đã chọn */}
      {selectedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Ảnh đã chọn ({selectedImages.length}/{MAX_IMAGES})
            </h4>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                  setSelectedImages([]);
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Xóa tất cả
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {selectedImages.map((item, idx) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-square"
              >
                <Image
                  src={item.previewUrl}
                  alt={`Tủ lạnh ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Badge số thứ tự */}
                <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </div>

                {/* Nút xóa */}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(item.id)}
                    aria-label={`Xóa ảnh ${idx + 1}`}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-destructive hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Overlay tiến trình khi đang upload */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-white">
                    <Loader2 className="h-5 w-5 animate-spin mb-1 text-emerald-400" />
                    <span className="text-xs font-semibold">{item.progress}%</span>
                  </div>
                )}

                {/* Overlay lỗi */}
                {item.status === 'error' && (
                  <div className="absolute inset-0 bg-destructive/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-white text-center">
                    <AlertCircle className="h-5 w-5 mb-1" />
                    <span className="text-[10px] leading-tight">Lỗi tải ảnh</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Thanh tiến trình chung khi đang xử lý */}
          {isUploading && (
            <div className="space-y-2 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang tải lên và khởi tạo nhận diện...
                </span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          {/* Nút bắt đầu */}
          {!isUploading && (
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleStartRecognition}
                disabled={selectedImages.length === 0 || isUploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 px-6"
              >
                <Sparkles className="h-4 w-4" />
                <span>Bắt đầu nhận diện AI</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
