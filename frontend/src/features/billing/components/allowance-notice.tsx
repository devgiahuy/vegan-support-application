'use client';

import React from 'react';
import Link from 'next/link';
import { Boxes, MessageSquare, Receipt, Refrigerator, Sparkles, Zap } from 'lucide-react';
import { useEntitlementsQuery } from '@/features/billing/queries/billing.queries';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function AllowanceNotice({
  feature = 'PANTRY',
}: {
  feature?: 'PANTRY' | 'FRIDGE' | 'RECEIPT' | 'CHAT';
}) {
  const query = useEntitlementsQuery();

  if (query.isLoading) {
    return <Skeleton className="h-16 w-full rounded-2xl" />;
  }

  if (query.isError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 shrink-0 text-destructive" />
          <span>Chưa tải được thông tin hạn ngạch: {billingErrorMessage(query.error)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
          className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (!query.data?.enabled) return null;

  // Trích xuất số lượt và nhãn hiển thị tương ứng
  let credits = 0;
  let quotaLabel = '';
  let policyText = query.data.scanPolicyLabel;
  let Icon = Sparkles;

  if (feature === 'PANTRY') {
    quotaLabel = query.data.pantryLabel;
    policyText = 'Vật phẩm chưa xóa, kể cả số lượng bằng 0, đều chiếm một ô trong kho.';
    Icon = Boxes;
  } else if (feature === 'CHAT') {
    credits = query.data.chatCredits;
    quotaLabel = 'lượt chat mua thêm';
    policyText = 'Lượt miễn phí được dùng trước; kết quả lỗi không mất lượt mua thêm.';
    Icon = MessageSquare;
  } else if (feature === 'FRIDGE') {
    credits = query.data.fridgeCredits;
    quotaLabel = 'lượt quét tủ lạnh';
    Icon = Refrigerator;
  } else {
    credits = query.data.receiptCredits;
    quotaLabel = 'lượt phân tích hóa đơn';
    Icon = Receipt;
  }

  const isCreditsBased = feature !== 'PANTRY';
  const hasRemaining = !isCreditsBased || credits > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 transition-all shadow-xs ${
        hasRemaining
          ? 'border-emerald-500/35 bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-teal-50/60 dark:from-emerald-950/40 dark:via-emerald-950/25 dark:to-teal-950/30'
          : 'border-amber-500/40 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/60 dark:from-amber-950/40 dark:via-amber-950/25 dark:to-orange-950/30'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
              hasRemaining
                ? 'bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-amber-600/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {isCreditsBased ? (
                <>
                  <Badge
                    variant="outline"
                    className={`font-mono text-sm sm:text-base font-extrabold px-2.5 py-0.5 rounded-lg tabular-nums border shadow-2xs ${
                      hasRemaining
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40'
                    }`}
                  >
                    {credits}
                  </Badge>
                  <span
                    className={`text-sm sm:text-base font-bold ${
                      hasRemaining
                        ? 'text-emerald-900 dark:text-emerald-100'
                        : 'text-amber-900 dark:text-amber-100'
                    }`}
                  >
                    {quotaLabel}
                  </span>
                  {!hasRemaining && (
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      (Đã hết lượt)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-100">
                  {quotaLabel}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{policyText}</p>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className={`shrink-0 rounded-xl font-semibold shadow-xs text-xs h-9 px-4 transition-all duration-200 active:scale-95 ${
            hasRemaining
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'
              : 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600'
          }`}
        >
          <Link href="/billing">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Mua thêm quyền lợi
          </Link>
        </Button>
      </div>
    </div>
  );
}
