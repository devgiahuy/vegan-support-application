'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Leaf,
  LayoutDashboard,
  ClipboardCheck,
  Users,
  FolderTree,
  Flag,
  ScrollText,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { BrandLogo } from '@/components/layout/brand-logo';

const NAV_MAIN = [
  { label: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { label: 'Duyệt bài', href: '/admin?tab=queue', icon: ClipboardCheck, badge: '12' },
  { label: 'Người dùng', href: '/admin?tab=users', icon: Users },
  { label: 'Chuyên mục', href: '/admin?tab=categories', icon: FolderTree },
];

const NAV_MONITOR = [
  { label: 'Báo cáo vi phạm', href: '/admin?tab=reports', icon: Flag, badge: '5' },
  { label: 'Nhật ký hệ thống', href: '/admin?tab=logs', icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const renderNav = (items: typeof NAV_MAIN, title: string) => (
    <div>
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <nav className="mt-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === '/admin' && item.href === '/admin';
          return (
            <motion.div key={item.label} whileTap={{ scale: 0.98 }}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <Badge className="ml-auto rounded-full bg-destructive text-destructive-foreground">
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-card p-4 lg:flex">
        <Link href="/admin" className="flex items-center px-2">
          <BrandLogo variant="mark" size="md" withSubtitle="Admin Portal" asLink={false} />
        </Link>

        <div className="mt-4 space-y-4">
          {renderNav(NAV_MAIN, 'Điều hành chính')}
          {renderNav(NAV_MONITOR, 'Kiểm soát & Giám sát')}
        </div>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Cơ sở dữ liệu
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 rounded-full bg-primary" />
            </div>
            <p className="mt-1 text-muted-foreground">Sức chứa 32.4% / 250GB</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary">VT</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Võ Minh Tuấn</p>
              <Badge className="rounded-full bg-primary text-[10px] text-primary-foreground">
                SUPER ADMIN
              </Badge>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
          <button
            className="rounded-lg border px-2.5 py-1.5 text-sm lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            Menu
          </button>
          <p className="text-sm text-muted-foreground">
            Admin Portal <span className="mx-1">›</span>{' '}
            <span className="font-semibold text-foreground">Duyệt bài &amp; Tổng quan</span>
          </p>
          <div className="ml-auto flex items-center gap-1">
            <Badge variant="outline" className="hidden gap-1.5 rounded-full md:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> RBAC V2.4
            </Badge>
            <button aria-label="Thông báo" className="rounded-full p-2 hover:bg-accent">
              <Bell className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              Thoát về App
            </Link>
          </div>
        </header>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="space-y-4 border-b bg-card p-4 lg:hidden">
            {renderNav(NAV_MAIN, 'Điều hành chính')}
            {renderNav(NAV_MONITOR, 'Kiểm soát & Giám sát')}
          </div>
        )}

        <main className="flex-1 bg-muted/30 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
