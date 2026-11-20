'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ShieldCheck, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';

type Tab = 'login' | 'register';

/**
 * Chặn open redirect: chỉ chấp nhận path nội bộ bắt đầu bằng `/` (không `//`, không scheme).
 */
function getSafeRedirectTarget(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/';
  return from;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get('from');
  const redirectTarget = getSafeRedirectTarget(rawFrom);

  const [tab, setTab] = React.useState<Tab>('login');
  const shouldReduceMotion = useReducedMotion();

  const handleLoginSuccess = React.useCallback(() => {
    const role = useAuthStore.getState().user?.role;
    // Nếu có ?from= tường minh (khác '/'), tôn trọng nó; nếu không, admin vào /admin
    if (rawFrom && redirectTarget !== '/') {
      router.push(redirectTarget);
    } else if (role === UserRole.ADMIN) {
      router.push('/admin?tab=categories');
    } else {
      router.push(redirectTarget);
    }
  }, [rawFrom, redirectTarget, router]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'login', label: 'Đăng nhập' },
    { id: 'register', label: 'Tạo tài khoản' },
  ];

  return (
    <div className="w-full max-w-[460px]">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_20px_50px_rgba(29,43,34,0.06)] backdrop-blur-md sm:p-9 dark:border-border/40 dark:bg-[#12211A]/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
      >
        {/* Modern Segmented Control Tabs */}
        <div className="relative grid grid-cols-2 gap-1 rounded-full bg-[#F3F2EC] p-1 dark:bg-muted/50">
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative z-10 rounded-full py-2 text-xs sm:text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'font-semibold text-[#075B45] dark:text-emerald-300'
                    : 'text-[#718078] hover:text-[#1D2B22] dark:text-neutral-400 dark:hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-auth-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-white shadow-xs dark:bg-[#1C3326]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                {t.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' && (
            <motion.div
              key="login"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7"
            >
              <h1 className="text-2xl font-bold tracking-tight text-[#1D2B22] sm:text-[28px] dark:text-[#E8F1E8]">
                Mừng bạn trở lại!
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#718078] dark:text-neutral-400">
                Tiếp tục hành trình ẩm thực chay thanh nhẹ và đầy đủ vi chất mỗi ngày.
              </p>

              <div className="mt-6">
                <LoginForm onSuccess={handleLoginSuccess} />
              </div>

              <p className="mt-6 text-center text-xs text-[#718078] dark:text-neutral-400">
                Bạn mới biết đến VeggieConnect?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="font-semibold text-primary hover:underline"
                >
                  Đăng ký tài khoản miễn phí
                </button>
              </p>
            </motion.div>
          )}

          {tab === 'register' && (
            <motion.div
              key="register"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7"
            >
              <h1 className="text-2xl font-bold tracking-tight text-[#1D2B22] sm:text-[28px] dark:text-[#E8F1E8]">
                Khởi tạo phong cách sống xanh
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[#718078] dark:text-neutral-400">
                Tạo hồ sơ nhận ngay thực đơn thuần chay 7 ngày được cá nhân hoá theo thể trạng.
              </p>

              <div className="mt-6">
                <RegisterForm onSuccess={() => router.push(redirectTarget)} />
              </div>

              <p className="mt-6 text-center text-xs text-[#718078] dark:text-neutral-400">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="font-semibold text-primary hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Security & Lifestyle Reassurance */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-[#718078] dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#287D32] dark:text-emerald-400" />
          Bảo mật dữ liệu cá nhân
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Leaf className="h-4 w-4 text-[#287D32] dark:text-emerald-400" />
          Cộng đồng thuần chay chuẩn mực
        </span>
      </div>
    </div>
  );
}
