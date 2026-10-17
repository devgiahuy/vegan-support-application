'use client';
import Link from 'next/link';
import { useEntitlementsQuery } from '@/features/billing/queries/billing.queries';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function AllowanceNotice({
  feature = 'PANTRY',
}: {
  feature?: 'PANTRY' | 'FRIDGE' | 'RECEIPT' | 'CHAT';
}) {
  const query = useEntitlementsQuery();
  if (query.isLoading) return <Skeleton className="h-16 rounded-lg" />;
  if (query.isError)
    return (
      <Alert>
        <AlertTitle>Chưa tải được quyền lợi</AlertTitle>
        <AlertDescription>
          {billingErrorMessage(query.error)}
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    );
  if (!query.data?.enabled) return null;
  const value =
    feature === 'PANTRY'
      ? query.data.pantryLabel
      : feature === 'CHAT'
        ? query.data.chatCredits + ' lượt chat mua thêm'
        : feature === 'FRIDGE'
          ? query.data.fridgeCredits + ' lượt quét tủ lạnh'
          : query.data.receiptCredits + ' lượt phân tích hóa đơn';
  return (
    <Alert>
      <AlertTitle>{value}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {feature === 'PANTRY'
            ? 'Item chưa xóa, kể cả số lượng bằng 0, đều chiếm một ô.'
            : feature === 'CHAT'
              ? 'Lượt miễn phí được dùng trước; kết quả lỗi không mất lượt mua thêm.'
              : query.data.scanPolicyLabel}
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/billing">Mua thêm quyền lợi</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
