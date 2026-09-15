'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  MailCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function OtpVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || 'chayxanh.user@gmail.com';

  const [otp, setOtp] = React.useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState<number>(60);
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Đếm ngược 60 giây để gửi lại OTP
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Chỉ chấp nhận chữ số
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    if (cleanVal.length > 1) {
      // Xử lý khi dán (paste) nhiều số
      const pastedDigits = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    toast.success('Mã OTP mới đã được gửi tới email của bạn!');
  };

  const handleVerify = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      toast.success('Xác thực tài khoản thành công!');
      setTimeout(() => {
        router.push('/onboarding');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md">
      <Card className="border-border/60 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isSuccess ? (
              <CheckCircle2 className="h-7 w-7 text-primary animate-bounce" />
            ) : (
              <MailCheck className="h-7 w-7" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Xác thực tài khoản
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Mã OTP gồm 6 chữ số đã được gửi đến email
            <br />
            <span className="font-semibold text-foreground">{emailParam}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OTP input boxes */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                disabled={isVerifying || isSuccess}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-input bg-background text-center text-xl font-bold text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            ))}
          </div>

          {/* Countdown & Resend */}
          <div className="text-center text-sm">
            {countdown > 0 ? (
              <p className="text-muted-foreground">
                Gửi lại mã sau: <span className="font-semibold text-primary">{countdown} giây</span>
              </p>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                className="gap-1.5 text-primary hover:text-primary/90 font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Gửi lại mã OTP
              </Button>
            )}
          </div>

          {/* Security alert */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ
                mã này cho bất kỳ ai để bảo vệ tài khoản VeggieConnect của bạn.
              </p>
            </div>
          </div>

          {/* Action button */}
          <Button
            className="w-full h-11 text-base font-semibold shadow-md gap-2"
            disabled={isVerifying || isSuccess || otp.join('').length < 6}
            onClick={handleVerify}
          >
            {isVerifying ? (
              'Đang xác thực...'
            ) : isSuccess ? (
              <>
                Thành công <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Xác thực & Tiếp tục <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* Back link */}
          <div className="text-center pt-1">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
