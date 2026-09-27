'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReceiptImage } from '../types/receipt.model';

interface ReceiptImageViewerProps {
  images: ReceiptImage[];
  selectedImageId?: string;
  onSelectImage?: (id: string) => void;
}

export function ReceiptImageViewer({
  images,
  selectedImageId,
  onSelectImage,
}: ReceiptImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-muted-foreground text-sm aspect-3/4">
        <p>Không tìm thấy ảnh hóa đơn nào.</p>
      </div>
    );
  }

  const activeIndex = selectedImageId
    ? Math.max(
        0,
        images.findIndex((img) => img.id === selectedImageId)
      )
    : currentIndex;
  const currentImage = images[activeIndex] || images[0];

  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.75, prev - 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleSelectTab = (idx: number) => {
    setCurrentIndex(idx);
    handleReset();
    if (onSelectImage && images[idx]) {
      onSelectImage(images[idx].id);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 overflow-hidden shadow-xs">
      {/* Thanh công cụ xem ảnh */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 backdrop-blur-xs border-b border-neutral-800 text-white z-10">
        <div className="flex items-center gap-1.5">
          {images.length > 1 && (
            <div className="flex items-center gap-1 mr-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => handleSelectTab(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeIndex === idx
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  Đoạn {idx + 1}
                </button>
              ))}
            </div>
          )}
          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
            title="Phóng to"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
            title="Thu nhỏ"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
            title="Xoay 90°"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {(zoom !== 1 || rotation !== 0) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg"
              title="Đặt lại"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Vùng hiển thị ảnh tương tác */}
      <div className="relative flex-1 min-h-[420px] sm:min-h-[560px] overflow-auto flex items-center justify-center p-4 bg-neutral-900/40 select-none">
        <div
          className="relative transition-transform duration-200 ease-out origin-center will-change-transform max-w-full"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          {currentImage.url ? (
            <img
              src={currentImage.url}
              alt={`Hóa đơn đoạn ${activeIndex + 1}`}
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          ) : (
            <div className="flex items-center justify-center w-64 h-96 bg-neutral-800 text-neutral-400 text-xs rounded-lg">
              Ảnh không khả dụng
            </div>
          )}
        </div>
      </div>

      {/* Chú thích vị trí ảnh */}
      <div className="px-4 py-2 bg-neutral-900/90 text-xs text-neutral-400 flex items-center justify-between border-t border-neutral-800">
        <span>
          Ảnh hóa đơn ({activeIndex + 1}/{images.length})
        </span>
        <span className="text-[11px] text-neutral-500">Dùng thanh công cụ để zoom và xoay ảnh</span>
      </div>
    </div>
  );
}
