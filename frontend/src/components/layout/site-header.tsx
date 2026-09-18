'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Sparkles,
  X,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ClipboardCheck,
  CalendarDays,
  BookmarkCheck,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { BrandLogo } from './brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { NotificationBell } from '@/features/notification/components/notification-bell';

const NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Khám phá món', href: '/recipes' },
  { label: 'Cẩm nang', href: '/articles' },
  { label: 'Video nấu ăn', href: '/videos' },
  { label: 'Thực đơn tuần', href: '/meal-plans' },
  { label: 'Bản đồ quán', href: '/restaurants' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hoveredHref, setHoveredHref] = React.useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleLogout = () => {
    void logoutMutation.mutateAsync().finally(() => router.push('/'));
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 lg:px-6 xl:gap-3 2xl:gap-4">
        <BrandLogo variant="horizontal" size="md" priority />

        <nav
          className="relative hidden shrink-0 items-center gap-0.5 lg:flex 2xl:gap-1"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const isHovered = hoveredHref === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredHref(item.href)}
                onFocus={() => setHoveredHref(item.href)}
                onBlur={() => setHoveredHref(null)}
                className={cn(
                  'relative shrink-0 rounded-full px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-2 xl:px-2.5 xl:text-[13px] 2xl:px-3.5 2xl:py-2 2xl:text-sm',
                  active
                    ? 'font-semibold text-primary-foreground'
                    : isHovered
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                )}
              >
                {/* Active pill: chuyển động mượt mà khi đổi giữa các trang */}
                {active && (
                  <motion.span
                    layoutId="header-active-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-sm"
                    style={{ borderRadius: 9999 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 380, damping: 30 }
                    }
                  />
                )}

                {/* Hover pill: lướt mượt mà dưới con trỏ chuột cho các mục chưa active */}
                {!active && isHovered && (
                  <motion.span
                    layoutId="header-hover-pill"
                    className="absolute inset-0 rounded-full bg-accent/80 dark:bg-accent/60"
                    style={{ borderRadius: 9999 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 32 }
                    }
                  />
                )}

                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <form
          action="/search"
          className="relative ml-auto hidden items-center md:flex md:flex-1 md:max-w-xs lg:w-32 lg:flex-none xl:w-40 2xl:w-60 2xl:max-w-xs"
        >
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Tìm món chay..."
            className="h-9 rounded-full bg-muted/70 pl-9 pr-3 text-xs transition-colors focus-visible:bg-background 2xl:text-sm"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full md:hidden"
            aria-label="Tìm kiếm"
          >
            <Link href="/search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="secondary"
            size="sm"
            className="hidden h-9 gap-1.5 rounded-full px-3 text-xs sm:inline-flex 2xl:px-3.5 2xl:text-sm"
          >
            <Link href="/assistant">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="whitespace-nowrap">AI Trợ lý</span>
            </Link>
          </Button>

          <ThemeToggle />

          <NotificationBell />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
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
                <DropdownMenuItem asChild>
                  <Link href="/meal-plans">
                    <CalendarDays className="h-4 w-4" /> Kế hoạch bữa ăn tuần
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/meal-plans/saved">
                    <BookmarkCheck className="h-4 w-4" /> Thực đơn đã lưu
                  </Link>
                </DropdownMenuItem>
                {user.role === UserRole.ADMIN && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">
                        <ShieldCheck className="h-4 w-4" /> Bảng điều khiển Quản trị
                      </Link>
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard?tab=queue">
                        <ClipboardCheck className="h-4 w-4" /> Kiểm duyệt bài viết
                      </Link>
                    </DropdownMenuItem> */}
                  </>
                )}
                {user.role === UserRole.CONTRIBUTOR && (
                  <DropdownMenuItem asChild>
                    <Link href="/contributor/dashboard">
                      <ClipboardCheck className="h-4 w-4" /> Bảng điều khiển Contributor
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              className="ml-1 h-9 rounded-full px-4 text-xs font-medium whitespace-nowrap 2xl:text-sm"
            >
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            aria-label="Mở menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
            }
            className="overflow-hidden border-t border-border/70 bg-background lg:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'relative rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
