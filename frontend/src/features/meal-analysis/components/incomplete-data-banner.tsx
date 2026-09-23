'use client';

import * as React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface IncompleteDataBannerProps {
  confidence: number;
  notes?: string | null;
  className?: string;
}

/**
 * Banner thông báo độ bao phủ dữ liệu dinh dưỡng chưa hoàn thiện.
 * Tuân thủ quy tắc: "Incomplete data is NOT zero".
 */
export function IncompleteDataBanner({
  confidence,
  notes,
  className = '',
}: IncompleteDataBannerProps) {
  const percent = Math.round(confidence * 100);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-300 ${className}`}
    >
      <HelpCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            Dữ liệu dinh dưỡng chưa hoàn chỉnh (Độ tin cậy: {percent}%)
          </span>
        </div>
        <p className="leading-relaxed text-muted-foreground">
          {notes ??
            'Thực đơn tuần có chứa món ăn cá nhân hoặc nguyên liệu tự do chưa được chuẩn hóa với cơ sở dữ liệu thực phẩm.'}
        </p>
        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
          ⚠️ Hệ thống tính toán chỉ số dựa trên các thành phần đã kiểm định và{' '}
          <strong>tuyệt đối không coi các nguyên liệu còn thiếu là 0 calo/0 vi chất</strong>.
        </p>
      </div>
    </div>
  );
}
