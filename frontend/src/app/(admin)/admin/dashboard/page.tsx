'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ClipboardCheck,
  Users,
  FolderTree,
  Leaf,
  ScrollText,
  Hourglass,
  RefreshCw,
  ShieldAlert,
  Download,
  Search,
  Plus,
  Flag,
  UserCog,
  MessagesSquare,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/shared/auth-guard';
import { EmptyState } from '@/components/shared/empty-state';
import { UserRole } from '@/common/enums';
import { CategoryManager } from '@/features/admin-catalog/components/category-manager';
import { IngredientManager } from '@/features/admin-catalog/components/ingredient-manager';
import { ReviewQueueTable } from '@/features/review/components/review-queue-table';
import { useReviewQueueQuery } from '@/features/review/queries/review.queries';
import { ReportsTable } from '@/features/moderation/components/reports-table';
import { ModUsersTable } from '@/features/moderation/components/mod-users-table';
import { ModCommentsTable } from '@/features/moderation/components/mod-comments-table';
import {
  useModeratedUsersQuery,
  useReportsQuery,
} from '@/features/moderation/queries/moderation.queries';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { ContribQueueTable } from '@/features/contributor/components/contrib-queue-table';

type Tab =
  | 'queue'
  | 'users'
  | 'categories'
  | 'ingredients'
  | 'logs'
  | 'reports'
  | 'mod-users'
  | 'mod-comments'
  | 'contrib-apps';

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={<p className="p-4 text-sm text-muted-foreground">Đang tải bảng điều khiển...</p>}
    >
      <AdminDashboardContent />
    </Suspense>
  );
}

function parseTabParam(value: string | null): Tab {
  if (
    value === 'queue' ||
    value === 'users' ||
    value === 'categories' ||
    value === 'ingredients' ||
    value === 'logs' ||
    value === 'reports' ||
    value === 'mod-users' ||
    value === 'mod-comments' ||
    value === 'contrib-apps'
  ) {
    return value;
  }
  return 'queue';
}

/** Nội dung trang admin dashboard. Nhận `?tab=` để link trực tiếp tới tab (vd `/admin/dashboard?tab=queue`). */
function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<Tab>(() => parseTabParam(searchParams.get('tab')));
  const shouldReduceMotion = useReducedMotion();

  // Queries cho 4 chỉ số KPI thực tế
  const {
    data: queueData,
    refetch: refetchQueue,
    isLoading: loadingQueue,
  } = useReviewQueueQuery({ limit: 1 });
  const {
    data: usersData,
    refetch: refetchUsers,
    isLoading: loadingUsers,
  } = useModeratedUsersQuery({ status: 'ACTIVE', limit: 1 });
  const {
    data: reportsData,
    refetch: refetchReports,
    isLoading: loadingReports,
  } = useReportsQuery({ status: 'OPEN', limit: 1 });
  const {
    data: recipesData,
    refetch: refetchRecipes,
    isLoading: loadingRecipes,
  } = useRecipesQuery({ limit: 1 });

  const queueCount = queueData?.metadata?.totalItems ?? 0;
  const activeUsersCount = usersData?.metadata?.totalItems ?? 0;
  const openReportsCount = reportsData?.metadata?.totalItems ?? 0;
  const liveRecipesCount = recipesData?.metadata?.totalItems ?? 0;

  const kpis = [
    {
      label: 'Công thức chờ duyệt',
      value: loadingQueue ? '...' : queueCount.toLocaleString('vi-VN'),
      sub: `${queueCount} yêu cầu đang chờ xử lý`,
      icon: ClipboardCheck,
      tone: 'text-cta',
    },
    {
      label: 'Người dùng hoạt động',
      value: loadingUsers ? '...' : activeUsersCount.toLocaleString('vi-VN'),
      sub: `${activeUsersCount} tài khoản hoạt động`,
      icon: Users,
      tone: 'text-primary',
    },
    {
      label: 'Báo cáo vi phạm',
      value: loadingReports ? '...' : openReportsCount.toLocaleString('vi-VN'),
      sub: `${openReportsCount} báo cáo cần xử lý`,
      icon: ShieldAlert,
      tone: 'text-destructive',
    },
    {
      label: 'Công thức đang live',
      value: loadingRecipes ? '...' : liveRecipesCount.toLocaleString('vi-VN'),
      sub: `${liveRecipesCount} công thức đã xuất bản`,
      icon: FolderTree,
      tone: 'text-secondary-foreground',
    },
  ];

  const handleRefresh = async () => {
    await Promise.all([refetchQueue(), refetchUsers(), refetchReports(), refetchRecipes()]);
    toast.success('Đã làm mới dữ liệu');
  };

  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setTab(parseTabParam(tabParam));
    }
  }, [searchParams]);

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'queue', label: 'Kiểm duyệt', icon: ClipboardCheck },
    { id: 'reports', label: 'Báo cáo', icon: Flag },
    { id: 'users', label: 'Người dùng & Roles', icon: Users },
    { id: 'mod-users', label: 'Kiểm soát TK', icon: UserCog },
    { id: 'mod-comments', label: 'Kiểm duyệt BL', icon: MessagesSquare },
    { id: 'contrib-apps', label: 'Đơn cộng tác', icon: UserCheck },
    { id: 'categories', label: 'Cây danh mục', icon: FolderTree },
    { id: 'ingredients', label: 'Nguyên liệu', icon: Leaf },
    { id: 'logs', label: 'Audit logs', icon: ScrollText },
  ];

  return (
    <AuthGuard roles={[UserRole.ADMIN]}>
      <div>
        {/* Banner + KPI */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              <BadgeCheckIcon /> Bảng Điều Hành Trung Tâm
              <Badge variant="secondary" className="rounded-full">
                RBAC V2.4
              </Badge>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hàng đợi duyệt:{' '}
              <strong className="text-foreground">
                {loadingQueue ? '...' : `${queueCount} yêu cầu`}
              </strong>{' '}
              • Chỉ SuperAdmin &amp; Moderator
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Làm mới dữ liệu"
            onClick={() => void handleRefresh()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <Icon className={cn('h-5 w-5', k.tone)} />
                  </div>
                  <p className="mt-1 text-2xl font-bold">{k.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="relative no-scrollbar mt-4 flex gap-1 overflow-x-auto rounded-full border border-border/80 bg-muted/80 p-1.5 shadow-sm backdrop-blur-sm">
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
                  'relative z-10 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-admin-tab"
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

        {/* Tab Contents với AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4"
          >
            {/* TAB: QUEUE — hàng chờ kiểm duyệt thật (features/review) */}
            {tab === 'queue' && <ReviewQueueTable />}

            {/* TAB: REPORTS — hàng chờ báo cáo (features/moderation) */}
            {tab === 'reports' && <ReportsTable />}

            {/* TAB: USERS — danh sách người dùng & roles (features/moderation) */}
            {tab === 'users' && <ModUsersTable />}

            {/* TAB: MOD-USERS — kiểm soát tài khoản (features/moderation) */}
            {tab === 'mod-users' && <ModUsersTable />}

            {/* TAB: MOD-COMMENTS — kiểm duyệt bình luận (features/moderation) */}
            {tab === 'mod-comments' && <ModCommentsTable />}

            {/* TAB: CONTRIB-APPS — duyệt đơn cộng tác (features/contributor, fixture) */}
            {tab === 'contrib-apps' && <ContribQueueTable />}

            {/* TAB: CATEGORIES — quản trị thật (CRUD + archive qua replacement) */}
            {tab === 'categories' && (
              <div>
                <CategoryManager />
              </div>
            )}

            {/* TAB: INGREDIENTS — quản trị thật (CRUD + metadata + alias) */}
            {tab === 'ingredients' && (
              <div>
                <IngredientManager />
              </div>
            )}

            {/* TAB: LOGS */}
            {tab === 'logs' && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">Nhật ký thao tác hệ thống (Audit Logs)</h2>
                      <p className="text-xs text-muted-foreground">
                        Lịch sử hành động quản trị viên và bot giám sát tự động.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <EmptyState
                      title="Chưa có API Audit Logs"
                      description="Backend hiện tại chưa cung cấp endpoint cho Nhật ký thao tác hệ thống (/api/v1/admin/logs)."
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}

function BadgeCheckIcon() {
  return <ClipboardCheck className="inline h-6 w-6 text-primary" />;
}
