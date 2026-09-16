'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  X,
  User as UserIcon,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from './brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';
import { useLogoutMutation } from '@/features/auth/queries/auth.queries';
import { ThemeToggle } from './theme-toggle';

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Khám phá món', href: '/recipes' },
  { label: 'Cẩm nang', href: '/articles' },
  { label: 'Thực đơn tuần', href: '/meal-plans' },
  { label: 'Bản đồ quán', href: '/restaurants' },
  // { label: 'Hỏi AI', href: '/assistant' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    void logoutMutation.mutateAsync().finally(() => router.push('/'));
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
        <BrandLogo variant="horizontal" size="md" priority />

        <nav className="ml-2 hidden items-center gap-1 xl:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form
          action="/search"
          className="relative ml-auto hidden max-w-xs flex-1 items-center md:flex lg:max-w-sm"
        >
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Tìm món chay, cẩm nang, video..."
            className="h-10 rounded-full bg-muted pl-9"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button
            asChild
            variant="secondary"
            className="hidden gap-1.5 rounded-full sm:inline-flex"
          >
            <Link href="/assistant">
              <Sparkles className="h-4 w-4" />
              AI Trợ lý
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Thông báo"
            className="hidden sm:inline-flex"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.initials || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user.displayName}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="h-4 w-4" /> Hồ sơ dinh dưỡng
                  </Link>
                </DropdownMenuItem>
                {user.role === UserRole.ADMIN && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="h-4 w-4" /> Quản trị catalog
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-1 rounded-full">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label="Mở menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/70 bg-background xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-sm font-medium',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
