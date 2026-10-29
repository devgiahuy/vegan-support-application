'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sprout } from 'lucide-react';
import { isFooterHidden } from './site-footer-routes';

export function SiteFooter() {
  const pathname = usePathname();

  // Ẩn Footer trên các màn hình công cụ chuyên sâu / toàn màn hình:
  // /assistant, /meal-plans, /restaurants, /pantry, /receipts/scan, /profile
  if (isFooterHidden(pathname)) {
    return null;
  }

  return (
    <footer className="relative mt-16 w-full overflow-hidden bg-[#04120b] text-white antialiased">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* NỀN TỔNG THỂ LIỀN MẠCH                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <Image
          src="/footer/footer-2.png"
          alt=""
          fill
          className="object-cover object-bottom opacity-75"
          priority={false}
        />
        {/* Lớp gradient dịu nhẹ giữ độ tương phản chuẩn cho mọi độ phân giải */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04120b]/80 via-[#04120b]/90 to-[#020b06]" />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* NỘI DUNG CHÍNH (GỌN GÀNG, KHÔNG DỮ LIỆU MOCK / KHÔNG LIÊN QUAN) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Cột 1: Brand & Sứ mệnh */}
            <div className="sm:col-span-2 lg:col-span-4">
              <Link
                href="/"
                className="group inline-flex items-center gap-3 transition-opacity hover:opacity-95"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md transition-all group-hover:bg-emerald-400/40" />
                  <Image
                    src="/logo/logo-mark.png"
                    alt="VeggieConnect Logo"
                    width={40}
                    height={40}
                    className="relative h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(74,222,128,0.6)]"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    VeggieConnect
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-emerald-300/80 uppercase">
                    Ăn chay • Sống khỏe • Kết nối cộng đồng
                  </span>
                </div>
              </Link>

              <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-emerald-100/75 text-pretty">
                Nền tảng hỗ trợ dinh dưỡng thực vật toàn diện, cung cấp công thức thuần chay, thực
                đơn cân bằng và đồng hành cùng lối sống xanh lành mạnh tại Việt Nam.
              </p>

              {/* Thông điệp xanh */}
              <div className="mt-5 flex items-center gap-1.5 italic text-emerald-300/90 text-xs sm:text-sm select-none">
                <span>Vì một tương lai xanh hơn</span>
                <span className="not-italic">🍃</span>
              </div>
            </div>

            {/* Cột 2: Khám phá */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold tracking-wider text-white">Khám phá</h3>
              <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-emerald-100/70">
                <li>
                  <Link href="/" className="transition-colors hover:text-emerald-300">
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <Link href="/recipes" className="transition-colors hover:text-emerald-300">
                    Công thức nấu ăn
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="transition-colors hover:text-emerald-300">
                    Tra cứu dinh dưỡng
                  </Link>
                </li>
                <li>
                  <Link href="/restaurants" className="transition-colors hover:text-emerald-300">
                    Bản đồ quán chay
                  </Link>
                </li>
                <li>
                  <Link href="/articles" className="transition-colors hover:text-emerald-300">
                    Cẩm nang & Bài viết
                  </Link>
                </li>
                <li>
                  <Link href="/videos" className="transition-colors hover:text-emerald-300">
                    Video nấu ăn
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 3: Tiện ích thông minh */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider text-white">Tiện ích</h3>
              <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-emerald-100/70">
                <li>
                  <Link href="/assistant" className="transition-colors hover:text-emerald-300">
                    Trợ lý AI dinh dưỡng
                  </Link>
                </li>
                <li>
                  <Link href="/meal-plans" className="transition-colors hover:text-emerald-300">
                    Kế hoạch thực đơn
                  </Link>
                </li>
                <li>
                  <Link href="/pantry" className="transition-colors hover:text-emerald-300">
                    Quản lý tủ bếp
                  </Link>
                </li>
                <li>
                  <Link href="/receipts/scan" className="transition-colors hover:text-emerald-300">
                    Quét hóa đơn mua sắm
                  </Link>
                </li>
                <li>
                  <Link href="/custom-meals" className="transition-colors hover:text-emerald-300">
                    Món ăn tùy biến
                  </Link>
                </li>
                <li>
                  <Link href="/billing" className="transition-colors hover:text-emerald-300">
                    Gói hội viên
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 4: Thông tin & Hỗ trợ */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold tracking-wider text-white">
                Thông tin & Hỗ trợ
              </h3>
              <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-emerald-100/70">
                <li>
                  <Link href="/about" className="transition-colors hover:text-emerald-300">
                    Về VeggieConnect
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="transition-colors hover:text-emerald-300">
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="transition-colors hover:text-emerald-300">
                    Quy chế cộng đồng
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-emerald-300">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-emerald-300">
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition-colors hover:text-emerald-300">
                    Liên hệ hỗ trợ
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="transition-colors hover:text-emerald-300">
                    Góp ý & Báo lỗi
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* THANH BẢN QUYỀN BOTTOM BAR                                  */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="border-t border-emerald-900/60 py-5 text-xs text-emerald-200/60">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p>© 2026 VeggieConnect. Tất cả quyền được bảo lưu.</p>

            <div className="flex items-center gap-1.5 text-emerald-300/80">
              <Sprout className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ăn chay hôm nay • Khỏe mạnh ngày mai</span>
            </div>

            <div className="flex items-center gap-2">
              <p className="flex items-center gap-1">
                Made with <span className="text-emerald-400">💚</span> for a greener world
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
