'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssistantThinkingProps {
  className?: string;
}

const THINKING_STAGES = [
  'Đang suy nghĩ...',
  'Đang phân tích thông tin dinh dưỡng...',
  'Đang tổng hợp câu trả lời cho bạn...',
];

/**
 * Trạng thái chờ phản hồi của Trợ lý AI VeggieConnect:
 * - Thay thế spinner robot đơn điệu bằng thiết kế AI hiện đại, có chiều sâu thị giác.
 * - Hiệu ứng ánh sáng dịu nhẹ (ambient breathing) đồng bộ cùng màu thương hiệu xanh lá/ngọc lục bảo.
 * - Dynamic stage hints luân phiên mượt mà theo thời gian chờ, tạo cảm giác thông minh và phản hồi liên tục.
 * - Shimmer skeleton wave tinh tế mô phỏng dòng suy nghĩ đang được chuẩn bị.
 * - Đảm bảo chuẩn tiếp cận (a11y) và tôn trọng cấu hình `prefers-reduced-motion`.
 */
export function AssistantThinking({ className }: AssistantThinkingProps) {
  const [stageIndex, setStageIndex] = React.useState(0);

  React.useEffect(() => {
    // Luân chuyển gợi ý trạng thái theo thời gian
    const timer1 = setTimeout(() => setStageIndex(1), 2600);
    const timer2 = setTimeout(() => setStageIndex(2), 5800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Trợ lý đang suy nghĩ câu trả lời"
      className={cn('flex flex-col gap-2.5 py-0.5', className)}
    >
      <span className="sr-only">Trợ lý AI đang suy nghĩ câu trả lời...</span>

      {/* Header trạng thái: Icon phát sáng + Text trạng thái + Dấu chấm động */}
      <div className="flex items-center gap-2 text-muted-foreground">
        {/* Animated Badge Icon */}
        <div className="relative flex size-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400">
          <span
            className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-60 motion-reduce:hidden"
            aria-hidden="true"
          />
          <Sparkles
            className="relative size-3 animate-pulse text-emerald-600 dark:text-emerald-400 motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>

        {/* Dynamic Status Text */}
        <span className="text-xs font-medium tracking-tight text-foreground/85 transition-opacity duration-300">
          {THINKING_STAGES[stageIndex]}
        </span>

        {/* 3 Bouncing Dots Wave */}
        <span className="inline-flex items-center gap-1 pl-0.5" aria-hidden="true">
          <span className="size-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s] motion-reduce:animate-none" />
          <span className="size-1 rounded-full bg-emerald-500/80 animate-bounce [animation-delay:-0.15s] motion-reduce:animate-none" />
          <span className="size-1 rounded-full bg-emerald-500/50 animate-bounce motion-reduce:animate-none" />
        </span>
      </div>

      {/* Shimmer skeleton wave (Mô phỏng nội dung câu trả lời đang hình thành) */}
      <div className="flex flex-col gap-1.5 pt-0.5" aria-hidden="true">
        <div className="h-1.5 w-44 max-w-[80%] rounded-full bg-gradient-to-r from-muted via-emerald-500/20 to-muted animate-pulse motion-reduce:animate-none" />
        <div className="h-1.5 w-28 max-w-[55%] rounded-full bg-gradient-to-r from-muted via-teal-500/15 to-muted animate-pulse [animation-delay:200ms] motion-reduce:animate-none" />
      </div>
    </div>
  );
}
