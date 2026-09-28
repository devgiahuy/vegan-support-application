'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { HardDrive, History, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/shared/auth-guard';
import { UserRole } from '@/common/enums';
import { StorageAccountList } from '@/features/storage/components/storage-account-list';
import { StorageAdjustmentList } from '@/features/storage/components/storage-adjustment-list';
import { StoragePolicyForm } from '@/features/storage/components/storage-policy-form';

type StorageTab = 'accounts' | 'adjustments' | 'policies';

const TABS: { id: StorageTab; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { id: 'accounts', label: 'Tài khoản lưu trữ', icon: Users },
    { id: 'adjustments', label: 'Lịch sử điều chỉnh', icon: History },
    { id: 'policies', label: 'Chính sách hệ thống', icon: Settings },
  ];

function parseTab(param: string | null): StorageTab {
  if (param === 'accounts' || param === 'adjustments' || param === 'policies') {
    return param;
  }
  return 'accounts';
}

export default function AdminStoragePage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-muted-foreground">Đang tải trang quản trị lưu trữ...</div>
      }
    >
      <AdminStorageContent />
    </Suspense>
  );
}

function AdminStorageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<StorageTab>(() => parseTab(searchParams.get('tab')));
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab) {
      setTab(parseTab(urlTab));
    }
  }, [searchParams]);

  return (
    <AuthGuard roles={[UserRole.ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            Quản trị Lưu trữ &amp; Dung lượng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi hạn mức bộ nhớ người dùng, điều chỉnh dung lượng thủ công và cấu hình chính
            sách lưu trữ hệ thống.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;

            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative z-10 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-storage-tab"
                    className="absolute inset-0 -z-10 rounded-xl bg-background shadow-xs border border-border/40"
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'accounts' && <StorageAccountList />}
            {tab === 'adjustments' && <StorageAdjustmentList />}
            {tab === 'policies' && <StoragePolicyForm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
