'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  useCreateAdminRecordMutation,
  useReplaceAdminRecordMutation,
} from '../queries/food-data.queries';
import type { FoodDataRecordKind, AdminRecordItem } from '../types/food-data.model';

const KIND_OPTIONS: { value: FoodDataRecordKind; label: string }[] = [
  { value: 'NUTRIENT', label: 'Định nghĩa Vi chất (NUTRIENT)' },
  { value: 'SOURCE', label: 'Nguồn dữ liệu (SOURCE)' },
  { value: 'COOKING_METHOD', label: 'Phương pháp nấu nướng (COOKING_METHOD)' },
  { value: 'INTERACTION_RULE', label: 'Quy tắc kiêng kỵ (INTERACTION_RULE)' },
  { value: 'REFERENCE_INTAKE', label: 'Nhu cầu khuyến nghị (REFERENCE_INTAKE)' },
  { value: 'INGREDIENT_GUIDELINE', label: 'Hướng dẫn an toàn (INGREDIENT_GUIDELINE)' },
  { value: 'HOUSEHOLD_CONVERSION', label: 'Quy đổi gia đình (HOUSEHOLD_CONVERSION)' },
  { value: 'RETENTION_FACTOR', label: 'Hệ số bảo tồn (RETENTION_FACTOR)' },
  { value: 'YIELD_FACTOR', label: 'Hệ số hao hụt (YIELD_FACTOR)' },
  { value: 'INGREDIENT_PROFILE', label: 'Hồ sơ nguyên liệu (INGREDIENT_PROFILE)' },
  { value: 'NUTRIENT_VALUE', label: 'Giá trị dinh dưỡng (NUTRIENT_VALUE)' },
];

const nutrientSchema = z.object({
  code: z.string().min(2, 'Mã vi chất tối thiểu 2 ký tự').toUpperCase(),
  name: z.string().min(2, 'Tên vi chất tối thiểu 2 ký tự'),
  defaultUnit: z.string().min(1, 'Vui lòng nhập đơn vị chuẩn (vd: g, mg, mcg)'),
  unitDimension: z.enum(['MASS', 'ENERGY', 'VOLUME', 'COUNT', 'INTERNATIONAL_UNIT']),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

const sourceSchema = z.object({
  code: z.string().min(2, 'Mã nguồn tối thiểu 2 ký tự').toUpperCase(),
  name: z.string().min(2, 'Tên nguồn tối thiểu 2 ký tự'),
  provider: z.string().min(2, 'Tên cơ quan / tổ chức cung cấp'),
  sourceVersion: z.string().min(1, 'Phiên bản nguồn'),
  licenseName: z.string().min(1, 'Giấy phép bản quyền'),
  sourceUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  effectiveFrom: z.string().min(4, 'Ngày hiệu lực (YYYY-MM-DD)'),
});

const cookingMethodSchema = z.object({
  code: z.string().min(2, 'Mã phương pháp tối thiểu 2 ký tự').toUpperCase(),
  name: z.string().min(2, 'Tên phương pháp tối thiểu 2 ký tự'),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

const interactionRuleSchema = z.object({
  ingredientAId: z.string().uuid('ID nguyên liệu A phải là UUID hợp lệ'),
  ingredientBId: z.string().uuid('ID nguyên liệu B phải là UUID hợp lệ'),
  scope: z.enum(['SAME_DISH', 'SAME_MEAL', 'SAME_DAY']),
  severity: z.enum(['WARNING', 'NOTICE', 'COMPATIBLE']),
  evidenceGrade: z.enum(['STRONG', 'MODERATE', 'PRELIMINARY', 'INSUFFICIENT']),
  explanation: z.string().min(5, 'Cơ chế giải thích khoa học tối thiểu 5 ký tự'),
  suggestedAction: z.string().optional(),
});

interface AdminRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: FoodDataRecordKind;
  record?: AdminRecordItem | null;
  onSuccess?: () => void;
}

export const AdminRecordDialog: React.FC<AdminRecordDialogProps> = ({
  open,
  onOpenChange,
  initialKind = 'NUTRIENT',
  record,
  onSuccess,
}) => {
  const [kind, setKind] = useState<FoodDataRecordKind>(initialKind);
  const [useJsonMode, setUseJsonMode] = useState<boolean>(false);
  const [rawJson, setRawJson] = useState<string>('{}');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = Boolean(record);

  const createMutation = useCreateAdminRecordMutation();
  const replaceMutation = useReplaceAdminRecordMutation();

  // Active form for NUTRIENT
  const nutrientForm = useForm({
    resolver: zodResolver(nutrientSchema),
    defaultValues: {
      code: '',
      name: '',
      defaultUnit: 'g',
      unitDimension: 'MASS' as const,
      description: '',
      active: true,
    },
  });

  // Active form for SOURCE
  const sourceForm = useForm({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      code: '',
      name: '',
      provider: '',
      sourceVersion: 'v1.0',
      licenseName: 'Public Domain',
      sourceUrl: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
    },
  });

  // Active form for COOKING_METHOD
  const cookingForm = useForm({
    resolver: zodResolver(cookingMethodSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      active: true,
    },
  });

  // Active form for INTERACTION_RULE
  const interactionForm = useForm({
    resolver: zodResolver(interactionRuleSchema),
    defaultValues: {
      ingredientAId: '',
      ingredientBId: '',
      scope: 'SAME_DISH' as const,
      severity: 'WARNING' as const,
      evidenceGrade: 'STRONG' as const,
      explanation: '',
      suggestedAction: '',
    },
  });

  // Populate data when dialog opens or record changes
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      if (record) {
        setKind(record.kind);
        const details = record.rawDetails || {};
        setRawJson(JSON.stringify(details, null, 2));

        if (record.kind === 'NUTRIENT') {
          nutrientForm.reset({
            code: (details.code as string) || record.codeOrId || '',
            name: (details.name as string) || record.displayName || '',
            defaultUnit: (details.defaultUnit as string) || 'g',
            unitDimension: (details.unitDimension as 'MASS') || 'MASS',
            description: (details.description as string) || '',
            active: details.active !== false,
          });
        } else if (record.kind === 'SOURCE') {
          sourceForm.reset({
            code: (details.code as string) || record.codeOrId || '',
            name: (details.name as string) || record.displayName || '',
            provider: (details.provider as string) || '',
            sourceVersion: (details.sourceVersion as string) || 'v1.0',
            licenseName: (details.licenseName as string) || 'Open Access',
            sourceUrl: (details.sourceUrl as string) || '',
            effectiveFrom: (details.effectiveFrom as string) || record.effectiveFrom || '',
          });
        } else if (record.kind === 'COOKING_METHOD') {
          cookingForm.reset({
            code: (details.code as string) || record.codeOrId || '',
            name: (details.name as string) || record.displayName || '',
            description: (details.description as string) || '',
            active: details.active !== false,
          });
        } else {
          setUseJsonMode(true);
        }
      } else {
        setKind(initialKind);
        setUseJsonMode(false);
        setRawJson('{}');
        nutrientForm.reset();
        sourceForm.reset();
        cookingForm.reset();
        interactionForm.reset();
      }
    }
  }, [open, record, initialKind]);

  const handleSave = async () => {
    setErrorMessage(null);
    let payloadData: Record<string, unknown> = {};

    try {
      if (
        useJsonMode ||
        !['NUTRIENT', 'SOURCE', 'COOKING_METHOD', 'INTERACTION_RULE'].includes(kind)
      ) {
        try {
          payloadData = JSON.parse(rawJson);
        } catch {
          setErrorMessage('Định dạng JSON không hợp lệ. Vui lòng kiểm tra dấu ngoặc và cú pháp.');
          return;
        }
      } else if (kind === 'NUTRIENT') {
        const valid = await nutrientForm.trigger();
        if (!valid) return;
        payloadData = nutrientForm.getValues();
      } else if (kind === 'SOURCE') {
        const valid = await sourceForm.trigger();
        if (!valid) return;
        payloadData = sourceForm.getValues();
      } else if (kind === 'COOKING_METHOD') {
        const valid = await cookingForm.trigger();
        if (!valid) return;
        payloadData = cookingForm.getValues();
      } else if (kind === 'INTERACTION_RULE') {
        const valid = await interactionForm.trigger();
        if (!valid) return;
        payloadData = interactionForm.getValues();
      }

      if (isEditing && record) {
        await replaceMutation.mutateAsync({
          id: record.id,
          input: { kind, data: payloadData },
        });
        toast.success(`Đã cập nhật thay thế bản ghi ${record.displayName || record.id}`);
      } else {
        await createMutation.mutateAsync({
          kind,
          data: payloadData,
        });
        toast.success(`Đã tạo mới bản ghi ${kind} thành công`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu bản ghi.';
      setErrorMessage(msg);
    }
  };

  const isSubmitting = createMutation.isPending || replaceMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Cập nhật bản ghi dinh dưỡng' : 'Tạo mới bản ghi dinh dưỡng'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Chỉnh sửa thay thế (replace) toàn diện cho bản ghi ID: ${record?.id}`
              : 'Nhập thông tin bản ghi dữ liệu chuẩn theo phân loại chuyên biệt.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-2">
          {/* Kind Selector */}
          <div className="space-y-1.5">
            <Label>Phân loại bản ghi (Record Kind)</Label>
            <Select
              disabled={isEditing}
              value={kind}
              onValueChange={(val) => setKind(val as FoodDataRecordKind)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phân loại" />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle JSON Mode */}
          <div className="flex items-center justify-between border-t border-b py-2 text-sm">
            <Label htmlFor="json-mode" className="cursor-pointer">
              Chế độ chỉnh sửa JSON nâng cao
            </Label>
            <Switch id="json-mode" checked={useJsonMode} onCheckedChange={setUseJsonMode} />
          </div>

          {/* Raw JSON Mode */}
          {useJsonMode ||
          !['NUTRIENT', 'SOURCE', 'COOKING_METHOD', 'INTERACTION_RULE'].includes(kind) ? (
            <div className="space-y-1.5">
              <Label>Dữ liệu bản ghi (JSON object payload)</Label>
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                placeholder='{\n  "code": "EXAMPLE",\n  "name": "Tên mẫu"\n}'
              />
            </div>
          ) : (
            <>
              {/* Specialized Form: NUTRIENT */}
              {kind === 'NUTRIENT' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Mã vi chất (Code)</Label>
                      <Input {...nutrientForm.register('code')} placeholder="vd: VITAMIN_B12" />
                      {nutrientForm.formState.errors.code && (
                        <p className="text-xs text-destructive">
                          {nutrientForm.formState.errors.code.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tên vi chất (Name)</Label>
                      <Input
                        {...nutrientForm.register('name')}
                        placeholder="vd: Vitamin B12 (Cobalamin)"
                      />
                      {nutrientForm.formState.errors.name && (
                        <p className="text-xs text-destructive">
                          {nutrientForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Đơn vị mặc định</Label>
                      <Input
                        {...nutrientForm.register('defaultUnit')}
                        placeholder="vd: mcg, mg, g"
                      />
                      {nutrientForm.formState.errors.defaultUnit && (
                        <p className="text-xs text-destructive">
                          {nutrientForm.formState.errors.defaultUnit.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Thứ nguyên (Dimension)</Label>
                      <Controller
                        control={nutrientForm.control}
                        name="unitDimension"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn thứ nguyên" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MASS">Khối lượng (MASS)</SelectItem>
                              <SelectItem value="ENERGY">Năng lượng (ENERGY)</SelectItem>
                              <SelectItem value="VOLUME">Thể tích (VOLUME)</SelectItem>
                              <SelectItem value="COUNT">Số đếm (COUNT)</SelectItem>
                              <SelectItem value="INTERNATIONAL_UNIT">
                                Đơn vị quốc tế (IU)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Mô tả dinh dưỡng</Label>
                    <Textarea
                      {...nutrientForm.register('description')}
                      placeholder="Mô tả chức năng sinh học hoặc lưu ý..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <Label htmlFor="nutrient-active">Kích hoạt hoạt động</Label>
                    <Controller
                      control={nutrientForm.control}
                      name="active"
                      render={({ field }) => (
                        <Switch
                          id="nutrient-active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Specialized Form: SOURCE */}
              {kind === 'SOURCE' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Mã nguồn (Code)</Label>
                      <Input {...sourceForm.register('code')} placeholder="vd: USDA, NIN_VN" />
                      {sourceForm.formState.errors.code && (
                        <p className="text-xs text-destructive">
                          {sourceForm.formState.errors.code.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phiên bản (Version)</Label>
                      <Input {...sourceForm.register('sourceVersion')} placeholder="vd: v2024.1" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Tên nguồn đầy đủ</Label>
                    <Input
                      {...sourceForm.register('name')}
                      placeholder="vd: Viện Dinh Dưỡng Quốc Gia 2017"
                    />
                    {sourceForm.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {sourceForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Cơ quan cung cấp</Label>
                      <Input {...sourceForm.register('provider')} placeholder="vd: Bộ Y Tế / NIN" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Giấy phép bản quyền</Label>
                      <Input {...sourceForm.register('licenseName')} placeholder="vd: Open Data" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>URL nguồn gốc</Label>
                      <Input {...sourceForm.register('sourceUrl')} placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ngày hiệu lực</Label>
                      <Input {...sourceForm.register('effectiveFrom')} type="date" />
                    </div>
                  </div>
                </div>
              )}

              {/* Specialized Form: COOKING_METHOD */}
              {kind === 'COOKING_METHOD' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Mã phương pháp</Label>
                      <Input {...cookingForm.register('code')} placeholder="vd: STEAMING" />
                      {cookingForm.formState.errors.code && (
                        <p className="text-xs text-destructive">
                          {cookingForm.formState.errors.code.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tên hiển thị</Label>
                      <Input {...cookingForm.register('name')} placeholder="vd: Hấp cách thủy" />
                      {cookingForm.formState.errors.name && (
                        <p className="text-xs text-destructive">
                          {cookingForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Mô tả phương pháp</Label>
                    <Textarea
                      {...cookingForm.register('description')}
                      placeholder="Mô tả tác động nhiệt, cách thực hiện..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <Label htmlFor="cooking-active">Kích hoạt hoạt động</Label>
                    <Controller
                      control={cookingForm.control}
                      name="active"
                      render={({ field }) => (
                        <Switch
                          id="cooking-active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Specialized Form: INTERACTION_RULE */}
              {kind === 'INTERACTION_RULE' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>UUID Nguyên liệu A</Label>
                      <Input
                        {...interactionForm.register('ingredientAId')}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>UUID Nguyên liệu B</Label>
                      <Input
                        {...interactionForm.register('ingredientBId')}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Phạm vi (Scope)</Label>
                      <Controller
                        control={interactionForm.control}
                        name="scope"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SAME_DISH">Cùng món</SelectItem>
                              <SelectItem value="SAME_MEAL">Cùng bữa</SelectItem>
                              <SelectItem value="SAME_DAY">Cùng ngày</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Mức độ (Severity)</Label>
                      <Controller
                        control={interactionForm.control}
                        name="severity"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WARNING">Cảnh báo (WARNING)</SelectItem>
                              <SelectItem value="NOTICE">Lưu ý (NOTICE)</SelectItem>
                              <SelectItem value="COMPATIBLE">Hợp khẩu vị (COMPATIBLE)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Bằng chứng</Label>
                      <Controller
                        control={interactionForm.control}
                        name="evidenceGrade"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STRONG">Mạnh (STRONG)</SelectItem>
                              <SelectItem value="MODERATE">Trung bình</SelectItem>
                              <SelectItem value="PRELIMINARY">Sơ bộ</SelectItem>
                              <SelectItem value="INSUFFICIENT">Chưa đủ</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Cơ chế khoa học (Explanation)</Label>
                    <Textarea
                      {...interactionForm.register('explanation')}
                      placeholder="Giải thích phản ứng tương tác vi chất hoặc kiêng kỵ..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Gợi ý hành động (Suggested Action)</Label>
                    <Input
                      {...interactionForm.register('suggestedAction')}
                      placeholder="Gợi ý sơ chế hoặc thay thế..."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay thế' : 'Tạo mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
