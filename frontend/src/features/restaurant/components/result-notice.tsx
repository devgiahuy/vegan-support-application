'use client';

import * as React from 'react';
import { AlertTriangle, Info, MapPinOff } from 'lucide-react';
import type { DiscoveryNotice } from '../types/restaurant.model';

export interface ResultNoticeProps {
  /** Cảnh báo đã dịch sẵn từ mapper; nội dung lấy thẳng `notice.message`. */
  notices: DiscoveryNotice[];
  className?: string;
}

/**
 * Khối cảnh báo đặt trên đầu danh sách kết quả (FR-008, FR-010, FR-038).
 *
 * Bắt buộc hiển thị:
 * - `UNAVAILABLE`: nhà cung cấp bản đồ không phản hồi.
 * - `TRUNCATED`: kết quả bị cắt bởi giới hạn nhà cung cấp.
 * - `ATTRIBUTION`: có dữ liệu từ nguồn bên ngoài — nghĩa vụ ghi nhận nguồn.
 */
export function ResultNotice({ notices, className }: ResultNoticeProps) {
  if (!notices || notices.length === 0) return null;

  return (
    <div className={className} role="status" aria-live="polite">
      <div className="space-y-1.5">
        {notices.map((notice) => {
          // Cam kết riêng tư là thông tin điều kiện, không phải cảnh báo → hiển thị nhẹ hơn.
          if (notice.kind === 'PRIVACY') {
            return (
              <p
                key={notice.kind}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                <MapPinOff className="size-3 shrink-0" aria-hidden="true" />
                {notice.message}
              </p>
            );
          }

          const isWarning = notice.tone === 'warning';
          const Icon = isWarning ? AlertTriangle : Info;
          return (
            <div
              key={notice.kind}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                isWarning
                  ? 'border-amber-500/30 bg-amber-50/60 text-amber-800 dark:bg-amber-950/25 dark:text-amber-300'
                  : 'border-sky-500/25 bg-sky-50/50 text-sky-800 dark:bg-sky-950/20 dark:text-sky-300'
              }`}
            >
              <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span className="leading-relaxed">{notice.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
