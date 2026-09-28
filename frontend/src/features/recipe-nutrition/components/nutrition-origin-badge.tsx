'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Scale, ShieldCheck, UserCheck } from 'lucide-react';
import type { NutritionOriginType } from '../types/recipe-nutrition.model';

export interface NutritionOriginBadgeProps {
  origin: NutritionOriginType;
  isAiEstimated?: boolean;
  confidencePercent?: number;
  className?: string;
}

export function NutritionOriginBadge({
  origin,
  isAiEstimated = false,
  confidencePercent,
  className,
}: NutritionOriginBadgeProps) {
  const isAi = isAiEstimated || origin === 'AI_ESTIMATED';

  let config = {
    label: 'Tính toán khoa học',
    icon: Scale,
    badgeClasses:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    tooltip:
      'Số liệu tính toán xác định dựa trên thành phần nguyên liệu chuẩn và hệ số chế biến thực tế.',
  };

  if (isAi) {
    config = {
      label: 'AI ước lượng',
      icon: Sparkles,
      badgeClasses:
        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      tooltip:
        'Chỉ số được mô hình AI ước lượng bổ trợ do thiếu dữ liệu nhiệt/phương pháp nấu chuẩn. Chỉ mang tính tham khảo.',
    };
  } else if (origin === 'VERIFIED_OVERRIDE') {
    config = {
      label: 'Xác minh chuyên môn',
      icon: ShieldCheck,
      badgeClasses:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      tooltip: 'Chỉ số đã được kiểm duyệt viên và chuyên gia dinh dưỡng rà soát thực tế.',
    };
  } else if (origin === 'USER_PROVIDED') {
    config = {
      label: 'Người dùng nhập',
      icon: UserCheck,
      badgeClasses:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      tooltip: 'Chỉ số do người tạo công thức trực tiếp khai báo.',
    };
  }

  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium cursor-help transition-colors ${config.badgeClasses} ${
              className || ''
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span>{config.label}</span>
            {confidencePercent !== undefined && confidencePercent > 0 && (
              <span className="opacity-75 font-normal">({confidencePercent}%)</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
