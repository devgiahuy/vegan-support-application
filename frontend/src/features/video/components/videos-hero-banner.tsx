'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Play,
  UploadCloud,
  Sparkles,
  Clock,
  ChefHat,
  Leaf,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';

export function VideosHeroBanner() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card/60 shadow-xl shadow-primary/5 backdrop-blur-sm">
      {/* Background Image Layer */}
      <div className="absolute inset-0 select-none pointer-events-none">
        <Image
          src="/videos/hero-bg.jpg"
          alt="Phim trường hướng dẫn nấu món chay trực quan cùng đầu bếp chuyên nghiệp"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-right lg:object-[80%_center] transition-transform duration-1000 ease-out scale-100"
        />
        {/* Multi-layered directional scrim for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/92 to-background/40 dark:from-[#0b1410]/98 dark:via-[#0b1410]/92 dark:to-[#0b1410]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent sm:hidden" />
        {/* Subtle radial emerald glow */}
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Core Editorial Headline & CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-8 space-y-5"
          >
            {/* Pill Eyebrow */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 dark:bg-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <Play className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>Kho Video Nấu Chay Chọn Lọc</span>
              </span>

              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>AI Tóm Tắt &amp; Mốc Thời Gian Tự Động</span>
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-foreground tracking-tight leading-[1.18]">
                Kho Video{' '}
                <span className="block sm:inline bg-gradient-to-r from-primary via-emerald-600 to-sprout dark:from-emerald-400 dark:via-green-300 dark:to-lime-300 bg-clip-text text-transparent">
                  Nấu Chay Trực Quan
                </span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl font-normal">
                Học nấu ăn chay dễ dàng qua các video chất lượng cao từ Chuyên gia dinh dưỡng và Đầu
                bếp có kinh nghiệm. Mọi video đều có{' '}
                <strong className="font-semibold text-foreground">
                  tóm tắt công thức và mốc thời gian tự động từ AI
                </strong>
                .
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                asChild
                size="lg"
                className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 text-sm sm:text-base"
              >
                <Link href="/videos/new">
                  <UploadCloud className="h-5 w-5" />
                  <span>Đăng video nấu chay</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl gap-2 bg-background/80 hover:bg-background/95 backdrop-blur-md border border-border/90 hover:border-primary/40 text-foreground font-semibold shadow-xs transition-all duration-200 active:scale-[0.98] h-12 px-5 text-sm sm:text-base"
              >
                <Link href="/profile?tab=posts">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Bài viết &amp; Công thức của tôi</span>
                </Link>
              </Button>
            </motion.div>

            {/* Content Pillars Micro-Pills */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground/90"
            >
              <div className="flex items-center gap-1.5 rounded-xl bg-background/60 dark:bg-card/60 border border-border/60 px-2.5 py-1 backdrop-blur-xs">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Mốc thời gian nguyên liệu chuẩn xác</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-background/60 dark:bg-card/60 border border-border/60 px-2.5 py-1 backdrop-blur-xs">
                <ChefHat className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Thực hiện bởi Đầu bếp chuyên nghiệp</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-background/60 dark:bg-card/60 border border-border/60 px-2.5 py-1 backdrop-blur-xs">
                <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>100% Thuần chay &amp; Lành mạnh</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Floating Video Highlight Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 hidden lg:flex flex-col justify-end items-end"
          >
            <div className="w-full max-w-xs rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-card/70 p-4 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Trợ Lý Video AI
                </span>
                <span className="rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Chuẩn 4K / HD
                </span>
              </div>

              <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                Tự động trích xuất các bước chế biến, chia timeline từng công đoạn và ước tính định
                lượng calo tức thì.
              </p>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Đã kiểm chứng dinh dưỡng
                </span>
                <Link
                  href="/videos/new"
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Tải video lên &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
