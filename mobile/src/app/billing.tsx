import { createChatIdempotencyKey } from '@/features/chat/utils/idempotency';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { LoadingState } from '@/components/shared/state-views';
import { useAuthStore } from '@/store/useAuthStore';
import { billingErrorMessage } from '@/features/billing/lib/billing-errors';
import {
  billingCheckMessage,
  billingCheckTime,
  type BillingCheckFeedback,
} from '@/features/billing/lib/billing-feedback';
import {
  BILLING_QUERY_KEYS,
  useBillingCatalogQuery,
  useBillingOrderQuery,
  useBillingOrdersQuery,
  useCreateBillingOrderMutation,
  useEntitlementsQuery,
  useReconcileBillingOrderMutation,
} from '@/features/billing/queries/billing.queries';
import type { BillingOrder, BillingProduct, EntitlementSubscription } from '@/features/billing/types/billing.model';
import { cn } from '@/lib/utils';

function openCheckout(url: string) {
  // Expo web opens in the current tab, so an async order request cannot lose
  // its checkout to popup blocking. Native platforms ignore windowName.
  return WebBrowser.openBrowserAsync(url, { windowName: '_self' });
}

function OrderCard({
  order,
  refresh,
  busy,
}: {
  order: BillingOrder;
  refresh: (id: string) => Promise<BillingOrder>;
  busy: boolean;
}) {
  const [checking, setChecking] = React.useState(false);
  const [feedback, setFeedback] = React.useState<BillingCheckFeedback | null>(null);
  async function checkPayment() {
    setChecking(true);
    setFeedback(null);
    try {
      const result = await refresh(order.id);
      setFeedback({
        message: billingCheckMessage(result),
        checkedAtLabel: billingCheckTime(),
        isError: false,
        status: result.status,
      });
    } catch (error) {
      setFeedback({
        message: billingErrorMessage(error),
        checkedAtLabel: billingCheckTime(),
        isError: true,
      });
    } finally {
      setChecking(false);
    }
  }
  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <Text className="text-base font-semibold text-foreground">{order.productName}</Text>
      <Text className="text-sm text-muted-foreground">
        {order.durationLabel} · {order.priceLabel} · {order.createdAtLabel}
      </Text>
      <Text className="text-xs text-muted-foreground">{order.providerLabel}</Text>
      <Text className="text-sm font-semibold text-primary">{order.statusLabel}</Text>
      {order.checkoutUrl && (
        <PrimaryButton
          label="Tiếp tục thanh toán qua payOS"
          variant="outline"
          disabled={busy}
          onPress={() => {
            void openCheckout(order.checkoutUrl!).catch(() => void checkPayment());
          }}
        />
      )}
      {order.provider === 'payos' && order.status !== 'PAID' && (
        <PrimaryButton
          label={checking ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}
          variant="outline"
          disabled={busy || checking}
          loading={checking}
          onPress={() => void checkPayment()}
        />
      )}
      {feedback && (feedback.isError || feedback.status === order.status) && (
        <Text
          accessibilityRole={feedback.isError ? 'alert' : undefined}
          accessibilityLiveRegion="polite"
          className={
            feedback.isError
              ? 'text-sm text-destructive'
              : 'text-sm leading-5 text-muted-foreground'
          }
        >
          Kiểm tra lúc {feedback.checkedAtLabel}. {feedback.message}
        </Text>
      )}
    </View>
  );
}

function ActivePlanCard({ subscription }: { subscription: EntitlementSubscription }) {
  return (
    <View className="gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <Text className="text-base font-semibold text-foreground">Combo tiện ích đang hoạt động</Text>
      <Text className="text-sm text-muted-foreground">
        Hiệu lực đến {subscription.endsAtLabel} · Chu kỳ hiện tại kết thúc {subscription.periodEndsAtLabel}
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-2">
        {subscription.periodRows.map((row) => (
          <View key={row.label} className="w-[48.5%] gap-0.5 rounded-lg border border-border bg-card p-3">
            <Text className="text-xs text-muted-foreground">{row.label}</Text>
            <Text className="text-base font-semibold text-foreground">{row.value}</Text>
          </View>
        ))}
      </View>
      <Text className="text-xs leading-5 text-muted-foreground">
        Mỗi {subscription.periodDays} ngày cấp lại lượt theo chu kỳ; lượt chưa dùng hết hạn cuối chu kỳ. Lượt chu kỳ được dùng trước lượt mua lẻ. Mua thêm combo khi còn hạn sẽ nối tiếp thời gian hiệu lực.
      </Text>
    </View>
  );
}

function DurationPlans({
  plans,
  enabled,
  purchasingId,
  anyPurchasing,
  onBuy,
}: {
  plans: BillingProduct[];
  enabled: boolean;
  purchasingId: string | undefined;
  anyPurchasing: boolean;
  onBuy: (productId: string) => void;
}) {
  const [selectedPlanId, setSelectedPlanId] = React.useState('');
  const selected = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];
  if (!selected) return null;
  return (
    <View className="gap-3">
      <Text className="text-2xl font-semibold text-foreground">Combo tiện ích theo thời hạn</Text>
      <Text className="text-sm leading-5 text-muted-foreground">
        Không tự gia hạn. Mỗi chu kỳ 30 ngày được cấp lượt chat AI, quét tủ lạnh, phân tích hóa đơn và thêm ô tủ đồ ăn khi còn hạn.
      </Text>
      <View accessibilityRole="radiogroup" className="flex-row gap-2">
        {plans.map((plan) => {
          const active = plan.id === selected.id;
          return (
            <Pressable
              key={plan.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedPlanId(plan.id)}
              className={cn('flex-1 items-center gap-0.5 rounded-xl border px-2 py-3', active ? 'border-primary bg-primary/10' : 'border-border bg-card')}
            >
              <Text className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>{plan.durationLabel}</Text>
              {plan.savingsPercent > 0 ? <Text className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Tiết kiệm {plan.savingsPercent}%</Text> : <Text className="text-[11px] text-muted-foreground"> </Text>}
            </Pressable>
          );
        })}
      </View>
      <View className="gap-3 rounded-xl border border-border bg-card p-5">
        <Text className="text-lg font-semibold text-foreground">{selected.name}</Text>
        <Text className="text-sm text-muted-foreground">{selected.description}</Text>
        <Text className="text-2xl font-bold text-primary">{selected.priceLabel}</Text>
        <Text className="text-xs text-muted-foreground">≈ {selected.monthlyPriceLabel} / tháng</Text>
        {selected.periodBenefitLabels.map((label) => (
          <Text key={label} className="text-sm text-foreground">
            {label}
          </Text>
        ))}
        <PrimaryButton
          label="Thanh toán qua payOS"
          loading={purchasingId === selected.id}
          disabled={!enabled || !selected.canBuy || anyPurchasing}
          onPress={() => onBuy(selected.id)}
        />
      </View>
    </View>
  );
}

export default function BillingScreen() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const client = useQueryClient();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const initialId =
    typeof params.orderId === 'string' && /^[a-f0-9-]{36}$/i.test(params.orderId)
      ? params.orderId
      : '';
  const [selectedId, setSelectedId] = React.useState(initialId);
  const [page, setPage] = React.useState(1);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const intents = React.useRef(new Map<string, string>());
  const catalog = useBillingCatalogQuery();
  const allowances = useEntitlementsQuery();
  const history = useBillingOrdersQuery(page);
  const selected = useBillingOrderQuery(selectedId);
  const purchase = useCreateBillingOrderMutation();
  const reconcile = useReconcileBillingOrderMutation();
  useFocusEffect(
    React.useCallback(() => {
      if (authenticated) void client.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
    }, [client, authenticated])
  );
  async function buy(productId: string) {
    setActionError(null);
    const key = intents.current.get(productId) ?? createChatIdempotencyKey();
    intents.current.set(productId, key);
    try {
      const order = await purchase.mutateAsync({
        productId,
        idempotencyKey: key,
      });
      intents.current.delete(productId);
      setSelectedId(order.id);
      if (order.checkoutUrl) await openCheckout(order.checkoutUrl);
      await client.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
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
    <SiteScreen>
      <View className="gap-6 px-4 pb-10 pt-5">
        <View className="gap-2">
          <Text className="text-sm font-semibold text-primary">Gói tiện ích VeggieConnect</Text>
          <Text className="text-3xl font-bold text-foreground">Thêm lượt, chủ động hơn</Text>
          <Text className="text-sm leading-6 text-muted-foreground">
            Gói lẻ mua một lần, cộng dồn vào tài khoản; combo tiện ích theo thời hạn cấp lượt mỗi
            chu kỳ. Không tự gia hạn, không tăng dung lượng ảnh lưu trữ.
          </Text>
        </View>
        {!authenticated ? (
          <View className="gap-3">
            <Text className="text-foreground">Đăng nhập để xem hạn mức và mua gói.</Text>
            <Link href={'/(auth)/login' as Href} asChild>
              <PrimaryButton label="Đăng nhập" />
            </Link>
          </View>
        ) : (
          <>
            <View className="gap-2 rounded-xl border border-border bg-muted p-4">
              <Text className="font-semibold text-foreground">
                {catalog.data?.providerLabel ?? 'Thanh toán qua payOS'}
              </Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                Chuyển khoản hoặc quét QR trên trang payOS. Giao dịch chuyển tiền thật; payOS không
                có sandbox riêng. Chỉ cộng lượt sau khi xác nhận đã nhận đủ tiền.
              </Text>
              <Text className="text-xs text-muted-foreground">
                Sau thanh toán, đóng trình duyệt và quay lại ứng dụng để xem quyền lợi.
              </Text>
            </View>
            {loading ? (
              <LoadingState message="Đang tải hạn mức…" />
            ) : error ? (
              <View className="gap-3">
                <Text accessibilityRole="alert" className="text-destructive">
                  {billingErrorMessage(error)}
                </Text>
                <PrimaryButton
                  label="Thử lại"
                  variant="outline"
                  onPress={() => {
                    void catalog.refetch();
                    void allowances.refetch();
                  }}
                />
              </View>
            ) : (
              <>
                {allowances.data?.subscription ? <ActivePlanCard subscription={allowances.data.subscription} /> : null}
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {allowances.data?.usageRows.map((row) => (
                    <View
                      key={row.label}
                      className="w-[48.5%] gap-1 rounded-xl border border-border bg-card p-3"
                    >
                      <Text className="text-sm text-muted-foreground">{row.label}</Text>
                      <Text className="text-xl font-semibold text-foreground">{row.value}</Text>
                      <Text className="text-xs text-muted-foreground">{row.note}</Text>
                    </View>
                  ))}
                </View>
                {!catalog.data?.enabled && (
                  <Text className="text-sm text-muted-foreground">
                    Thanh toán payOS chưa sẵn sàng trên máy chủ.
                  </Text>
                )}
                <Text className="text-xs leading-5 text-muted-foreground">
                  {allowances.data?.scanPolicyLabel} Lỗi toàn bộ không mất lượt; retry của job đã
                  tính lượt không trừ thêm. Quét ảnh hiện là tính năng thử nghiệm.
                </Text>
              </>
            )}
            {actionError && (
              <Text accessibilityRole="alert" className="text-sm text-destructive">
                {actionError}
              </Text>
            )}
            {selectedId && (
              <View className="gap-3">
                <Text className="text-xl font-semibold text-foreground">Đơn hàng đang xem</Text>
                {selected.isLoading ? (
                  <LoadingState message="Đang kiểm tra đơn…" />
                ) : selected.isError ? (
                  <Text accessibilityRole="alert" className="text-destructive">
                    {billingErrorMessage(selected.error)}
                  </Text>
                ) : (
                  selected.data && (
                    <OrderCard order={selected.data} refresh={refresh} busy={reconcile.isPending} />
                  )
                )}
              </View>
            )}
            {catalog.data && catalog.data.durationPlans.length > 0 ? (
              <DurationPlans
                plans={catalog.data.durationPlans}
                enabled={catalog.data.enabled}
                purchasingId={purchase.isPending ? purchase.variables?.productId : undefined}
                anyPurchasing={purchase.isPending}
                onBuy={(productId) => void buy(productId)}
              />
            ) : null}
            <View className="gap-4">
              <Text className="text-2xl font-semibold text-foreground">Gói lẻ mua thêm</Text>
              {catalog.data?.products.length === 0 && (
                <Text className="text-muted-foreground">Chưa có gói đang mở bán.</Text>
              )}
              {catalog.data?.oneTimeProducts.map((product) => (
                <View
                  key={product.id}
                  className="gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <Text className="text-lg font-semibold text-foreground">{product.name}</Text>
                  <Text className="text-sm text-muted-foreground">{product.description}</Text>
                  <Text className="text-2xl font-bold text-primary">{product.priceLabel}</Text>
                  {product.benefitLabels.map((label) => (
                    <Text key={label} className="text-sm text-foreground">
                      {label}
                    </Text>
                  ))}
                  <Text className="text-xs text-muted-foreground">
                    Cộng dồn · Không hết hạn trong bản demo
                  </Text>
                  <PrimaryButton
                    label="Thanh toán qua payOS"
                    loading={purchase.isPending && purchase.variables?.productId === product.id}
                    disabled={!catalog.data?.enabled || !product.canBuy || purchase.isPending}
                    onPress={() => void buy(product.id)}
                  />
                </View>
              ))}
            </View>
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Lịch sử mua gói</Text>
              {history.isLoading ? (
                <LoadingState message="Đang tải lịch sử…" />
              ) : history.isError ? (
                <View className="gap-3">
                  <Text accessibilityRole="alert" className="text-destructive">
                    {billingErrorMessage(history.error)}
                  </Text>
                  <PrimaryButton
                    label="Tải lại lịch sử"
                    variant="outline"
                    onPress={() => void history.refetch()}
                  />
                </View>
              ) : history.data?.items.length === 0 ? (
                <Text className="text-muted-foreground">
                  Bạn chưa mua gói nào. Chọn gói phù hợp ở phía trên.
                </Text>
              ) : (
                history.data?.items.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    refresh={refresh}
                    busy={reconcile.isPending}
                  />
                ))
              )}
              {history.data && history.data.totalPages > 1 && (
                <View className="gap-2">
                  <PrimaryButton
                    label="Trang trước"
                    variant="outline"
                    disabled={page <= 1}
                    onPress={() => setPage((value) => value - 1)}
                  />
                  <PrimaryButton
                    label="Trang sau"
                    variant="outline"
                    disabled={page >= history.data.totalPages}
                    onPress={() => setPage((value) => value + 1)}
                  />
                </View>
              )}
            </View>
            <View className="gap-3">
              <Text className="text-xl font-semibold text-foreground">Biến động quyền lợi</Text>
              {allowances.data?.ledger.length === 0 && (
                <Text className="text-muted-foreground">Chưa có biến động.</Text>
              )}
              {allowances.data?.ledger.map((entry) => (
                <View
                  key={entry.id}
                  className="flex-row items-center justify-between gap-3 border-b border-border py-3"
                >
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">
                      {entry.featureLabel} · {entry.reasonLabel}
                    </Text>
                    <Text className="text-xs text-muted-foreground">{entry.createdAtLabel}</Text>
                  </View>
                  <Text className="font-semibold text-foreground">{entry.deltaLabel}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row gap-2">
              <Link href={'/pantry' as Href} asChild>
                <PrimaryButton label="Mở tủ đồ ăn" variant="outline" className="flex-1" />
              </Link>
              <Link href={'/(tabs)/assistant' as Href} asChild>
                <PrimaryButton label="Trở lại chat AI" variant="outline" className="flex-1" />
              </Link>
            </View>
          </>
        )}
      </View>
    </SiteScreen>
  );
}
