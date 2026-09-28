import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIngredientsQuery } from '@/features/ingredient/queries/ingredient.queries';
import {
  pantryItemFormSchema,
  pantryUpdateFormSchema,
  type PantryItemFormData,
  type PantryUpdateFormData,
} from '../schemas/pantry.schema';
import type { PantryItem } from '../types/pantry.model';
import { pantryMapper } from '../mappers/pantry.mapper';
import {
  useCreatePantryItemMutation,
  useUpdatePantryItemMutation,
} from '../queries/pantry.queries';

interface PantryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: PantryItem | null;
}

export function PantryItemDialog({ open, onOpenChange, editingItem }: PantryItemDialogProps) {
  const isEditing = Boolean(editingItem);
  const [isCanonical, setIsCanonical] = useState(true);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const { data: ingredientsData } = useIngredientsQuery(
    ingredientSearch ? { q: ingredientSearch, limit: 20 } : { limit: 50 }
  );

  const createMutation = useCreatePantryItemMutation();
  const updateMutation = useUpdatePantryItemMutation();

  const createForm = useForm<PantryItemFormData>({
    resolver: zodResolver(pantryItemFormSchema) as any,
    defaultValues: {
      isCanonical: true,
      ingredientId: '',
      unmatchedText: '',
      quantity: 100,
      unit: 'g',
      confidence: 1,
      purchasedAt: new Date().toISOString().split('T')[0],
      openedAt: '',
      expiresAt: '',
      freshnessNote: '',
    },
  });

  const updateForm = useForm<PantryUpdateFormData>({
    resolver: zodResolver(pantryUpdateFormSchema) as any,
    defaultValues: {
      expectedVersion: 1,
      confidence: 1,
      purchasedAt: '',
      openedAt: '',
      expiresAt: '',
      freshnessNote: '',
    },
  });

  useEffect(() => {
    if (editingItem) {
      updateForm.reset({
        expectedVersion: editingItem.version,
        confidence: editingItem.confidence,
        purchasedAt: editingItem.purchasedAt || '',
        openedAt: editingItem.openedAt || '',
        expiresAt: editingItem.expiresAt || '',
        freshnessNote: editingItem.freshnessNote || '',
      });
    } else {
      createForm.reset({
        isCanonical: true,
        ingredientId: '',
        unmatchedText: '',
        quantity: 100,
        unit: 'g',
        confidence: 1,
        purchasedAt: new Date().toISOString().split('T')[0],
        openedAt: '',
        expiresAt: '',
        freshnessNote: '',
      });
      setIsCanonical(true);
      setIngredientSearch('');
    }
  }, [editingItem, open, createForm, updateForm]);

  const handleCreateSubmit = createForm.handleSubmit(async (data) => {
    const idempotencyKey = `pantry-create-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const payload = pantryMapper.toCreateDto(data, idempotencyKey);
    await createMutation.mutateAsync(payload);
    onOpenChange(false);
  });

  const handleUpdateSubmit = updateForm.handleSubmit(async (data) => {
    if (!editingItem) return;
    const payload = pantryMapper.toUpdateDto(data);
    await updateMutation.mutateAsync({ id: editingItem.id, payload });
    onOpenChange(false);
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Sửa thông tin "${editingItem?.displayName}"`
              : 'Thêm nguyên liệu vào tủ bếp'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật ngày mua, ngày mở bao bì, hạn sử dụng và quan sát độ tươi.'
              : 'Ghi nhận thực phẩm có sẵn trong tủ bếp gia đình để tối ưu kế hoạch nấu nướng.'}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleUpdateSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="purchasedAt" className="text-xs">
                  Ngày mua
                </Label>
                <Input id="purchasedAt" type="date" {...updateForm.register('purchasedAt')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="openedAt" className="text-xs">
                  Ngày mở bao bì
                </Label>
                <Input id="openedAt" type="date" {...updateForm.register('openedAt')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiresAt" className="text-xs font-semibold">
                Hạn sử dụng (quan sát trên bao bì)
              </Label>
              <Input id="expiresAt" type="date" {...updateForm.register('expiresAt')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="freshnessNote" className="text-xs">
                Ghi chú độ tươi ngon
              </Label>
              <Textarea
                id="freshnessNote"
                placeholder="Ví dụ: Đã để ngăn mát tủ lạnh, bao bì còn kín..."
                rows={2}
                {...updateForm.register('freshnessNote')}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Nguyên liệu từ từ điển chuẩn</Label>
                <p className="text-[11px] text-muted-foreground">
                  {isCanonical
                    ? 'Hệ thống tự động quy đổi gam chuẩn hóa'
                    : 'Nhập tên nguyên liệu tự do nếu chưa có'}
                </p>
              </div>
              <Switch
                checked={isCanonical}
                onCheckedChange={(checked) => {
                  setIsCanonical(checked);
                  createForm.setValue('isCanonical', checked);
                  if (checked) {
                    createForm.setValue('unmatchedText', '');
                    createForm.clearErrors('unmatchedText');
                  } else {
                    createForm.setValue('ingredientId', '');
                    createForm.clearErrors('ingredientId');
                  }
                }}
              />
            </div>

            {isCanonical ? (
              <div className="space-y-1.5">
                <Label htmlFor="ingredientSelect" className="text-xs">
                  Chọn nguyên liệu chuẩn <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={createForm.watch('ingredientId')}
                  onValueChange={(val) => {
                    createForm.setValue('ingredientId', val);
                    createForm.clearErrors('ingredientId');
                  }}
                >
                  <SelectTrigger id="ingredientSelect">
                    <SelectValue placeholder="Chọn nguyên liệu từ danh mục..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {ingredientsData?.items?.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.canonicalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.ingredientId && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.ingredientId.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="unmatchedText" className="text-xs">
                  Tên nguyên liệu tự do <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unmatchedText"
                  placeholder="Ví dụ: Nấm hương rừng, Rau thơm hữu cơ..."
                  {...createForm.register('unmatchedText')}
                />
                {createForm.formState.errors.unmatchedText && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.unmatchedText.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs">
                  Số lượng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  min="0.01"
                  {...createForm.register('quantity', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit" className="text-xs">
                  Đơn vị <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="unit"
                  placeholder="g, kg, ml, bó, quả..."
                  {...createForm.register('unit')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="createPurchasedAt" className="text-xs">
                  Ngày mua
                </Label>
                <Input id="createPurchasedAt" type="date" {...createForm.register('purchasedAt')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="createExpiresAt" className="text-xs">
                  Hạn sử dụng
                </Label>
                <Input id="createExpiresAt" type="date" {...createForm.register('expiresAt')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="createFreshnessNote" className="text-xs">
                Ghi chú độ tươi
              </Label>
              <Textarea
                id="createFreshnessNote"
                placeholder="Ghi chú thêm về trạng thái thực phẩm..."
                rows={2}
                {...createForm.register('freshnessNote')}
              />
            </div>

            <div className="rounded-md bg-muted/50 p-2.5 text-[11px] text-muted-foreground flex items-start gap-1.5">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                💡 Lưu ý:
              </span>
              <span>
                Mỗi lần nhập sẽ tạo một thẻ riêng theo từng đợt mua. Nếu đã có nguyên liệu này trong
                tủ bếp, bạn có thể dùng tính năng{' '}
                <strong className="text-foreground">"Gộp trùng lặp"</strong> trên màn hình chính để
                cộng dồn tồn kho.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? 'Đang thêm...' : 'Thêm vào tủ bếp'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
