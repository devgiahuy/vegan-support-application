'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  FolderTree,
  Flag,
  ScrollText,
  Bell,
  ShieldCheck,
  HardDrive,
  Database,
  Newspaper,
  Menu,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandLogo } from '@/components/layout/brand-logo';
import { useAuthStore } from '@/store/useAuthStore';

const NAV_MAIN = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Duyệt bài', href: '/admin/dashboard?tab=queue', icon: ClipboardCheck, badge: '12' },
  { label: 'Nội dung', href: '/admin/dashboard?tab=content', icon: Newspaper },
  { label: 'Người dùng', href: '/admin/dashboard?tab=users', icon: Users },
  { label: 'Chuyên mục', href: '/admin/dashboard?tab=categories', icon: FolderTree },
  { label: 'Dữ liệu dinh dưỡng', href: '/admin/dashboard?tab=food-data', icon: Database },
];

const NAV_MONITOR = [
  { label: 'Báo cáo vi phạm', href: '/admin/dashboard?tab=reports', icon: Flag, badge: '5' },
  { label: 'Kiểm chứng AI', href: '/admin/dashboard?tab=ai-verifications', icon: ShieldCheck },
  { label: 'Nhật ký hệ thống', href: '/admin/dashboard?tab=logs', icon: ScrollText },
  { label: 'Lưu trữ & Quota', href: '/admin/storage', icon: HardDrive },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </React.Suspense>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const user = useAuthStore((s) => s.user);

  const currentTab = searchParams.get('tab');

  const userName = user?.displayName || user?.email || 'Võ Minh Tuấn';
  const userRole = user?.role === 'ADMIN' ? 'SUPER ADMIN' : (user?.role ?? 'ADMIN');
  const userInitials = user?.initials || 'VT';

  const isItemActive = (href: string) => {
    if (href.startsWith('/admin/storage')) {
      return pathname.startsWith('/admin/storage');
    }
    if (href.includes('tab=')) {
      const tabName = href.split('tab=')[1];
      return currentTab === tabName;
    }
    return pathname === '/admin/dashboard' && !currentTab;
  };

  const getTabTitle = () => {
    if (pathname.startsWith('/admin/storage')) return 'Lưu trữ & Quota';
    switch (currentTab) {
      case 'content':
        return 'Quản lý nội dung';
      case 'queue':
        return 'Kiểm duyệt bài viết';
      case 'users':
        return 'Quản lý người dùng';
      case 'categories':
        return 'Cây danh mục';
      case 'ingredients':
        return 'Nguyên liệu';
      case 'food-data':
        return 'Dữ liệu dinh dưỡng';
      case 'reports':
        return 'Báo cáo vi phạm';
      case 'ai-verifications':
        return 'Kiểm chứng AI';
      case 'logs':
        return 'Nhật ký hệ thống';
      case 'mod-users':
        return 'Kiểm soát tài khoản';
      case 'mod-comments':
        return 'Kiểm duyệt bình luận';
      case 'ai-governance':
        return 'Giám sát AI';
      case 'restaurants':
        return 'Quán ăn chờ duyệt';
      default:
        return 'Tổng quan & Điều hành';
    }
  };

  const renderNav = (items: typeof NAV_MAIN, title: string, onSelect?: () => void) => (
    <div className="space-y-1">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        {title}
      </p>
      <nav className="space-y-1 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          return (
            <motion.div key={item.label} whileTap={{ scale: 0.98 }}>
              <Link
                href={item.href}
                onClick={onSelect}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
                    : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105',
                    active
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <Badge
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      active
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-destructive/15 text-destructive hover:bg-destructive/20'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );

  const renderFooterCards = () => (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/40 p-3 text-xs">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" /> Cơ sở dữ liệu
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 rounded-full bg-primary" />
        </div>
        <p className="mt-1.5 text-muted-foreground">Sức chứa 32.4% / 250GB</p>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-2xs">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
          <Badge className="rounded-full bg-primary/90 text-[10px] text-primary-foreground font-medium">
            {userRole}
          </Badge>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar desktop - sticky and self-scrolling */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between border-r bg-card p-4 lg:flex overflow-y-auto z-30">
        <div className="space-y-5">
          <Link href="/admin/dashboard" className="flex items-center px-2 py-1 focus:outline-none">
            <BrandLogo variant="mark" size="md" withSubtitle="Admin Portal" asLink={false} />
          </Link>

          <div className="space-y-5">
            {renderNav(NAV_MAIN, 'Điều hành chính')}
            {renderNav(NAV_MONITOR, 'Kiểm soát & Giám sát')}
          </div>
        </div>

        <div className="shrink-0 border-t pt-4 mt-4">{renderFooterCards()}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur lg:px-6">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu quản trị"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">
              Admin Portal <span className="mx-1 text-muted-foreground/50">›</span>{' '}
              <span className="font-semibold text-foreground">{getTabTitle()}</span>
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="hidden gap-1.5 rounded-full md:inline-flex text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> RBAC V2.4
            </Badge>
            <button
              aria-label="Thông báo"
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Bell className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Thoát về App
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="flex h-full w-72 flex-col justify-between p-4 sm:w-80"
          >
            <SheetHeader className="p-0 text-left">
              <SheetTitle className="sr-only">Menu Điều Hành Quản Trị</SheetTitle>
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-1 py-1"
              >
                <BrandLogo variant="mark" size="md" withSubtitle="Admin Portal" asLink={false} />
              </Link>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto py-4">
              {renderNav(NAV_MAIN, 'Điều hành chính', () => setMobileOpen(false))}
              {renderNav(NAV_MONITOR, 'Kiểm soát & Giám sát', () => setMobileOpen(false))}
            </div>

            <div className="shrink-0 border-t pt-4">{renderFooterCards()}</div>
          </SheetContent>
        </Sheet>

        <main className="flex-1 bg-muted/30 p-4 lg:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
