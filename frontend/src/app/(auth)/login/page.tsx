'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Send,
  ShieldCheck,
  Leaf,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLoginMutation } from '@/features/auth/queries/auth.queries';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/auth.schema';

type Tab = 'login' | 'register' | 'forgot';

function PasswordStrength({ value }: { value: string }) {
  const rules = [
    { label: 'Từ 8 ký tự', ok: value.length >= 8 },
    { label: '1 chữ HOA', ok: /[A-Z]/.test(value) },
    { label: '1 số (0-9)', ok: /[0-9]/.test(value) },
  ];
  const score = rules.filter((r) => r.ok).length;
  const label = !value
    ? 'Chưa nhập'
    : ['Rất yếu', 'Rất yếu', 'Trung bình', 'Khá mạnh', 'An toàn'][score];
  const barColor = ['bg-muted', 'bg-destructive', 'bg-cta', 'bg-sprout', 'bg-primary'][score];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Độ an toàn mật khẩu:</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full', i < score ? barColor : 'bg-muted')}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {rules.map((r) => (
          <span
            key={r.label}
            className={cn('inline-flex items-center gap-1', r.ok && 'text-primary')}
          >
            {r.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';
  const loginMutation = useLoginMutation();

  const [tab, setTab] = React.useState<Tab>('login');
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [regPassword, setRegPassword] = React.useState('');
  const [forgotSent, setForgotSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLogin = async (values: LoginFormValues) => {
    await loginMutation.mutateAsync(values);
    router.push(from);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'login', label: 'Đăng nhập' },
    { id: 'register', label: 'Tạo tài khoản' },
    { id: 'forgot', label: 'Khôi phục' },
  ];

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'login' && (
          <div className="mt-6">
            <h1 className="text-2xl font-bold">Mừng bạn trở lại!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tiếp tục hành trình ẩm thực chay thanh nhẹ và đầy đủ vi chất mỗi ngày.
            </p>

            <form
              onSubmit={(e) => void handleSubmit(onLogin)(e)}
              className="mt-6 space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email hoặc Tên đăng nhập</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="vidu@chayxanh.vn"
                    className="pl-9"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="px-9"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label="Hiện/ẩn mật khẩu"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Ghi nhớ đăng nhập trên thiết bị này
              </label>

              <Button
                type="submit"
                className="w-full gap-2 rounded-xl"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Đang xác thực...' : 'Đăng nhập vào ChayXanh'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> Hoặc tiếp tục với{' '}
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => toast.info('Đăng nhập Google sẽ sớm khả dụng')}
              >
                Google ID
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => toast.info('Đăng nhập Apple sẽ sớm khả dụng')}
              >
                Apple ID
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Bạn mới biết đến ChayXanh?{' '}
              <button
                onClick={() => setTab('register')}
                className="font-medium text-primary hover:underline"
              >
                Đăng ký tài khoản miễn phí
              </button>
            </p>
          </div>
        )}

        {tab === 'register' && (
          <div className="mt-6">
            <h1 className="text-2xl font-bold">Khởi tạo phong cách sống xanh</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạo hồ sơ nhận ngay thực đơn thuần chay 7 ngày được cá nhân hoá theo thể trạng.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success('Chào mừng thành viên mới! Tài khoản của bạn đã sẵn sàng.');
                setTab('login');
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Họ và tên</Label>
                <Input id="reg-name" placeholder="Ví dụ: Lê Minh Tâm" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Địa chỉ Email</Label>
                <Input id="reg-email" type="email" placeholder="ban@gmail.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Mật khẩu mới</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự..."
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
                <PasswordStrength value={regPassword} />
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                />
                Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật dữ liệu ẩm thực cá nhân của
                ChayXanh.
              </label>

              <Button
                type="submit"
                className="w-full gap-2 rounded-xl bg-cta text-cta-foreground hover:bg-cta/90"
              >
                <Sparkles className="h-4 w-4" /> Tạo tài khoản ChayXanh
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Đã có tài khoản?{' '}
              <button
                onClick={() => setTab('login')}
                className="font-medium text-primary hover:underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        )}

        {tab === 'forgot' && (
          <div className="mt-6">
            <h1 className="text-2xl font-bold">Khôi phục mật khẩu</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nhập email liên kết với tài khoản ChayXanh. Chúng tôi sẽ gửi hướng dẫn khôi phục bảo
              mật trong tích tắc.
            </p>

            {forgotSent && (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Email đã được gửi!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vui lòng kiểm tra hộp thư đến (và thư mục Spam). Liên kết có hiệu lực trong 15
                  phút.
                </p>
              </div>
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
              <Button type="submit" className="w-full gap-2 rounded-xl">
                <Send className="h-4 w-4" /> Gửi liên kết khôi phục
              </Button>
            </form>

            <button
              onClick={() => setTab('login')}
              className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại trang Đăng nhập
            </button>
          </div>
        )}
      </div>

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

      <Badge variant="secondary" className="mx-auto mt-4 flex w-fit rounded-full">
        Dữ liệu minh hoạ • Demo giao diện
      </Badge>
    </div>
  );
}
