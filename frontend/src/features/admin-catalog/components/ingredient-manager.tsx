'use client';

import * as React from 'react';
import { Archive, Pencil, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useAdminIngredientsQuery,
  useArchiveIngredientMutation,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
} from '../queries/admin-ingredient.queries';
import type { Ingredient } from '@/features/ingredient/types/ingredient.model';
import { CatalogStatus, DietPattern, FoodGroup, Tradition } from '@/common/enums';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
import { useDebounce } from '@/hooks/useDebounce';
import { AliasEditor } from './alias-editor';

const FOOD_GROUP_OPTIONS = [
  { value: 'ALL', label: 'Mọi nhóm' },
  { value: FoodGroup.GRAINS, label: 'Ngũ cốc' },
  { value: FoodGroup.LEGUMES, label: 'Đậu' },
  { value: FoodGroup.VEGETABLES, label: 'Rau' },
  { value: FoodGroup.FRUITS, label: 'Trái cây' },
  { value: FoodGroup.NUTS_SEEDS, label: 'Hạt' },
  { value: FoodGroup.MUSHROOMS, label: 'Nấm' },
  { value: FoodGroup.DAIRY_EGGS, label: 'Trứng sữa' },
  { value: FoodGroup.HERBS_SPICES, label: 'Thảo mộc – gia vị' },
  { value: FoodGroup.OTHER, label: 'Khác' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Mọi trạng thái' },
  { value: CatalogStatus.ACTIVE, label: 'Đang hoạt động' },
  { value: CatalogStatus.ARCHIVED, label: 'Đã lưu trữ' },
];

const DIET_PATTERNS = [DietPattern.VEGAN, DietPattern.LACTO_OVO];
const TRADITIONS = [Tradition.NONE, Tradition.BUDDHIST, Tradition.CHRISTIAN];

/**
 * Quản trị nguyên liệu: list (gồm archived) + tạo/sửa + archive + alias.
 * Form luôn preload đủ 3 mảng metadata vì PATCH là full snapshot.
 */
export function IngredientManager() {
  const [q, setQ] = React.useState('');
  const [foodGroup, setFoodGroup] = React.useState<string>('ALL');
  const [status, setStatus] = React.useState<string>('ALL');
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Ingredient | null>(null);
  const [archiveTarget, setArchiveTarget] = React.useState<Ingredient | null>(null);

  const [canonicalName, setCanonicalName] = React.useState('');
  const [formFoodGroup, setFormFoodGroup] = React.useState<FoodGroup>(FoodGroup.OTHER);
  const [allergenInput, setAllergenInput] = React.useState('');
  const [allergenCodes, setAllergenCodes] = React.useState<string[]>([]);
  const [compat, setCompat] = React.useState<Array<{ dietPattern: string; compatible: boolean }>>(
    []
  );
  const [warnings, setWarnings] = React.useState<
    Array<{ tradition: string; warningCode: string; label: string }>
  >([]);
  const [warnTradition, setWarnTradition] = React.useState<string>(Tradition.NONE);
  const [warnCode, setWarnCode] = React.useState('');
  const [warnLabel, setWarnLabel] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  // Debounce ô tìm kiếm để tránh spam request theo từng ký tự.
  const debouncedQ = useDebounce(q.trim(), 400);
  const listQuery = useAdminIngredientsQuery({
    page,
    limit: 10,
    ...(debouncedQ.length > 0 ? { q: debouncedQ } : {}),
    ...(foodGroup !== 'ALL' ? { foodGroup } : {}),
    ...(status !== 'ALL' ? { status } : {}),
  });
  const createMutation = useCreateIngredientMutation();
  const updateMutation = useUpdateIngredientMutation();
  const archiveMutation = useArchiveIngredientMutation();

  const resetPage = () => setPage(1);

  const openCreate = () => {
    setEditing(null);
    setCanonicalName('');
    setFormFoodGroup(FoodGroup.OTHER);
    setAllergenCodes([]);
    setAllergenInput('');
    setCompat(DIET_PATTERNS.map((dietPattern) => ({ dietPattern, compatible: true })));
    setWarnings([]);
    setWarnTradition(Tradition.NONE);
    setWarnCode('');
    setWarnLabel('');
    setFormError(null);
    setFieldError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditing(item);
    setCanonicalName(item.canonicalName);
    setFormFoodGroup(item.foodGroup);
    setAllergenCodes([...item.allergenCodes]);
    setAllergenInput('');
    setCompat(
      item.dietCompatibilities.length > 0
        ? item.dietCompatibilities.map((c) => ({ ...c }))
        : DIET_PATTERNS.map((dietPattern) => ({ dietPattern, compatible: true }))
    );
    setWarnings(item.traditionWarnings.map((w) => ({ ...w })));
    setWarnTradition(Tradition.NONE);
    setWarnCode('');
    setWarnLabel('');
    setFormError(null);
    setFieldError(null);
    setDialogOpen(true);
  };

  const addAllergen = () => {
    const code = allergenInput.trim().toUpperCase();
    if (code.length === 0) return;
    if (!allergenCodes.includes(code)) setAllergenCodes((prev) => [...prev, code]);
    setAllergenInput('');
  };

  const addWarning = () => {
    if (warnCode.trim().length === 0 || warnLabel.trim().length === 0) {
      setFormError('Cảnh báo truyền thống cần đủ mã và nhãn.');
      return;
    }
    setWarnings((prev) => [
      ...prev,
      { tradition: warnTradition, warningCode: warnCode.trim(), label: warnLabel.trim() },
    ]);
    setWarnCode('');
    setWarnLabel('');
    setFormError(null);
  };

  const mapBackendError = (error: unknown): boolean => {
    const code = getApiErrorCode(error);
    if (code === 'INGREDIENT_NAME_CONFLICT') {
      setFieldError('Tên chuẩn đã tồn tại (kể cả khác dấu). Hãy dùng tên khác.');
      return true;
    }
    if (code === 'INVALID_CATALOG_NAME') {
      setFieldError('Tên không chuẩn hóa được tên hợp lệ. Hãy nhập tên khác.');
      return true;
    }
    if (code === 'INVALID_INGREDIENT_METADATA') {
      setFormError('Metadata dị ứng/diet/truyền thống không hợp lệ. Hãy kiểm tra lại các mục.');
      return true;
    }
    if (code === 'CATALOG_REFERENCE_CONFLICT') {
      setFormError('Dữ liệu catalog đã đổi ở nơi khác. Hãy tải lại danh sách rồi làm lại.');
      void listQuery.refetch();
      return true;
    }
    if (code === 'VALIDATION_ERROR') {
      const fields = getApiErrorFields(error);
      const first = fields
        ? Object.values(fields)
            .flat()
            .find((v) => typeof v === 'string')
        : undefined;
      setFormError(
        typeof first === 'string' ? first : 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.'
      );
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFieldError(null);
    if (canonicalName.trim().length === 0) {
      setFieldError('Vui lòng nhập tên chuẩn.');
      return;
    }
    // Gửi full snapshot 3 mảng metadata (trường vắng = đã xóa ở backend).
    const payload = {
      canonicalName: canonicalName.trim(),
      foodGroup: formFoodGroup,
      allergenCodes,
      dietCompatibilities: compat,
      traditionWarnings: warnings,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (error) {
      if (!mapBackendError(error)) setFormError('Lưu nguyên liệu thất bại. Vui lòng thử lại.');
    }
  };

  const handleArchive = async (item: Ingredient) => {
    try {
      await archiveMutation.mutateAsync(item.id);
      setArchiveTarget(null);
    } catch {
      // Interceptor/toast đã xử lý chung; giữ dialog mở để thử lại, tránh toast đè.
    }
  };

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.metadata;
  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Nguyên liệu ({meta?.totalItems ?? 0})</CardTitle>
            <Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}>
              Tạo nguyên liệu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                resetPage();
              }}
              placeholder="Tìm theo tên (có/không dấu)..."
              aria-label="Tìm nguyên liệu"
              className="sm:max-w-xs"
            />
            <Select
              value={foodGroup}
              onValueChange={(v) => {
                setFoodGroup(v);
                resetPage();
              }}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Nhóm" />
              </SelectTrigger>
              <SelectContent>
                {FOOD_GROUP_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                resetPage();
              }}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {listQuery.isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
          {listQuery.isError && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between gap-2">
                Không tải được danh sách.
                <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!listQuery.isLoading && !listQuery.isError && items.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Chưa có nguyên liệu nào khớp.
            </p>
          )}

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.canonicalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.foodGroupLabel} ·{' '}
                        {item.status === CatalogStatus.ACTIVE ? 'Đang hoạt động' : 'Đã lưu trữ'} ·{' '}
                        {item.aliases.length} tên gọi khác
                      </p>
                    </div>
                    <div className="inline-flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Sửa ${item.canonicalName}`}
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {item.status === CatalogStatus.ACTIVE && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Lưu trữ ${item.canonicalName}`}
                          disabled={archiveMutation.isPending}
                          onClick={() => setArchiveTarget(item)}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 border-t pt-3">
                    <AliasEditor ingredient={item} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <span className="text-muted-foreground">
                Trang {page}/{meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa nguyên liệu' : 'Tạo nguyên liệu mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ing-name">Tên chuẩn</Label>
                <Input
                  id="ing-name"
                  value={canonicalName}
                  onChange={(e) => setCanonicalName(e.target.value)}
                  placeholder="Ví dụ: Đậu phộng"
                />
                {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nhóm thực phẩm</Label>
                <Select
                  value={formFoodGroup}
                  onValueChange={(v) => setFormFoodGroup(v as FoodGroup)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOOD_GROUP_OPTIONS.filter((o) => o.value !== 'ALL').map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Mã dị ứng</Label>
              <div className="flex flex-wrap gap-1.5">
                {allergenCodes.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1 rounded-full text-[11px]">
                    {c}
                    <button
                      type="button"
                      aria-label={`Xóa mã ${c}`}
                      onClick={() => setAllergenCodes((prev) => prev.filter((x) => x !== c))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={allergenInput}
                  onChange={(e) => setAllergenInput(e.target.value)}
                  placeholder="Thêm mã, vd: PEANUT (Enter để thêm)"
                  aria-label="Mã dị ứng mới"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergen();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addAllergen}>
                  Thêm
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tương thích diet</Label>
              {compat.map((c, i) => (
                <label
                  key={c.dietPattern}
                  className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm"
                >
                  <span>{c.dietPattern}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    Tương thích
                    <Checkbox
                      checked={c.compatible}
                      onCheckedChange={(v) =>
                        setCompat((prev) =>
                          prev.map((x, xi) => (xi === i ? { ...x, compatible: v === true } : x))
                        )
                      }
                    />
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Cảnh báo truyền thống</Label>
              {warnings.map((w, i) => (
                <div
                  key={`${w.tradition}-${w.warningCode}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm"
                >
                  <span>
                    {w.tradition} · {w.warningCode} · {w.label}
                  </span>
                  <button
                    type="button"
                    aria-label="Xóa cảnh báo"
                    onClick={() => setWarnings((prev) => prev.filter((_, xi) => xi !== i))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Select value={warnTradition} onValueChange={setWarnTradition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Truyền thống" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADITIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={warnCode}
                  onChange={(e) => setWarnCode(e.target.value)}
                  placeholder="Mã, vd: W1"
                  aria-label="Mã cảnh báo"
                />
                <Input
                  value={warnLabel}
                  onChange={(e) => setWarnLabel(e.target.value)}
                  placeholder="Nhãn cảnh báo"
                  aria-label="Nhãn cảnh báo"
                />
                <Button type="button" variant="outline" onClick={addWarning}>
                  Thêm
                </Button>
              </div>
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
              Hủy
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={pending}>
              {pending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveTarget !== null} onOpenChange={(v) => !v && setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lưu trữ &quot;{archiveTarget?.canonicalName}&quot;?</DialogTitle>
            <DialogDescription>
              Nguyên liệu sẽ biến mất khỏi danh sách public và kết quả phân giải, nhưng vẫn còn
              trong danh sách admin với trạng thái đã lưu trữ. Thao tác này không thể hoàn tác ở
              MVP.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveTarget(null)}
              disabled={archiveMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={() => archiveTarget && void handleArchive(archiveTarget)}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Đang lưu trữ...' : 'Xác nhận lưu trữ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
