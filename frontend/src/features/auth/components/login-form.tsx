'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginMutation } from '../queries/auth.queries';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schema';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';

/**
 * Form đăng nhập email/mật khẩu. Lỗi nghiệp vụ đọc theo `error.code`:
 * - `INVALID_CREDENTIALS` → toast "Email hoặc mật khẩu không đúng. Vui lòng thử lại."
 * - `ACCOUNT_LOCKED` / `ACCOUNT_BANNED` → toast thông báo lỗi đăng nhập thất bại chung
 *   (không CAPTCHA, không đếm ngược — Clarifications spec 2026-09-15).
 */
export function LoginForm({
  onSuccess,
  onForgotPassword,
}: {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}) {
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      setIsRedirecting(true);
      onSuccess?.();
    } catch (error) {
      setIsRedirecting(false);
      const code = getApiErrorCode(error);
      if (code === 'INVALID_CREDENTIALS') {
        toast.error('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
        return;
      }
      if (code === 'ACCOUNT_LOCKED' || code === 'ACCOUNT_BANNED') {
        toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin và thử lại.');
        return;
      }
      if (code === 'VALIDATION_ERROR') {
        const fields = getApiErrorFields(error);
        let mapped = false;
        if (fields) {
          for (const [key, messages] of Object.entries(fields)) {
            const field = key as keyof LoginFormValues;
            if (field in form.getValues()) {
              const first = Array.isArray(messages) ? messages[0] : messages;
              form.setError(field, {
                message: typeof first === 'string' ? first : 'Giá trị không hợp lệ.',
              });
              mapped = true;
            }
          }
        }
        if (mapped) return;
      }
      toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  const isLoading = loginMutation.isPending || isRedirecting;

  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label
          htmlFor="login-email"
          className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
        >
          Email hoặc Tên đăng nhập
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="user@veggieconnect.vn"
            className="h-12 rounded-xl pl-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all disabled:opacity-60"
            disabled={isLoading}
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="login-password"
            className="text-xs font-semibold uppercase tracking-wider text-[#718078] dark:text-neutral-300"
          >
            Mật khẩu
          </Label>
          {onForgotPassword && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onForgotPassword()}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:pointer-events-none"
            >
              Quên mật khẩu?
            </button>
          )}
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 rounded-xl px-10 text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all disabled:opacity-60"
            disabled={isLoading}
            {...form.register('password')}
          />
          <button
            type="button"
            aria-label="Hiện/ẩn mật khẩu"
            disabled={isLoading}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-12 w-full gap-2 rounded-xl font-semibold bg-primary hover:bg-primary/95 active:scale-[0.99] transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span>{isRedirecting ? 'Đang chuyển hướng...' : 'Đang xác thực...'}</span>
          </>
        ) : (
          <>
            <span>Đăng nhập</span>
            <LogIn className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
