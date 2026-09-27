'use client';

import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface FreshnessDisclaimerBannerProps {
  disclaimer?: string;
  className?: string;
}

export function FreshnessDisclaimerBanner({
  disclaimer,
  className = '',
}: FreshnessDisclaimerBannerProps) {
  const text =
    disclaimer ||
    'Quan sát độ tươi chỉ là ước lượng thị giác sơ bộ từ hình ảnh. Người dùng phải tự kiểm tra chất lượng thực phẩm thực tế trước khi sử dụng; hệ thống không đưa ra quyết định hay chứng nhận về an toàn thực phẩm.';

  return (
    <div
      role="note"
      aria-label="Khuyến cáo an toàn thực phẩm"
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs sm:text-sm ${className}`}
    >
      <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <span className="font-semibold text-amber-800 dark:text-amber-300">
          Khuyến cáo an toàn thực phẩm & độ tươi:
        </span>{' '}
        <span className="text-amber-700/90 dark:text-amber-300/90 leading-relaxed">{text}</span>
      </div>
    </div>
  );
}
