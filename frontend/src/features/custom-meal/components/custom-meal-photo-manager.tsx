'use client';

import React from 'react';
import Image from 'next/image';
import { Star, Trash2, ArrowLeft, ArrowRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CustomMealPhoto } from '../types/custom-meal.model';

interface CustomMealPhotoManagerProps {
  photos: CustomMealPhoto[];
  onSetCover?: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onMove?: (index: number, direction: 'left' | 'right') => void;
  disabled?: boolean;
}

export const CustomMealPhotoManager: React.FC<CustomMealPhotoManagerProps> = ({
  photos,
  onSetCover,
  onDeletePhoto,
  onMove,
  disabled = false,
}) => {
  if (photos.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10">
        <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-xs text-muted-foreground">Chưa có hình ảnh nào cho món ăn này.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id || index}
          className={`group relative rounded-lg border overflow-hidden bg-muted/20 aspect-video flex flex-col justify-between ${
            photo.isCover ? 'ring-2 ring-primary border-primary' : 'border-border'
          }`}
        >
          {/* Hình ảnh */}
          {photo.url ? (
            <div className="relative w-full h-full">
              <Image
                src={photo.url}
                alt={`Ảnh món ăn ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/40">
              <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}

          {/* Huy hiệu ảnh bìa */}
          {photo.isCover && (
            <div className="absolute top-1.5 left-1.5 z-10">
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 shadow-sm">
                Ảnh bìa
              </Badge>
            </div>
          )}

          {/* Lớp phủ thao tác khi hover */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
              <div className="flex justify-between items-center">
                {/* Nút đặt ảnh bìa */}
                {!photo.isCover && onSetCover && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onSetCover(photo.id)}
                    className="h-7 w-7 text-white hover:text-amber-400 hover:bg-black/30"
                    title="Đặt làm ảnh bìa"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </Button>
                )}
                {photo.isCover && <div />}

                {/* Nút xóa ảnh */}
                {onDeletePhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeletePhoto(photo.id)}
                    className="h-7 w-7 text-white hover:text-destructive hover:bg-black/30"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Nút di chuyển thứ tự */}
              {onMove && photos.length > 1 && (
                <div className="flex justify-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onMove(index, 'left')}
                    disabled={index === 0}
                    className="h-6 w-6 text-white hover:bg-black/30 disabled:opacity-30"
                    title="Di chuyển sang trái"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onMove(index, 'right')}
                    disabled={index === photos.length - 1}
                    className="h-6 w-6 text-white hover:bg-black/30 disabled:opacity-30"
                    title="Di chuyển sang phải"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
