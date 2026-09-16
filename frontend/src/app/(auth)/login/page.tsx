'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowLeft, Mail, Send, ShieldCheck, Leaf, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/features/auth/components/login-form';
import { RegisterForm } from '@/features/auth/components/register-form';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';

type Tab = 'login' | 'register' | 'forgot';

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
  const [forgotSent, setForgotSent] = React.useState(false);
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
    { id: 'forgot', label: 'Khôi phục' },
  ];

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        <div className="relative grid grid-cols-3 gap-1 rounded-full bg-muted/80 p-1">
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative z-10 rounded-full px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-auth-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
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
              className="mt-6"
            >
              <h1 className="text-2xl font-bold tracking-tight">Mừng bạn trở lại!</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tiếp tục hành trình ẩm thực chay thanh nhẹ và đầy đủ vi chất mỗi ngày.
              </p>

              <div className="mt-6">
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onForgotPassword={() => setTab('forgot')}
                />
              </div>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> Hoặc tiếp tục với{' '}
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="flex justify-center sm:grid-cols-2">
                <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl transition-colors hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => toast.info('Đăng nhập Google sẽ sớm khả dụng')}
                  >
                    Google ID
                  </Button>
                </motion.div>
                {/* <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl transition-colors hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => toast.info('Đăng nhập Apple sẽ sớm khả dụng')}
                  >
                    Apple ID
                  </Button>
                </motion.div> */}
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Bạn mới biết đến ChayXanh?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="font-medium text-primary hover:underline"
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
              className="mt-6"
            >
              <h1 className="text-2xl font-bold tracking-tight">Khởi tạo phong cách sống xanh</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tạo hồ sơ nhận ngay thực đơn thuần chay 7 ngày được cá nhân hoá theo thể trạng.
              </p>

              <div className="mt-6">
                <RegisterForm onSuccess={() => router.push(redirectTarget)} />
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="font-medium text-primary hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </motion.div>
          )}

          {tab === 'forgot' && (
            <motion.div
              key="forgot"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6"
            >
              <h1 className="text-2xl font-bold tracking-tight">Khôi phục mật khẩu</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhập email liên kết với tài khoản ChayXanh. Chúng tôi sẽ gửi hướng dẫn khôi phục bảo
                mật trong tích tắc.
              </p>

              {forgotSent && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm"
                >
                  <p className="flex items-center gap-1.5 font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Email đã được gửi!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vui lòng kiểm tra hộp thư đến (và thư mục Spam). Liên kết có hiệu lực trong 15
                    phút.
                  </p>
                </motion.div>
              )}

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSent(true);
                  toast.success('Đã gửi liên kết khôi phục');
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Email đã đăng ký tài khoản</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="vidu@chayxanh.vn"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
                  <Button type="submit" className="w-full gap-2 rounded-xl">
                    <Send className="h-4 w-4" /> Gửi liên kết khôi phục
                  </Button>
                </motion.div>
              </form>

              <button
                type="button"
                onClick={() => setTab('login')}
                className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Quay lại trang Đăng nhập
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Bảo mật dữ liệu cá nhân
        </span>
        <span className="inline-flex items-center gap-1">
          <Leaf className="h-3.5 w-3.5 text-primary" /> Cộng đồng ẩm thực lành tính
        </span>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link href="/" className="text-primary hover:underline">
          Về trang chủ
        </Link>
      </p>
    </div>
  );
}
