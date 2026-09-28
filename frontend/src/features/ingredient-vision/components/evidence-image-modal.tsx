'use client';

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Layers, Info } from 'lucide-react';
import type { RecognitionCandidate, RecognitionImage } from '../types/ingredient-recognition.model';

interface EvidenceImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: RecognitionCandidate | null;
  images: RecognitionImage[];
}

export function EvidenceImageModal({
  open,
  onOpenChange,
  candidate,
  images,
}: EvidenceImageModalProps) {
  if (!candidate) return null;

  // Tìm các ảnh tương ứng với evidence của candidate
  const evidenceList = candidate.evidence.map((ev) => {
    const matchedImage = images.find(
      (img) => img.id === ev.imageId || img.position === ev.imagePosition
    );
    return {
      ...ev,
      imageUrl: matchedImage?.url || null,
      issue: matchedImage?.issue || null,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <DialogTitle>Bằng chứng nhận diện: {candidate.name}</DialogTitle>
          </div>
          <DialogDescription>
            Các góc ảnh tủ lạnh mà AI đã sử dụng để phân tích và phát hiện ra món này.
          </DialogDescription>
        </DialogHeader>

        {candidate.uncertaintyNote && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-850 text-xs text-muted-foreground border border-neutral-200 dark:border-neutral-800">
            <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{candidate.uncertaintyNote}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {evidenceList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Không tìm thấy bằng chứng hình ảnh chi tiết.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evidenceList.map((ev, idx) => (
                <div
                  key={ev.imageId || idx}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card overflow-hidden shadow-xs space-y-2.5 pb-3"
                >
                  <div className="relative aspect-4/3 w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                    {ev.imageUrl ? (
                      <Image
                        src={ev.imageUrl}
                        alt={`Ảnh góc ${ev.imagePosition}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                        Không có ảnh hiển thị
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                      Góc ảnh #{ev.imagePosition}
                    </div>

                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded-md shadow-xs">
                      {ev.confidencePercent}% tin cậy
                    </div>
                  </div>

                  <div className="px-3 text-xs text-muted-foreground">
                    <span>Độ tin cậy trích xuất trên góc chụp này: </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {ev.confidencePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
