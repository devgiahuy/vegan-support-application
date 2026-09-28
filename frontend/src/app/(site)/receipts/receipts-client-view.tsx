'use client';

import React from 'react';
import Link from 'next/link';
import {
  Receipt,
  UploadCloud,
  Layers,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReceiptsClientView() {
  return (
    <div className="container max-w-5xl py-8 sm:py-12 space-y-10">
      {/* Banner giới thiệu Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 sm:p-12 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-emerald-100">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            Nhận diện OCR & Đi chợ thông minh Phase 22
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Quét Hóa Đơn & Tối Ưu Mua Sắm Thực Phẩm
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Chuyển hóa đơn mua hàng giấy thành dữ liệu số trong nháy mắt. AI tự động bóc tách từng
            dòng sản phẩm, khớp với nguyên liệu chuẩn và cập nhật trực tiếp vào kho Tủ bếp gia đình.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/receipts/scan">
              <Button
                size="lg"
                className="rounded-xl px-6 bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-xs"
              >
                <UploadCloud className="h-4 w-4 mr-2 text-emerald-700" />
                Quét hóa đơn ngay
              </Button>
            </Link>

            <Link href="/pantry">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl px-5 border-white/30 text-white hover:bg-white/10"
              >
                <Layers className="h-4 w-4 mr-2" />
                Xem Tủ bếp của tôi
              </Button>
            </Link>
          </div>
        </div>

        {/* Trang trí nền */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Receipt className="w-96 h-96" />
        </div>
      </div>

      {/* 3 Bước hoạt động */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Quy trình bóc tách & nhập kho an toàn
          </h2>
          <p className="text-sm text-muted-foreground">
            Tuyệt đối minh bạch và không tự ý thay đổi số dư tồn kho nếu chưa có sự xác nhận của
            bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Bước 1 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-6 space-y-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-base">Chụp hoặc tải ảnh hóa đơn</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hỗ trợ chụp từ 1 đến 4 ảnh cho hóa đơn dài. Ảnh được tải lên lưu trữ an toàn trong hạn
              mức tài khoản của bạn.
            </p>
          </div>

          {/* Bước 2 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-6 space-y-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-base">Đối chiếu & Rà soát thông minh</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Giao diện 2 cột giúp bạn so sánh trực quan ảnh gốc bên trái và các dòng hàng bóc tách
              bên phải. Tự do sửa số lượng, đổi đơn vị hoặc loại bỏ mặt hàng phi thực phẩm.
            </p>
          </div>

          {/* Bước 3 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-6 space-y-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-base">Xác nhận cập nhật Tủ bếp</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Một cú bấm xác nhận duy nhất để đồng bộ số dư vào Tủ bếp, phục vụ tính toán khoảng
              thiếu đi chợ cho thực đơn tuần tiếp theo.
            </p>
          </div>
        </div>
      </div>

      {/* Điều hướng nhanh sang tính năng liên kết */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/pantry"
          className="group block p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm group-hover:text-emerald-600 transition-colors">
                  Quản lý Tủ bếp gia đình
                </h4>
                <p className="text-xs text-muted-foreground">
                  Xem số dư nguyên liệu và cảnh báo hết hạn
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-emerald-600 transition-transform" />
          </div>
        </Link>

        <Link
          href="/meal-plans"
          className="group block p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                  Kế hoạch Thực đơn & Đi chợ
                </h4>
                <p className="text-xs text-muted-foreground">
                  Tối ưu danh sách mua sắm theo tủ bếp
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-blue-600 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
