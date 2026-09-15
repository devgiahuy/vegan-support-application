import Link from 'next/link';
import { Leaf, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-primary">ChayXanh</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
    </div>
  );
}
