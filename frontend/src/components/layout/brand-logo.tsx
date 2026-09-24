'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  /**
   * Biến thể hiển thị:
   * - 'horizontal': Biểu tượng + Chữ VeggieConnect nằm ngang (tối ưu cho Header/Topbar)
   * - 'mark': Chỉ biểu tượng mầm lá chữ V (tối ưu cho icon, avatar, nút thu gọn)
   * - 'full': Logo đầy đủ dạng khối dọc (biểu tượng phía trên, chữ phía dưới)
   */
  variant?: 'horizontal' | 'mark' | 'full';
  /** Kích thước định sẵn */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Có bọc trong thẻ Link về trang chủ không (mặc định: true) */
  asLink?: boolean;
  /** Class tùy biến cho thẻ bao ngoài */
  className?: string;
  /** Class tùy biến cho ảnh */
  imageClassName?: string;
  /** Subtitle hiển thị bên dưới (ví dụ: 'Admin Portal', 'Viet Vegan Companion') */
  withSubtitle?: string;
  /** Ưu tiên tải ảnh ngay (LCP) */
  priority?: boolean;
}

const SIZE_STYLES = {
  horizontal: {
    sm: { height: 28, width: 167 },
    md: { height: 36, width: 215 },
    lg: { height: 44, width: 263 },
    xl: { height: 52, width: 310 },
  },
  mark: {
    sm: { height: 28, width: 28 },
    md: { height: 36, width: 36 },
    lg: { height: 44, width: 44 },
    xl: { height: 56, width: 56 },
  },
  full: {
    sm: { height: 48, width: 80 },
    md: { height: 64, width: 107 },
    lg: { height: 80, width: 134 },
    xl: { height: 112, width: 188 },
  },
};

export function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  asLink = true,
  className,
  imageClassName,
  withSubtitle,
  priority = false,
}: BrandLogoProps) {
  const currentSize = SIZE_STYLES[variant][size];

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      {variant === 'horizontal' ? (
        <div className="flex flex-col justify-center">
          <div className="relative inline-flex items-center">
            {/* Light mode horizontal logo */}
            <Image
              src="/logo/logo-horizontal.png"
              alt="VeggieConnect Logo"
              width={currentSize.width}
              height={currentSize.height}
              priority={priority}
              style={
                imageClassName
                  ? { height: 'auto', maxWidth: '100%' }
                  : { width: currentSize.width, height: currentSize.height }
              }
              className={cn('block object-contain dark:hidden', imageClassName)}
            />
            {/* Dark mode horizontal logo (chữ Connect chuyển sang sáng màu) */}
            <Image
              src="/logo/logo-horizontal-dark.png"
              alt="VeggieConnect Logo"
              width={currentSize.width}
              height={currentSize.height}
              priority={priority}
              style={
                imageClassName
                  ? { height: 'auto', maxWidth: '100%' }
                  : { width: currentSize.width, height: currentSize.height }
              }
              className={cn('hidden object-contain dark:block', imageClassName)}
            />
          </div>
          {withSubtitle && (
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {withSubtitle}
            </span>
          )}
        </div>
      ) : variant === 'mark' ? (
        <div className="flex items-center gap-2">
          <Image
            src="/logo/logo-mark.png"
            alt="VeggieConnect Icon"
            width={currentSize.width}
            height={currentSize.height}
            priority={priority}
            style={{ width: currentSize.width, height: currentSize.height }}
            className={cn('object-contain', imageClassName)}
          />
          {withSubtitle && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground">
                <span className="text-emerald-600 dark:text-emerald-500">Veggie</span>
                <span>Connect</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {withSubtitle}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <Image
            src="/logo/logo-full.png"
            alt="VeggieConnect Full Logo"
            width={currentSize.width}
            height={currentSize.height}
            priority={priority}
            style={{ width: currentSize.width, height: currentSize.height }}
            className={cn('object-contain', imageClassName)}
          />
          {withSubtitle && (
            <span className="text-[11px] font-medium text-muted-foreground">{withSubtitle}</span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        className="flex shrink-0 items-center transition-opacity hover:opacity-90 active:scale-[0.99]"
        aria-label="VeggieConnect Trang chủ"
      >
        {content}
      </Link>
    );
  }

  return content;
}
