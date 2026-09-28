'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, ArrowRight, Sprout, ShieldCheck, Heart, Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Social Media SVGs
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.057.235-.188.285-.433.171-1.624-.755-2.639-3.127-2.639-5.033 0-4.099 2.979-7.865 8.591-7.865 4.51 0 8.016 3.214 8.016 7.512 0 4.481-2.825 8.087-6.746 8.087-1.317 0-2.555-.685-2.98-1.493l-.813 3.102c-.294 1.127-1.09 2.54-1.623 3.401C9.646 23.834 10.798 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}

function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.74-.96 2.76 1.01.08 2.08-.51 2.69-1.26z" />
    </svg>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.609 2.302A1.802 1.802 0 0 0 3 3.633v16.734c0 .506.216.985.609 1.331l9.467-9.7-9.467-9.696zm10.742 8.441L6.155 1.439a1.69 1.69 0 0 0-.746-.226l8.942 9.53zm0 2.514l-8.942 9.53c.231.012.473-.064.746-.226l8.196-9.304zm1.185-1.257l4.896 2.827c1.07.618 1.07 1.63 0 2.248l-4.896 2.827-1.32-1.354 1.32-6.548z" />
    </svg>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const [email, setEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  // Không hiển thị Footer trên trang canvas trò chuyện Trợ lý AI (/assistant)
  // Các trang con khác như /assistant/public vẫn hiển thị footer bình thường
  if (pathname === '/assistant') {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setIsSubmitted(true);
    toast.success(
      'Đăng ký nhận tin thành công! VeggieConnect sẽ gửi thực đơn mới nhất vào email của bạn.'
    );
    setEmail('');
  };

  return (
    <footer className="relative mt-16 w-full overflow-hidden bg-[#04120b] text-white antialiased">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* NỀN TỔNG THỂ LIỀN MẠCH (Sử dụng footer-2.png bao phủ cả footer) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <Image
          src="/footer/footer-2.png"
          alt="VeggieConnect Footer Artwork"
          fill
          className="object-cover object-bottom opacity-85"
          priority={false}
        />
        {/* Lớp gradient dịu nhẹ giữ độ tương phản chuẩn cho mọi độ phân giải */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04120b]/40 via-transparent to-[#020b06]/85" />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* NỘI DUNG TẬP TRUNG GỘP CHUNG BÊN TRONG CÙNG 1 KHUNG FOOTER    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 1. KHỐI ĐĂNG KÝ NHẬN TIN (NẰM TRỰC TIẾP TRÊN NỀN FOOTER) */}
        <div className="pt-10 sm:pt-14 pb-4">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-[#061e13]/85 p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md">
            {/* Hiệu ứng hào quang góc thẻ */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Bên trái: Mầm lá phát sáng + Tiêu đề + Nội dung */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:gap-7 lg:max-w-2xl">
                <div className="relative shrink-0">
                  <Image
                    src="/footer/sprout-glow-feathered.png"
                    alt="VeggieConnect Mầm xanh phát sáng"
                    width={130}
                    height={110}
                    className="h-20 w-auto sm:h-24 object-contain drop-shadow-[0_0_18px_rgba(74,222,128,0.55)]"
                    priority={false}
                  />
                </div>

                <div className="flex flex-col">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/70 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-emerald-300 uppercase shadow-inner">
                    Đăng ký nhận tin
                  </span>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl leading-snug">
                    Hành trình{' '}
                    <span className="font-serif italic font-normal text-[#9eedb5]">sống xanh</span>
                    <br />
                    bắt đầu từ những điều nhỏ bé
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-emerald-100/75 leading-relaxed">
                    Nhận công thức ăn chay mới, mẹo dinh dưỡng, bài viết hữu ích và cập nhật từ cộng
                    đồng VeggieConnect mỗi tuần.
                  </p>
                </div>
              </div>

              {/* Bên phải: Form đăng ký email + 3 Cam kết niềm tin */}
              <div className="w-full lg:max-w-md">
                <form onSubmit={handleSubscribe} className="relative">
                  <div className="flex w-full items-center rounded-full border border-emerald-500/50 bg-[#04130c]/90 p-1.5 shadow-xl backdrop-blur-md transition-all focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-400/30">
                    <Mail className="ml-3.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email của bạn..."
                      className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-emerald-200/50 focus:outline-none"
                      aria-label="Địa chỉ email đăng ký"
                    />
                    <button
                      type="submit"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#dff2b2] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#0d2a1c] shadow-md transition-all duration-200 hover:bg-white hover:shadow-lg active:scale-95"
                    >
                      <span>{isSubmitted ? 'Đã gửi' : 'Đăng ký ngay'}</span>
                      {isSubmitted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </form>

                {/* 3 micro-trust points */}
                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4 pt-1">
                  <div className="flex items-start gap-2">
                    <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Không spam</p>
                      <p className="text-[10px] text-emerald-200/60 leading-tight">
                        Cam kết chỉ gửi nội dung giá trị
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Bảo mật thông tin</p>
                      <p className="text-[10px] text-emerald-200/60 leading-tight">
                        Tôn trọng quyền riêng tư
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Heart className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Hủy đăng ký dễ dàng</p>
                      <p className="text-[10px] text-emerald-200/60 leading-tight">
                        Bất cứ lúc nào
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN FOOTER 5 CỘT (LIỀN MẠCH NGAY PHÍA DƯỚI) */}
        <div className="pt-10 pb-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 lg:gap-8">
            {/* Cột 1: Brand & Identity */}
            <div className="lg:col-span-4">
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
                  <span className="text-[9px] font-semibold tracking-[0.22em] text-emerald-300/80 uppercase">
                    Ăn chay • Sống khỏe • Kết nối cộng đồng
                  </span>
                </div>
              </Link>

              <p className="mt-4 max-w-sm text-xs leading-relaxed text-emerald-100/70">
                VeggieConnect là nền tảng dinh dưỡng thực vật, nuôi dưỡng sức khỏe và kết nối những
                tâm hồn cùng chung giá trị sống xanh.
              </p>

              {/* 6 Social Media Buttons */}
              <div className="mt-5 flex items-center gap-2.5">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook VeggieConnect"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 transition-all hover:border-emerald-400 hover:bg-emerald-800/50 hover:text-white hover:scale-105 active:scale-95"
                >
                  <FacebookIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram VeggieConnect"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 transition-all hover:border-emerald-400 hover:bg-emerald-800/50 hover:text-white hover:scale-105 active:scale-95"
                >
                  <InstagramIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube VeggieConnect"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 transition-all hover:border-emerald-400 hover:bg-emerald-800/50 hover:text-white hover:scale-105 active:scale-95"
                >
                  <YouTubeIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok VeggieConnect"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 transition-all hover:border-emerald-400 hover:bg-emerald-800/50 hover:text-white hover:scale-105 active:scale-95"
                >
                  <TikTokIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Pinterest VeggieConnect"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 transition-all hover:border-emerald-400 hover:bg-emerald-800/50 hover:text-white hover:scale-105 active:scale-95"
                >
                  <PinterestIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X VeggieConnect"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 transition-all hover:border-emerald-400 hover:bg-emerald-800/50 hover:text-white hover:scale-105 active:scale-95"
                >
                  <XTwitterIcon className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Chữ ký nghệ thuật */}
              <div className="mt-5 flex items-center gap-1.5 font-serif italic text-emerald-300/90 text-sm select-none">
                <span>Vì một tương lai xanh hơn</span>
                <span className="not-italic text-sm">🍃</span>
              </div>
            </div>

            {/* Cột 2: Khám phá */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider text-white">Khám phá</h3>
              <ul className="mt-4 space-y-2 text-xs text-emerald-100/70">
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
                  <Link href="/articles" className="transition-colors hover:text-emerald-300">
                    Blog & Bài viết
                  </Link>
                </li>
                <li>
                  <Link href="/videos" className="transition-colors hover:text-emerald-300">
                    Video
                  </Link>
                </li>
                <li>
                  <Link href="/restaurants" className="transition-colors hover:text-emerald-300">
                    Nhà hàng chay
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="transition-colors hover:text-emerald-300">
                    Cộng đồng
                  </Link>
                </li>
                <li>
                  <Link href="/meal-plans" className="transition-colors hover:text-emerald-300">
                    Lên kế hoạch dinh dưỡng
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="transition-colors hover:text-emerald-300">
                    Về VeggieConnect
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 3: Hỗ trợ */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider text-white">Hỗ trợ</h3>
              <ul className="mt-4 space-y-2 text-xs text-emerald-100/70">
                <li>
                  <Link href="/help" className="transition-colors hover:text-emerald-300">
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="transition-colors hover:text-emerald-300">
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="transition-colors hover:text-emerald-300">
                    Điều khoản sử dụng
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="transition-colors hover:text-emerald-300">
                    Quy chế cộng đồng
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition-colors hover:text-emerald-300">
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="transition-colors hover:text-emerald-300">
                    Góp ý & Báo lỗi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Cột 4: Tải ứng dụng */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider text-white">Tải ứng dụng</h3>
              <p className="mt-2 text-xs text-emerald-100/70 leading-relaxed">
                Trải nghiệm VeggieConnect mọi lúc, mọi nơi
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <a
                  href="#download-app-store"
                  className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#020b06]/80 px-3.5 py-2 text-white shadow-sm transition-all hover:border-emerald-400 hover:bg-black/90 hover:scale-[1.02] active:scale-95"
                >
                  <AppleIcon className="h-6 w-6 shrink-0 text-white" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-gray-300 leading-none">
                      Download on the
                    </span>
                    <span className="text-xs font-semibold tracking-tight text-white leading-tight">
                      App Store
                    </span>
                  </div>
                </a>

                <a
                  href="#download-google-play"
                  className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#020b06]/80 px-3.5 py-2 text-white shadow-sm transition-all hover:border-emerald-400 hover:bg-black/90 hover:scale-[1.02] active:scale-95"
                >
                  <GooglePlayIcon className="h-6 w-6 shrink-0 text-white" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-gray-300 leading-none">
                      GET IT ON
                    </span>
                    <span className="text-xs font-semibold tracking-tight text-white leading-tight">
                      Google Play
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Cột 5: Cam kết của chúng tôi */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold tracking-wider text-white">
                Cam kết của chúng tôi
              </h3>
              <div className="mt-4 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 shadow-sm">
                    <Sprout className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">100% thực vật</span>
                    <span className="text-[10px] text-emerald-200/60 leading-tight">
                      Thân thiện với môi trường
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 shadow-sm">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Dinh dưỡng khoa học</span>
                    <span className="text-[10px] text-emerald-200/60 leading-tight">
                      Được chuyên gia tư vấn
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 shadow-sm">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Cộng đồng tích cực</span>
                    <span className="text-[10px] text-emerald-200/60 leading-tight">
                      Lan tỏa lối sống lành mạnh
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 shadow-sm">
                    <Star className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Chất lượng hàng đầu</span>
                    <span className="text-[10px] text-emerald-200/60 leading-tight">
                      Luôn đặt người dùng lên trước
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. THANH BẢN QUYỀN BOTTOM BAR */}
        <div className="border-t border-emerald-900/60 py-4 text-[11px] text-emerald-200/60">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p>© 2026 VeggieConnect. Tất cả quyền được bảo lưu.</p>

            <div className="flex items-center gap-1.5 text-emerald-300/80">
              <Sprout className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ăn chay hôm nay • Khỏe mạnh ngày mai</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-emerald-700">|</span>
              <p className="flex items-center gap-1">
                Made with <span className="text-emerald-400">♡</span> for a greener world
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
