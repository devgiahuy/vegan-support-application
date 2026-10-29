'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { QrCode, Info } from 'lucide-react';
import { toast } from 'sonner';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';
import {
  billingCheckMessage,
  billingCheckTime,
  type BillingCheckFeedback,
} from '@/features/billing/lib/billing-feedback';
import {
  useBillingCatalogQuery,
  useBillingOrderQuery,
  useBillingOrdersQuery,
  useCreateBillingOrderMutation,
  useEntitlementsQuery,
  useReconcileBillingOrderMutation,
} from '@/features/billing/queries/billing.queries';
import type { BillingOrder, BillingProduct } from '@/features/billing/types/billing.model';

function OrderRow({
  order,
  onRefresh,
  refreshing,
}: {
  order: BillingOrder;
  onRefresh: (id: string) => Promise<BillingOrder>;
  refreshing: boolean;
}) {
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<BillingCheckFeedback | null>(null);
  async function checkPayment() {
    setChecking(true);
    setFeedback(null);
    try {
      const result = await onRefresh(order.id);
      const message = billingCheckMessage(result);
      setFeedback({
        message,
        checkedAtLabel: billingCheckTime(),
        isError: false,
        status: result.status,
      });
      toast.info('Đã tải lại trạng thái: ' + result.statusLabel, { description: message });
    } catch (error) {
      const message = billingErrorMessage(error);
      setFeedback({ message, checkedAtLabel: billingCheckTime(), isError: true });
      toast.error('Chưa kiểm tra được thanh toán', { description: message });
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">
            {order.productName}
            {order.durationLabel !== 'Mua một lần' && (
              <span className="text-muted-foreground"> · {order.durationLabel}</span>
            )}
          </p>
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
                Tiếp tục thanh toán qua payOS
              </a>
            </Button>
          )}
          {order.provider === 'payos' && order.status !== 'PAID' && (
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing || checking}
              aria-busy={checking}
              onClick={() => void checkPayment()}
            >
              {checking ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}
            </Button>
          )}
        </div>
      </div>
      {feedback && (feedback.isError || feedback.status === order.status) && (
        <p
          role={feedback.isError ? 'alert' : 'status'}
          className={
            feedback.isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'
          }
        >
          <span className="tabular-nums">Kiểm tra lúc {feedback.checkedAtLabel}. </span>
          {feedback.message}
        </p>
      )}
    </div>
  );
}

function DurationPlanCard({
  plans,
  enabled,
  pendingProductId,
  onBuy,
}: {
  plans: BillingProduct[];
  enabled: boolean;
  pendingProductId: string | null;
  onBuy: (productId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(plans[0]?.id ?? '');
  const plan = plans.find((item) => item.id === selectedId) ?? plans[0];
  if (!plan) return null;
  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-balance">Gói tiện ích theo thời hạn</CardTitle>
          {plan.savingsPercent > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              Tiết kiệm {plan.savingsPercent}%
            </Badge>
          )}
        </div>
        <CardDescription className="text-pretty">{plan.description}</CardDescription>
        <ToggleGroup
          type="single"
          variant="outline"
          value={plan.id}
          onValueChange={(value) => {
            if (value) setSelectedId(value);
          }}
          aria-label="Chọn thời hạn gói tiện ích"
          className="w-full"
        >
          {plans.map((item) => (
            <ToggleGroupItem key={item.id} value={item.id} className="flex-1">
              {item.durationLabel}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <p className="tabular-nums text-2xl font-semibold">{plan.priceLabel}</p>
          {plan.durationMonths !== null && plan.durationMonths > 1 && (
            <p className="tabular-nums text-sm text-muted-foreground">
              Tương đương {plan.monthlyPriceLabel} / tháng
            </p>
          )}
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {plan.periodBenefitLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <p className="text-pretty text-xs text-muted-foreground">
          {plan.durationMonths} chu kỳ × {plan.periodDays} ngày kể từ khi thanh toán. Lượt của chu
          kỳ được dùng trước lượt mua lẻ và hết hạn khi sang chu kỳ mới. Không tự gia hạn; mua khi
          còn hạn sẽ nối tiếp sau ngày hết hạn hiện tại.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!enabled || !plan.canBuy || pendingProductId !== null}
          onClick={() => onBuy(plan.id)}
        >
          <QrCode data-icon="inline-start" />
          {pendingProductId === plan.id
            ? 'Đang tạo đơn…'
            : 'Thanh toán gói ' + plan.durationLabel + ' qua payOS'}
        </Button>
      </CardFooter>
    </Card>
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
    return reconcile.mutateAsync(id);
  }
  const loading = catalog.isLoading || allowances.isLoading;
  const error = catalog.error ?? allowances.error;
  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-primary">Gói tiện ích VeggieConnect</p>
        <h1 className="text-balance text-3xl font-semibold sm:text-4xl">Thêm lượt, chủ động hơn</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Gói tiện ích chọn thời hạn 1 tháng, 3 tháng hoặc 1 năm và nhận lượt mới mỗi 30 ngày. Gói
          lẻ mua một lần, cộng dồn vào tài khoản. Lượt chat miễn phí được dùng trước. Không tự gia
          hạn và không tăng dung lượng ảnh lưu trữ.
        </p>
      </header>
      <Alert>
        <Info />
        <AlertTitle>{catalog.data?.providerLabel ?? 'Thanh toán qua payOS'}</AlertTitle>
        <AlertDescription>
          Thanh toán bằng chuyển khoản hoặc quét QR trên trang payOS. Giao dịch chuyển tiền thật;
          payOS không có sandbox riêng. Chỉ cộng lượt sau khi xác nhận đã nhận đủ tiền.
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
          {allowances.data?.subscription && (
            <Card aria-label="Gói tiện ích đang dùng">
              <CardHeader>
                <CardDescription>Gói tiện ích còn hạn đến</CardDescription>
                <CardTitle className="tabular-nums text-xl">
                  {allowances.data.subscription.endsAtLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-pretty text-sm text-muted-foreground">
                  Chu kỳ hiện tại kết thúc lúc{' '}
                  <span className="tabular-nums">
                    {allowances.data.subscription.periodEndsAtLabel}
                  </span>
                  . Lượt còn lại của chu kỳ không được cộng dồn sang chu kỳ sau.
                </p>
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  {allowances.data.subscription.periodRows.map((row) => (
                    <div key={row.label} className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="tabular-nums font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
          {!catalog.data?.enabled && (
            <Alert>
              <AlertTitle>Thanh toán payOS chưa sẵn sàng</AlertTitle>
              <AlertDescription>
                Bạn vẫn có thể xem hạn mức và lịch sử. Các gói sẽ mở mua khi thanh toán payOS sẵn
                sàng.
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
                  onRefresh={refresh}
                  refreshing={reconcile.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  {billingCheckMessage(selected.data)}
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
          {catalog.data && catalog.data.durationPlans.length > 0 && (
            <DurationPlanCard
              plans={catalog.data.durationPlans}
              enabled={catalog.data.enabled}
              pendingProductId={purchase.isPending ? (purchase.variables?.productId ?? '') : null}
              onBuy={(productId) => void buy(productId)}
            />
          )}
          {catalog.data?.oneTimeProducts.map((product) => (
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
                  <QrCode data-icon="inline-start" />
                  {purchase.isPending && purchase.variables?.productId === product.id
                    ? 'Đang tạo đơn…'
                    : 'Thanh toán qua payOS'}
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
              onRefresh={refresh}
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
        {allowances.data?.ledger.map((entry) => {
          const isPositive = entry.delta > 0 || entry.deltaLabel.startsWith('+');
          const isNegative = entry.delta < 0 || entry.deltaLabel.startsWith('-');
          return (
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
              <span
                className={`tabular-nums font-semibold ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isNegative
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-muted-foreground font-medium'
                }`}
              >
                {entry.deltaLabel}
              </span>
            </div>
          );
        })}
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
