import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandLogo } from '@/components/layout/brand-logo';
import { AuthShowcaseLazy } from '@/features/auth/components/remotion/auth-showcase-lazy';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col justify-between overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background ambient organic gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(5,150,105,0.18),rgba(0,0,0,0))]" />

      <header className="z-10 mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
        <BrandLogo variant="horizontal" size="md" withSubtitle="Viet Vegan Companion" priority />
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.98]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Về trang chủ
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Remotion Showcase Column - Desktop only */}
          <div className="hidden h-[620px] flex-col justify-center lg:col-span-5 lg:flex xl:col-span-5 xl:h-[680px]">
            <AuthShowcaseLazy />
          </div>

          {/* Form Interactive Column */}
          <div className="col-span-1 flex w-full items-center justify-center py-4 lg:col-span-7 xl:col-span-7">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4">
          <span>
            © {new Date().getFullYear()} VeggieConnect. Dinh dưỡng thuần chay khoa học & lành tính.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/" className="transition-colors hover:text-primary">
              Trang chủ
            </Link>
            <span className="text-border">•</span>
            <span className="text-muted-foreground">Đồng hành cùng lối sống xanh</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
