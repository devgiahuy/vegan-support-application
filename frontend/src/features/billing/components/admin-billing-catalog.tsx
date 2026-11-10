'use client';

import * as React from 'react';
import { CircleAlert, PackageSearch, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import {
  useAdminBillingDetail,
  useAdminBillingList,
  useAdminBillingSave,
  useAdminBillingAvailability,
} from '@/features/billing/queries/admin-billing.queries';
import type {
  AdminBillingForm,
  AdminBillingProduct,
} from '@/features/billing/types/admin-billing.model';

function ProductDetails({ product }: { product: AdminBillingProduct }) {
  const entries = [
    ['Giá bán', product.priceLabel],
    ['Loại gói', product.durationMonths === null ? 'Mua một lần' : 'Theo thời hạn'],
    ['Thời hạn', product.durationLabel],
    ['Phiên bản', String(product.version)],
    ['Chat AI', `${product.chatCredits} lượt`],
    ['Quét tủ lạnh', `${product.fridgeCredits} lượt`],
    ['Phân tích hóa đơn', `${product.receiptCredits} lượt`],
    ['Ô tủ đồ ăn', `${product.pantrySlots} ô`],
  ];
  return (
    <>
      <p className="text-sm text-muted-foreground">{product.description || 'Chưa có mô tả.'}</p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {product.durationMonths !== null && (
        <p className="text-sm text-muted-foreground">
          Lượt sử dụng được cấp mỗi {product.periodDays} ngày; ô tủ đồ ăn có hiệu lực trong thời
          gian gói còn hạn.
        </p>
      )}
    </>
  );
}

function ProductForm({
  product,
  onSaved,
}: {
  product: AdminBillingProduct | null;
  onSaved: () => void;
}) {
  const save = useAdminBillingSave();
  const [duration, setDuration] = React.useState(product?.durationMonths?.toString() ?? 'once');
  const [error, setError] = React.useState('');
  const numericFields = [
    ['priceVnd', 'Giá bán (VND)', product?.priceVnd ?? 0],
    ['chatCredits', 'Lượt chat AI', product?.chatCredits ?? 0],
    ['fridgeCredits', 'Lượt quét tủ lạnh', product?.fridgeCredits ?? 0],
    ['receiptCredits', 'Lượt phân tích hóa đơn', product?.receiptCredits ?? 0],
    ['pantrySlots', 'Ô tủ đồ ăn', product?.pantrySlots ?? 0],
  ] as const;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = (name: string) => Number(data.get(name));
    const form: AdminBillingForm = {
      name: String(data.get('name') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
      priceVnd: amount('priceVnd'),
      chatCredits: amount('chatCredits'),
      fridgeCredits: amount('fridgeCredits'),
      receiptCredits: amount('receiptCredits'),
      pantrySlots: amount('pantrySlots'),
      durationMonths: duration === 'once' ? null : duration === '1' ? 1 : duration === '3' ? 3 : 12,
      reason: String(data.get('reason') ?? '').trim(),
    };
    if (
      !form.name ||
      (form.reason.length < 3 && (!product || form.reason.length > 0)) ||
      form.priceVnd < 1 ||
      form.chatCredits + form.fridgeCredits + form.receiptCredits + form.pantrySlots === 0
    ) {
      setError(
        product
          ? 'Nhập tên, giá hợp lệ, ít nhất một quyền lợi; nếu nhập lý do, hãy dùng ít nhất 3 ký tự.'
          : 'Nhập tên, giá hợp lệ, ít nhất một quyền lợi và lý do từ 3 ký tự.'
      );
      return;
    }
    setError('');
    try {
      await save.mutateAsync({ productId: product?.id, version: product?.version, form });
      toast.success(product ? 'Đã cập nhật gói' : 'Đã tạo gói nháp');
      onSaved();
    } catch (cause) {
      const code = getApiErrorCode(cause);
      setError(
        code === 'BILLING_PRODUCT_CONFLICT'
          ? 'Gói đã thay đổi. Đóng biểu mẫu và tải lại trước khi sửa.'
          : code === 'BILLING_PRODUCT_ACTIVE'
            ? 'Gói đang bán không thể sửa.'
            : getApiErrorMessage(cause, 'Không thể lưu gói.')
      );
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="package-name">Tên gói</FieldLabel>
          <Input
            id="package-name"
            name="name"
            defaultValue={product?.name}
            required
            maxLength={100}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="package-description">Mô tả</FieldLabel>
          <Textarea
            id="package-description"
            name="description"
            defaultValue={product?.description}
            maxLength={1000}
          />
        </Field>
        <Field>
          <FieldLabel>Thời hạn</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={duration}
            disabled={Boolean(product)}
            onValueChange={(value) => {
              if (value) setDuration(value);
            }}
            aria-label="Thời hạn gói"
            className="flex-wrap justify-start"
          >
            <ToggleGroupItem value="once">Mua một lần</ToggleGroupItem>
            <ToggleGroupItem value="1">30 ngày</ToggleGroupItem>
            <ToggleGroupItem value="3">90 ngày</ToggleGroupItem>
            <ToggleGroupItem value="12">360 ngày</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {numericFields.map(([name, label, value]) => (
            <Field key={name}>
              <FieldLabel htmlFor={`package-${name}`}>{label}</FieldLabel>
              <Input
                id={`package-${name}`}
                name={name}
                type="number"
                min={name === 'priceVnd' ? 1 : 0}
                max={name === 'priceVnd' ? 2000000000 : 1000000}
                step={1}
                defaultValue={value}
                required
              />
            </Field>
          ))}
        </div>
        <Field>
          <FieldLabel htmlFor="package-reason">
            Lý do thay đổi{product ? ' (không bắt buộc)' : ''}
          </FieldLabel>
          <Textarea
            id="package-reason"
            name="reason"
            required={!product}
            minLength={3}
            maxLength={500}
          />
        </Field>
      </FieldGroup>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? 'Đang lưu…' : 'Lưu gói'}
      </Button>
    </form>
  );
}

export function AdminBillingCatalog() {
  const catalog = useAdminBillingList();
  const [selectedId, setSelectedId] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [availabilityTarget, setAvailabilityTarget] = React.useState<AdminBillingProduct | null>(
    null
  );
  const [availabilityError, setAvailabilityError] = React.useState('');
  const availability = useAdminBillingAvailability();
  const selected = useAdminBillingDetail(selectedId);

  async function changeAvailability(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!availabilityTarget) return;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    if (reason.length < 3) {
      setAvailabilityError('Vui lòng nhập lý do từ 3 ký tự.');
      return;
    }
    setAvailabilityError('');
    try {
      await availability.mutateAsync({
        productId: availabilityTarget.id,
        active: !availabilityTarget.active,
        version: availabilityTarget.version,
        reason,
      });
      toast.success(availabilityTarget.active ? 'Đã ngừng bán gói' : 'Đã mở bán gói');
      setAvailabilityTarget(null);
    } catch (error) {
      if (getApiErrorCode(error) === 'BILLING_PRODUCT_CONFLICT') {
        setAvailabilityError('Gói đã thay đổi. Đóng hộp thoại và tải lại danh sách.');
        void catalog.refetch();
      } else {
        setAvailabilityError(getApiErrorMessage(error, 'Không thể thay đổi trạng thái gói.'));
      }
    }
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="billing-catalog-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="billing-catalog-title" className="text-balance text-lg font-semibold">
            Gói tiện ích
          </h2>
          <p className="text-pretty text-sm text-muted-foreground">
            Xem giá và quyền lợi của các gói thành viên đang được cung cấp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreating(true)}>Tạo gói nháp</Button>
          <Button
            variant="outline"
            onClick={() => void catalog.refetch()}
            disabled={catalog.isFetching}
          >
            <RefreshCw data-icon="inline-start" /> Làm mới
          </Button>
        </div>
      </div>

      {/* <Alert>
        <CircleAlert />
        <AlertTitle>Chưa thể mở bán hoặc ngừng bán</AlertTitle>
        <AlertDescription>
          Bạn có thể tạo và sửa gói chưa mở bán. Thay đổi trạng thái bán chưa khả dụng; các gói đang
          bán chưa thể chỉnh sửa.
        </AlertDescription>
      </Alert> */}

      {catalog.isPending ? (
        <div className="grid gap-3" aria-label="Đang tải danh sách gói">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-28 w-full" />
          ))}
        </div>
      ) : catalog.isError ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Không tải được danh sách gói</AlertTitle>
          <AlertDescription>
            <p>{getApiErrorMessage(catalog.error, 'Chưa tải được danh sách gói.')}</p>
            <Button variant="outline" size="sm" onClick={() => void catalog.refetch()}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : catalog.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <PackageSearch className="size-6 text-muted-foreground" />
            <p className="font-medium">Chưa có gói tiện ích</p>
            <p className="text-sm text-muted-foreground">
              Danh mục sẽ xuất hiện ở đây khi có gói được cung cấp.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {catalog.data.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <Badge variant="secondary">
                      {product.durationMonths === null ? 'Mua một lần' : product.durationLabel}
                    </Badge>
                    <Badge variant="outline">{product.active ? 'Đang bán' : 'Chưa mở bán'}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {(product.durationMonths === null
                      ? product.benefitLabels
                      : product.periodBenefitLabels
                    ).join(' · ') || 'Chưa có quyền lợi'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold tabular-nums">{product.priceLabel}</span>
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(product.id)}>
                    Chi tiết<span className="sr-only"> {product.name}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedId(product.id);
                      setEditing(true);
                    }}
                  >
                    Chỉnh sửa<span className="sr-only"> {product.name}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvailabilityError('');
                      setAvailabilityTarget(product);
                    }}
                  >
                    {product.active ? 'Ngừng bán' : 'Mở bán'}
                    <span className="sr-only"> {product.name}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId('');
            setEditing(false);
          }
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected.data?.name ?? 'Chi tiết gói'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Chỉnh sửa giá và quyền lợi của gói.' : 'Thông tin và quyền lợi của gói.'}
            </DialogDescription>
          </DialogHeader>
          {selected.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : selected.isError ? (
            <p role="alert">
              {getApiErrorMessage(selected.error, 'Không tải được thông tin gói.')}
            </p>
          ) : editing ? (
            <ProductForm
              product={selected.data}
              onSaved={() => {
                setSelectedId('');
                setEditing(false);
              }}
            />
          ) : (
            <>
              <ProductDetails product={selected.data} />
              <Button onClick={() => setEditing(true)}>Chỉnh sửa gói</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={availabilityTarget !== null}
        onOpenChange={(open) => {
          if (!open && !availability.isPending) setAvailabilityTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{availabilityTarget?.active ? 'Ngừng bán gói' : 'Mở bán gói'}</DialogTitle>
            <DialogDescription>
              {availabilityTarget?.name}. Các đơn đã tạo giữ nguyên giá và quyền lợi.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => void changeAvailability(event)}
          >
            <Field>
              <FieldLabel htmlFor="availability-reason">Lý do thay đổi</FieldLabel>
              <Textarea
                id="availability-reason"
                name="reason"
                required
                minLength={3}
                maxLength={500}
              />
            </Field>
            {availabilityError && (
              <p role="alert" className="text-sm text-destructive">
                {availabilityError}
              </p>
            )}
            <Button type="submit" disabled={availability.isPending}>
              {availability.isPending
                ? 'Đang lưu…'
                : availabilityTarget?.active
                  ? 'Xác nhận ngừng bán'
                  : 'Xác nhận mở bán'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo gói nháp</DialogTitle>
            <DialogDescription>Gói mới chưa mở bán cho thành viên.</DialogDescription>
          </DialogHeader>
          <ProductForm product={null} onSaved={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
