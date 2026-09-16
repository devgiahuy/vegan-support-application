'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Leaf, Flame, Calendar, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Skeleton tải trước hiển thị chiếc tô tĩnh và các badge, giữ layout ổn định (tránh CLS).
 */
export function HeroFoodSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      <div className="animate-pulse">
        <Image
          src="/hero/optimized/bowl.webp"
          alt="Đang tải..."
          width={310}
          height={310}
          className="object-contain opacity-70"
          priority
        />
      </div>
    </div>
  );
}

const DynamicHeroFoodPlayer = dynamic(
  () => import('./hero-food-player').then((mod) => mod.HeroFoodPlayer),
  {
    ssr: false,
    loading: () => <HeroFoodSkeleton />,
  }
);

export interface HeroFoodAnimationProps {
  className?: string;
}

/**
 * Visual Hero Animation Component cho Landing Page VeggieConnect.
 * Thay thế hình ảnh tĩnh bằng hoạt cảnh 2D ẩm thực thuần chay với Remotion Player.
 */
export function HeroFoodAnimation({ className = '' }: HeroFoodAnimationProps) {
  // Sync state: kích hoạt hiệu ứng glow nhẹ cho thẻ dinh dưỡng khi món ăn hoàn thành
  const [pulseActive, setPulseActive] = React.useState(false);

  React.useEffect(() => {
    // Vòng lặp 8s (8000ms): Món hoàn chỉnh xuất hiện tại ~6.5s (frame 196/240) và kéo dài ~1.2s
    let timeoutId: ReturnType<typeof setTimeout>;
    const intervalId = setInterval(() => {
      timeoutId = setTimeout(() => {
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 1400);
      }, 6500);
    }, 8000);

    // Kích hoạt ngay cho chu kỳ đầu tiên
    const initialTimeout = setTimeout(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 1400);
    }, 6500);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, []);

  return (
    <div
      className={`relative aspect-[4/4.2] w-full overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-background to-secondary/30 shadow-sm backdrop-blur-sm ${className}`}
    >
      {/* Vòng sáng ambient phía sau tăng chiều sâu */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/15" />

      {/* Hoạt cảnh Remotion Player chính */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <DynamicHeroFoodPlayer />
      </div>

      {/* BADGE 1 (Góc trên - phải): Lịch Chay */}
      <Badge className="absolute right-3.5 top-3.5 z-20 gap-1.5 rounded-full border border-border/70 bg-background/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md transition-transform hover:scale-105">
        <Calendar className="h-3.5 w-3.5 text-primary" /> Lịch Chay: Hôm nay Mùng Một
      </Badge>

      {/* BADGE 2 (Góc dưới - trái): Thẻ Dinh Dưỡng Thực Vật với hiệu ứng đồng bộ */}
      <div
        className={`absolute bottom-3.5 left-3.5 z-20 rounded-2xl border bg-background/95 p-3.5 shadow-md backdrop-blur-md transition-all duration-500 ${
          pulseActive
            ? 'scale-105 border-emerald-500/60 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/25'
            : 'border-border/70'
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Flame className="h-4 w-4 text-amber-500" />
          <span>385 kcal</span>
          {pulseActive && <Sparkles className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Leaf className="h-3.5 w-3.5 text-primary" />
          <span>18g Protein thực vật</span>
        </div>
      </div>
    </div>
  );
}
