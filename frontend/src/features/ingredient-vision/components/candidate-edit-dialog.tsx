'use client';

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
import { Loader2, Search } from 'lucide-react';
import { useIngredientsQuery } from '@/features/ingredient/queries/ingredient.queries';
import {
  updateCandidateFormSchema,
  type UpdateCandidateFormData,
} from '../schemas/ingredient-recognition.schema';
import { useUpdateCandidateMutation } from '../queries/ingredient-recognition.queries';
import type { RecognitionCandidate } from '../types/ingredient-recognition.model';

interface CandidateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: RecognitionCandidate | null;
  jobId: string;
}

const COMMON_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'quả',
  'củ',
  'gói',
  'hộp',
  'bó',
  'tép',
  'cây',
  'miếng',
  'thìa',
  'muỗng',
];

export function CandidateEditDialog({
  open,
  onOpenChange,
  candidate,
  jobId,
}: CandidateEditDialogProps) {
  const [isCanonical, setIsCanonical] = useState(true);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const { data: ingredientsData } = useIngredientsQuery(
    ingredientSearch ? { q: ingredientSearch, limit: 20 } : { limit: 50 }
  );

  const updateMutation = useUpdateCandidateMutation();

  const form = useForm<UpdateCandidateFormData>({
    resolver: zodResolver(updateCandidateFormSchema),
    defaultValues: {
      expectedVersion: 1,
      ingredientId: null,
      detectedName: '',
      quantity: null,
      unit: '',
      freshnessObservation: '',
      decision: 'KEEP',
    },
  });

  useEffect(() => {
    if (candidate && open) {
      const hasSuggestion = Boolean(candidate.ingredientSuggestion?.id);
      setIsCanonical(hasSuggestion);

      form.reset({
        expectedVersion: candidate.version,
        ingredientId: candidate.ingredientSuggestion?.id || null,
        detectedName: candidate.name || '',
        quantity: candidate.quantity.value ?? null,
        unit: candidate.quantity.unit || '',
        freshnessObservation: candidate.freshnessObservation || '',
        decision: 'KEEP',
      });
    }
  }, [candidate, open, form]);

  const handleSubmit = async (values: UpdateCandidateFormData) => {
    if (!candidate) return;

    try {
      await updateMutation.mutateAsync({
        jobId,
        candidateId: candidate.id,
        input: {
          expectedVersion: candidate.version,
          ingredientId: isCanonical ? values.ingredientId : null,
          detectedName: values.detectedName,
          quantity: values.quantity ?? null,
          unit: values.unit || null,
          freshnessObservation: values.freshnessObservation || null,
          decision: 'KEEP',
        },
      });

      onOpenChange(false);
    } catch {
      // Đã có toast error từ api/mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa nguyên liệu nhận diện</DialogTitle>
          <DialogDescription>
            Hiệu chỉnh lại tên, liên kết từ điển chuẩn và số lượng trước khi xác nhận vào tủ bếp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
          {/* Chế độ chọn nguyên liệu chuẩn vs Tự do */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Khớp với từ điển chuẩn</Label>
              <p className="text-xs text-muted-foreground">
                Giúp hệ thống tự động tính toán dinh dưỡng và gợi ý công thức
              </p>
            </div>
            <Switch
              checked={isCanonical}
              onCheckedChange={(checked) => {
                setIsCanonical(checked);
                if (!checked) {
                  form.setValue('ingredientId', null);
                }
              }}
            />
          </div>

          {/* Chọn nguyên liệu chuẩn */}
          {isCanonical ? (
            <div className="space-y-2">
              <Label htmlFor="ingredient-select">Chọn nguyên liệu chuẩn *</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm trong từ điển nguyên liệu..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>

                <Select
                  value={form.watch('ingredientId') || ''}
                  onValueChange={(val) => {
                    form.setValue('ingredientId', val);
                    const selected = ingredientsData?.items.find((i) => i.id === val);
                    if (selected) {
                      form.setValue('detectedName', selected.canonicalName);
                    }
                  }}
                >
                  <SelectTrigger id="ingredient-select">
                    <SelectValue placeholder="-- Chọn từ danh sách --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[220px]">
                    {ingredientsData?.items.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.canonicalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="detected-name">Tên nguyên liệu tự do *</Label>
              <Input
                id="detected-name"
                placeholder="Ví dụ: Nấm hương rừng, Chả lụa chay..."
                {...form.register('detectedName')}
              />
              {form.formState.errors.detectedName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.detectedName.message}
                </p>
              )}
            </div>
          )}

          {/* Số lượng & Đơn vị */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="candidate-quantity">Số lượng</Label>
              <Input
                id="candidate-quantity"
                type="number"
                step="any"
                min="0"
                placeholder="Ví dụ: 300"
                {...form.register('quantity', {
                  setValueAs: (v) => (v === '' || isNaN(Number(v)) ? null : Number(v)),
                })}
              />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="candidate-unit">Đơn vị</Label>
              <div className="flex gap-2">
                <Input
                  id="candidate-unit"
                  placeholder="g, kg, quả..."
                  {...form.register('unit', {
                    setValueAs: (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
                  })}
                />
                <Select onValueChange={(val) => form.setValue('unit', val)}>
                  <SelectTrigger className="w-[85px] shrink-0">
                    <SelectValue placeholder="Gợi ý" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {COMMON_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.formState.errors.unit && (
                <p className="text-xs text-destructive">{form.formState.errors.unit.message}</p>
              )}
            </div>
          </div>

          {/* Ghi chú độ tươi */}
          <div className="space-y-1.5">
            <Label htmlFor="candidate-freshness">Ghi chú độ tươi / quan sát</Label>
            <Textarea
              id="candidate-freshness"
              rows={2}
              placeholder="Ví dụ: Còn tươi, vỏ hơi nhăn, để ngăn mát..."
              {...form.register('freshnessObservation', {
                setValueAs: (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
              })}
            />
            {form.formState.errors.freshnessObservation && (
              <p className="text-xs text-destructive">
                {form.formState.errors.freshnessObservation.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
