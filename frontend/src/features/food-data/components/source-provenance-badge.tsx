'use client';

import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, Info, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProvenanceInfo } from '../types/food-data.model';

interface SourceProvenanceBadgeProps {
  provenance: ProvenanceInfo;
  className?: string;
}

export function SourceProvenanceBadge({ provenance, className = '' }: SourceProvenanceBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-0.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 ${className}`}
        title="Nhấp để xem chi tiết xuất xứ và kiểm định dữ liệu"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">{provenance.sourceName}</span>
        {provenance.licenseName && (
          <Badge
            variant="outline"
            className="ml-0.5 border-emerald-300 bg-white/80 px-1 py-0 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          >
            {provenance.licenseName}
          </Badge>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Minh bạch Xuất xứ Dữ liệu
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Chứng thực nguồn khoa học và cơ sở dữ liệu kiểm định
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex justify-between items-start text-xs">
                <span className="text-muted-foreground">Nguồn xuất bản:</span>
                <span className="font-semibold text-right">{provenance.sourceName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nhà cung cấp / Cơ quan:</span>
                <span className="font-medium text-right">{provenance.provider}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Phiên bản kiểm định:</span>
                <span className="font-mono text-right">{provenance.sourceVersion}</span>
              </div>
              {provenance.effectiveFrom && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ngày áp dụng hiệu lực:</span>
                  <span className="font-mono text-right">{provenance.effectiveFrom}</span>
                </div>
              )}
              {provenance.sourceRecordId && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mã bản ghi gốc:</span>
                  <span className="font-mono text-right">{provenance.sourceRecordId}</span>
                </div>
              )}
            </div>

            {provenance.attribution && (
              <div className="rounded-md border-l-2 border-emerald-500 bg-emerald-50/50 p-2.5 text-xs text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <p className="font-medium mb-0.5">Trích dẫn bản quyền bắt buộc:</p>
                <p className="text-muted-foreground">{provenance.attribution}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  Giấy phép: <strong className="text-foreground">{provenance.licenseName}</strong>
                </span>
              </div>
              {provenance.sourceUrl && (
                <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
                  <a href={provenance.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <span>Xem nguồn gốc</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground italic border-t pt-2 mt-2">
              * Dữ liệu thành phần dinh dưỡng được chuẩn hóa trên 100g phần ăn được. Thông tin này
              nhằm mục đích giáo dục dinh dưỡng và hỗ trợ ẩm thực thuần chay, không thay thế cho
              chẩn đoán y khoa.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
