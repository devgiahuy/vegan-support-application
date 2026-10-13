'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Info } from 'lucide-react';
import { AuthGuard } from '@/components/shared/auth-guard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';
import {
  useBillingCatalogQuery,
  useBillingOrderQuery,
  useBillingOrdersQuery,
  useCreateBillingOrderMutation,
  useEntitlementsQuery,
  useReconcileBillingOrderMutation,
} from '@/features/billing/queries/billing.queries';
import type { BillingOrder } from '@/features/billing/types/billing.model';

function OrderRow({
  order,
  onRefresh,
  refreshing,
}: {
  order: BillingOrder;
  onRefresh: (id: string) => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{order.productName}</p>
        <p className="text-sm text-muted-foreground">
          {order.priceLabel} · {order.createdAtLabel}
        </p>
        <p className="text-xs text-muted-foreground">{order.providerLabel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={order.status === 'PAID' ? 'default' : 'secondary'}>
          {order.statusLabel}
        </Badge>
        {order.checkoutUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={order.checkoutUrl} rel="noreferrer">
              Tiếp tục thanh toán
            </a>
          </Button>
        )}
        {order.status !== 'PAID' && (
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => onRefresh(order.id)}
          >
            Kiểm tra thanh toán
          </Button>
        )}
      </div>
    </div>
  );
}

function BillingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get('orderId') ?? '';
  const validId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(selectedId)
    ? selectedId
    : '';
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const intents = useRef(new Map<string, string>());
  const catalog = useBillingCatalogQuery();
  const allowances = useEntitlementsQuery();
  const history = useBillingOrdersQuery(page);
  const selected = useBillingOrderQuery(validId);
  const purchase = useCreateBillingOrderMutation();
  const reconcile = useReconcileBillingOrderMutation();
  async function buy(productId: string) {
    setActionError(null);
    const key = intents.current.get(productId) ?? crypto.randomUUID();
    intents.current.set(productId, key);
    try {
      const order = await purchase.mutateAsync({ productId, idempotencyKey: key });
      intents.current.delete(productId);
      router.replace('/billing?orderId=' + order.id);
      if (order.checkoutUrl) window.location.assign(order.checkoutUrl);
    } catch (error) {
      setActionError(billingErrorMessage(error));
    }
  }
  async function refresh(id: string) {
    setActionError(null);
    try {
      await reconcile.mutateAsync(id);
    } catch (error) {
      setActionError(billingErrorMessage(error));
    }
  }
  const loading = catalog.isLoading || allowances.isLoading;
  const error = catalog.error ?? allowances.error;
  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-primary">Gói tiện ích VeggieConnect</p>
        <h1 className="text-balance text-3xl font-semibold sm:text-4xl">Thêm lượt, chủ động hơn</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Mua một lần, cộng dồn vào tài khoản. Lượt chat miễn phí được dùng trước. Gói mua thêm
          không tự gia hạn và không tăng dung lượng ảnh lưu trữ.
        </p>
      </header>
      <Alert>
        <Info />
        <AlertTitle>{catalog.data?.providerLabel ?? 'Thanh toán sandbox'}</AlertTitle>
        <AlertDescription>
          {catalog.data?.simulated !== false
            ? 'Đây là sandbox nội bộ: không chuyển tiền thật. Giá và giao dịch chỉ phục vụ bản demo.'
            : 'Đây là môi trường thử nghiệm VNPAY. Giao dịch sandbox không phải thanh toán production.'}
        </AlertDescription>
      </Alert>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((id) => (
            <Skeleton key={id} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Chưa tải được hạn mức</AlertTitle>
          <AlertDescription>
            {billingErrorMessage(error)}
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                void catalog.refetch();
                void allowances.refetch();
              }}
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <section
            aria-label="Hạn mức tài khoản"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {allowances.data?.usageRows.map((row) => (
              <Card key={row.label}>
                <CardHeader>
                  <CardDescription>{row.label}</CardDescription>
                  <CardTitle className="tabular-nums text-xl">{row.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{row.note}</p>
                </CardContent>
              </Card>
            ))}
          </section>
          {!catalog.data?.enabled && (
            <Alert>
              <AlertTitle>Thanh toán demo chưa được bật</AlertTitle>
              <AlertDescription>
                Bạn vẫn có thể xem lịch sử và quyền lợi hiện có. Máy chủ cần bật tính năng trước khi
                mua gói.
              </AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            {allowances.data?.scanPolicyLabel} Lỗi toàn bộ không mất lượt; retry của job đã tính
            lượt không trừ thêm. Quét ảnh hiện là tính năng thử nghiệm.
          </p>
          {allowances.data?.pantryFull && (
            <Alert>
              <AlertTitle>Tủ đồ ăn đã đầy</AlertTitle>
              <AlertDescription>
                Xóa hoặc gộp item để giải phóng ô, hoặc mua thêm sức chứa. Kết quả phân tích được
                giữ để xác nhận lại sau.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
      {actionError && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Chưa hoàn tất thao tác</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {selectedId && (
        <section aria-label="Đơn vừa thanh toán" className="flex flex-col gap-3">
          <h2 className="text-balance text-xl font-semibold">Đơn hàng đang xem</h2>
          {!validId ? (
            <p role="alert">Mã đơn hàng không hợp lệ.</p>
          ) : selected.isLoading ? (
            <Skeleton className="h-24" />
          ) : selected.isError ? (
            <p role="alert">{billingErrorMessage(selected.error)}</p>
          ) : (
            selected.data && (
              <>
                <OrderRow
                  order={selected.data}
                  onRefresh={(id) => void refresh(id)}
                  refreshing={reconcile.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  {selected.data.status === 'PAID'
                    ? 'Quyền lợi đã được cấp vào tài khoản. Bạn có thể quay lại chat hoặc tủ đồ ăn.'
                    : 'Kết quả được xác nhận từ máy chủ. Nếu đã thanh toán, hãy kiểm tra lại; trang quay về không tự cấp lượt.'}
                </p>
              </>
            )
          )}
        </section>
      )}
      <section className="flex flex-col gap-4" aria-labelledby="packages-title">
        <h2 id="packages-title" className="text-balance text-2xl font-semibold">
          Chọn gói mua thêm
        </h2>
        {catalog.data?.products.length === 0 && (
          <p className="text-muted-foreground">Chưa có gói đang mở bán. Hãy thử tải lại sau.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.data?.products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-balance">{product.name}</CardTitle>
                <CardDescription className="text-pretty">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="tabular-nums text-2xl font-semibold">{product.priceLabel}</p>
                <ul className="flex flex-col gap-2 text-sm">
                  {product.benefitLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Cộng dồn · Không hết hạn trong bản demo
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={!catalog.data?.enabled || !product.canBuy || purchase.isPending}
                  onClick={() => void buy(product.id)}
                >
                  <CreditCard data-icon="inline-start" />
                  {purchase.isPending && purchase.variables?.productId === product.id
                    ? 'Đang tạo đơn…'
                    : 'Mua gói'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-4" aria-labelledby="history-title">
        <h2 id="history-title" className="text-balance text-2xl font-semibold">
          Lịch sử mua gói
        </h2>
        {history.isLoading ? (
          <Skeleton className="h-24" />
        ) : history.isError ? (
          <div role="alert">
            <p>{billingErrorMessage(history.error)}</p>
            <Button variant="outline" onClick={() => void history.refetch()}>
              Tải lại lịch sử
            </Button>
          </div>
        ) : history.data?.items.length === 0 ? (
          <p className="text-muted-foreground">
            Bạn chưa mua gói nào. Chọn gói phù hợp ở phía trên để bắt đầu.
          </p>
        ) : (
          history.data?.items.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onRefresh={(id) => void refresh(id)}
              refreshing={reconcile.isPending}
            />
          ))
        )}
        {history.data && history.data.totalPages > 1 && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              disabled={page >= history.data.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Trang sau
            </Button>
          </div>
        )}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="ledger-title">
        <h2 id="ledger-title" className="text-balance text-xl font-semibold">
          Biến động quyền lợi gần đây
        </h2>
        {allowances.data?.ledger.length === 0 && (
          <p className="text-muted-foreground">Chưa có biến động quyền lợi.</p>
        )}
        {allowances.data?.ledger.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-4 border-b py-3 text-sm"
          >
            <div>
              <p>
                {entry.featureLabel} · {entry.reasonLabel}
              </p>
              <p className="text-xs text-muted-foreground">{entry.createdAtLabel}</p>
            </div>
            <span className="tabular-nums font-medium">{entry.deltaLabel}</span>
          </div>
        ))}
      </section>
      <nav className="flex flex-wrap gap-3" aria-label="Tiếp tục sử dụng">
        <Button asChild variant="outline">
          <Link href="/assistant">Trở lại chat AI</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/pantry">Mở tủ đồ ăn</Link>
        </Button>
      </nav>
    </main>
  );
}
export function BillingView() {
  return (
    <AuthGuard>
      <BillingContent />
    </AuthGuard>
  );
}
