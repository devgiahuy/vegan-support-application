'use client';

import * as React from 'react';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ClipboardCheck,
  UtensilsCrossed,
  BookOpen,
  Video,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthGuard } from '@/components/shared/auth-guard';
import { UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { ReviewQueueTable } from '@/features/review/components/review-queue-table';

type ContributorTab = 'queue' | 'contributions' | 'guidelines';

export default function ContributorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-muted-foreground">
          Đang tải không gian làm việc Contributor...
        </div>
      }
    >
      <ContributorDashboardContent />
    </Suspense>
  );
}

function ContributorDashboardContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const shouldReduceMotion = useReducedMotion();

  const initialTab = (searchParams.get('tab') as ContributorTab) || 'queue';
  const [tab, setTab] = useState<ContributorTab>(
    initialTab === 'contributions' || initialTab === 'guidelines' ? initialTab : 'queue'
  );

  const tabs = [
    { id: 'queue' as const, label: 'Hàng chờ kiểm duyệt', icon: ClipboardCheck },
    { id: 'contributions' as const, label: 'Lối tắt đóng góp', icon: UtensilsCrossed },
    { id: 'guidelines' as const, label: 'Quy chuẩn kiểm duyệt', icon: FileCheck },
  ];

  return (
    <AuthGuard roles={[UserRole.CONTRIBUTOR, UserRole.ADMIN]}>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/15 p-6 md:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5 rounded-full bg-primary text-primary-foreground font-medium px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user?.role === UserRole.ADMIN
                    ? 'Quản trị viên / Moderator'
                    : 'Người đóng góp được xác thực'}
                </Badge>
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                  Quyền kiểm duyệt nội dung
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Chào mừng, {user?.displayName || 'Người đóng góp'}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Không gian làm việc dành riêng cho Người đóng góp: thẩm định chất lượng bài đăng
                thuần thực vật từ cộng đồng, duy trì tiêu chuẩn an toàn dinh dưỡng và sáng tạo nội
                dung mới.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button asChild className="gap-2 rounded-full shadow-sm">
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4" /> Đăng công thức
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 rounded-full">
                <Link href="/articles/new">
                  <BookOpen className="h-4 w-4" /> Viết tin tức
                </Link>
              </Button>
            </div>
          </div>

          {/* Background subtle decoration */}
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border border-border/80 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Hàng chờ duyệt
                </p>
                <p className="text-xl font-bold text-foreground">Hệ thống đồng bộ</p>
                <p className="text-xs text-muted-foreground mt-0.5">Xử lý theo SLA &lt; 24 giờ</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/80 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cta/15 text-cta">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tiêu chuẩn kiểm duyệt
                </p>
                <p className="text-xl font-bold text-foreground">100% Thuần chay</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Không sữa động vật, trứng, mật ong
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/80 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/30 text-secondary-foreground">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trách nhiệm
                </p>
                <p className="text-xl font-bold text-foreground">Minh bạch &amp; Tích cực</p>
                <p className="text-xs text-muted-foreground mt-0.5">Lý do phản hồi &ge; 10 ký tự</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="relative no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-border/80 bg-muted/70 p-1.5 shadow-sm backdrop-blur-sm">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative z-10 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-contributor-tab"
                    className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm border border-border/40"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isActive && 'scale-110 text-primary'
                  )}
                />
                <span>{t.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* TAB: QUEUE */}
            {tab === 'queue' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" /> Hàng chờ duyệt bài viết
                      &amp; công thức
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Xem xét nguyên liệu, hướng dẫn và hình ảnh. Phê duyệt bài hợp lệ hoặc từ chối
                      kèm góp ý xây dựng.
                    </p>
                  </div>
                </div>

                <ReviewQueueTable />
              </div>
            )}

            {/* TAB: CONTRIBUTIONS SHORTCUTS */}
            {tab === 'contributions' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border border-border/80 transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                      <UtensilsCrossed className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Công thức món chay</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Chia sẻ bí quyết nấu các món ăn thuần chay giàu đạm thực vật, kèm định lượng
                      calo và các bước chế biến chi tiết.
                    </p>
                    <Button asChild className="w-full rounded-full gap-2">
                      <Link href="/recipes/new">
                        <Plus className="h-4 w-4" /> Đăng công thức mới
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border/80 transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/30 text-secondary-foreground mb-2">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Tin tức dinh dưỡng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Viết bài phân tích chuyên sâu về dinh dưỡng thuần thực vật (Vitamin B12, Sắt,
                      Kẽm, Omega-3) và lối sống lành mạnh.
                    </p>
                    <Button asChild variant="outline" className="w-full rounded-full gap-2">
                      <Link href="/articles/new">
                        <Plus className="h-4 w-4" /> Viết tin tức mới
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-border/80 transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cta/15 text-cta mb-2">
                      <Video className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Video ẩm thực</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Đăng tải video ngắn hoặc clip hướng dẫn nấu ăn từ YouTube / Cloudinary để
                      người dùng dễ theo dõi trực quan.
                    </p>
                    <Button asChild variant="outline" className="w-full rounded-full gap-2">
                      <Link href="/videos/new">
                        <Plus className="h-4 w-4" /> Đăng video mới
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB: GUIDELINES */}
            {tab === 'guidelines' && (
              <div className="space-y-6">
                <Card className="rounded-2xl border border-border/80 p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" /> Tiêu chuẩn kiểm duyệt nội dung
                    cộng đồng
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" /> Tiêu chí Phê duyệt (Approve)
                      </p>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                        <li>100% nguyên liệu có nguồn gốc thực vật, nấm hoặc khoáng chất.</li>
                        <li>Định lượng nguyên liệu và các bước thực hiện rõ ràng, an toàn.</li>
                        <li>Hình ảnh tự chụp hoặc có bản quyền, chất lượng hình ảnh sắc nét.</li>
                        <li>
                          Cảnh báo rõ ràng các chất có khả năng gây dị ứng (đậu phộng, gluten, đậu
                          nành).
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
                      <p className="font-semibold text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Tiêu chí Từ chối (Reject)
                      </p>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                        <li>
                          Có chứa thành phần nguồn gốc động vật (mật ong, gelatin, mỡ động vật...).
                        </li>
                        <li>
                          Nội dung sao chép không nguồn, spam link tiếp thị liên kết hoặc quảng cáo
                          rác.
                        </li>
                        <li>Hướng dẫn chế biến thiếu an toàn vệ sinh hoặc nguy hiểm.</li>
                        <li>
                          <strong>Bắt buộc:</strong> Khi từ chối phải cung cấp lý do cụ thể tối
                          thiểu 10 ký tự.
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
