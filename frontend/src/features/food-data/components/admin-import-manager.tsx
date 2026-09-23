'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import {
  useAdminImportPreviewMutation,
  useAdminImportCommitMutation,
} from '../queries/food-data.queries';
import type { FoodDataImportPreviewResult } from '../types/food-data.model';

const SAMPLE_IMPORT_RECORDS = [
  {
    sourceRecordId: 'SAMPLE-101',
    canonicalName: 'Đậu phụ non hữu cơ',
    foodGroup: 'LEGUMES',
    preparation: 'raw',
    locale: 'vi-VN',
    ediblePortionPercent: 100,
    servingGrams: 100,
    quality: 'REVIEWED',
    aliases: [{ name: 'Tofu non', locale: 'vi-VN' }],
    householdConversions: [
      {
        unitName: 'bìa',
        quantity: 1,
        unitDimension: 'COUNT',
        grams: 150,
      },
    ],
    nutrients: [
      {
        nutrientCode: 'ENERGY',
        valuePer100g: 76,
        unit: 'kcal',
      },
      {
        nutrientCode: 'PROTEIN',
        valuePer100g: 8.1,
        unit: 'g',
      },
      {
        nutrientCode: 'CALCIUM',
        valuePer100g: 350,
        unit: 'mg',
      },
    ],
  },
];

interface AdminImportManagerProps {
  onImportCommitted?: () => void;
  className?: string;
}

export const AdminImportManager: React.FC<AdminImportManagerProps> = ({
  onImportCommitted,
  className,
}) => {
  const [sourceCode, setSourceCode] = useState<string>('USDA');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => `import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  );
  const [sourceVersion, setSourceVersion] = useState<string>('v2024.1');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [recordsJson, setRecordsJson] = useState<string>(
    JSON.stringify(SAMPLE_IMPORT_RECORDS, null, 2)
  );

  const [previewResult, setPreviewResult] = useState<FoodDataImportPreviewResult | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const previewMutation = useAdminImportPreviewMutation();
  const commitMutation = useAdminImportCommitMutation();

  const handleFillSample = () => {
    setRecordsJson(JSON.stringify(SAMPLE_IMPORT_RECORDS, null, 2));
    setIdempotencyKey(`import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    setPreviewResult(null);
    setCommitSuccess(false);
    setParseError(null);
  };

  const handlePreview = async () => {
    setParseError(null);
    setCommitSuccess(false);

    let parsedRecords: unknown[];
    try {
      parsedRecords = JSON.parse(recordsJson);
      if (!Array.isArray(parsedRecords)) {
        setParseError('Dữ liệu bản ghi nạp phải là một mảng JSON (Array []).');
        return;
      }
      if (parsedRecords.length === 0) {
        setParseError('Mảng bản ghi nạp không được rỗng.');
        return;
      }
    } catch {
      setParseError('Cú pháp JSON không hợp lệ. Vui lòng kiểm tra lại mảng bản ghi.');
      return;
    }

    try {
      const result = await previewMutation.mutateAsync({
        sourceCode: sourceCode.trim().toUpperCase(),
        idempotencyKey: idempotencyKey.trim(),
        sourceVersion: sourceVersion.trim(),
        effectiveFrom: effectiveFrom.trim(),
        records: parsedRecords as unknown as never,
      });

      setPreviewResult(result);
      toast.success('Xem trước gói nạp thành công! Vui lòng kiểm tra báo cáo tóm tắt.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kiểm tra gói nạp thất bại.';
      toast.error(msg);
    }
  };

  const handleCommit = async () => {
    if (!previewResult?.importId) return;

    try {
      const result = await commitMutation.mutateAsync({
        importId: previewResult.importId,
      });

      setPreviewResult(result);
      setCommitSuccess(true);
      toast.success(
        result.idempotentReplay
          ? 'Gói nạp này đã được cam kết trước đó (Idempotent Replay).'
          : 'Cam kết nạp dữ liệu chuẩn thành công vào hệ thống!'
      );
      onImportCommitted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cam kết lưu gói nạp thất bại.';
      toast.error(msg);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Nạp dữ liệu Dinh dưỡng chuẩn (2-Bước Preview & Commit)
            </CardTitle>
            <CardDescription className="mt-1">
              Nhập dữ liệu theo lô từ USDA hoặc Viện Dinh Dưỡng có cơ chế chống lặp an toàn
              (Idempotency).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleFillSample} className="shrink-0">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Nạp mẫu thử nghiệm
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Mã nguồn (Source Code)</Label>
            <Input
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="vd: USDA, NIN_VN"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Khóa chống lặp (Idempotency Key)</Label>
            <Input
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              placeholder="uuid-hoac-batch-code"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Phiên bản dữ liệu (Version)</Label>
            <Input
              value={sourceVersion}
              onChange={(e) => setSourceVersion(e.target.value)}
              placeholder="vd: v2024.1"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ngày hiệu lực</Label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
        </div>

        {/* JSON Records Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Mảng bản ghi nhập (JSON Array)
            </Label>
            <span className="text-xs text-muted-foreground">
              Mỗi bản ghi bao gồm tên chuẩn, nhóm thực phẩm, aliases, conversions và mảng vi chất.
            </span>
          </div>

          <Textarea
            rows={10}
            className="font-mono text-xs"
            value={recordsJson}
            onChange={(e) => {
              setRecordsJson(e.target.value);
              setPreviewResult(null);
              setCommitSuccess(false);
            }}
            placeholder="[\n  {\n    'sourceRecordId': '...'\n  }\n]"
          />
        </div>

        {parseError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lỗi định dạng</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            onClick={handlePreview}
            disabled={previewMutation.isPending || commitMutation.isPending}
            className="gap-1.5"
          >
            {previewMutation.isPending ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            Bước 1: Xem trước & Kiểm tra hợp lệ (Preview)
          </Button>

          {previewResult && (
            <Button
              onClick={handleCommit}
              disabled={
                commitMutation.isPending ||
                commitSuccess ||
                (previewResult.summary.errorCount > 0 && previewResult.summary.validRecords === 0)
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {commitMutation.isPending ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {commitSuccess ? 'Đã nạp thành công' : 'Bước 2: Xác nhận nạp vào CSDL (Commit)'}
            </Button>
          )}
        </div>

        {/* Preview Summary Report */}
        {previewResult && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-semibold text-base flex items-center gap-2">
                Báo cáo kiểm tra gói nạp
                {previewResult.status === 'COMMITTED' ? (
                  <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30">
                    Đã nạp (COMMITTED)
                  </Badge>
                ) : (
                  <Badge variant="secondary">Đã kiểm tra (PREVIEWED)</Badge>
                )}
                {previewResult.idempotentReplay && (
                  <Badge
                    variant="outline"
                    className="border-blue-400 text-blue-700 dark:text-blue-300"
                  >
                    Phát lại an toàn (Idempotent Replay)
                  </Badge>
                )}
              </h4>
              <span className="text-xs font-mono text-muted-foreground">
                Import ID: {previewResult.importId}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 border rounded-lg bg-card">
                <span className="text-xs text-muted-foreground">Tổng số bản ghi</span>
                <p className="text-xl font-bold mt-0.5">{previewResult.summary.totalRecords}</p>
              </div>
              <div className="p-3 border rounded-lg bg-card">
                <span className="text-xs text-muted-foreground">Bản ghi hợp lệ</span>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">
                  {previewResult.summary.validRecords}
                </p>
              </div>
              <div className="p-3 border rounded-lg bg-card">
                <span className="text-xs text-muted-foreground">Số lỗi phát hiện</span>
                <p className="text-xl font-bold text-destructive mt-0.5">
                  {previewResult.summary.errorCount}
                </p>
              </div>
              <div className="p-3 border rounded-lg bg-card">
                <span className="text-xs text-muted-foreground">Vi chất được ánh xạ</span>
                <p className="text-xl font-bold text-primary mt-0.5">
                  {previewResult.summary.mappedNutrientsCount ?? 0}
                </p>
              </div>
            </div>

            {/* Commit specific summary */}
            {commitSuccess && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Nạp thành công!</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Đã lưu{' '}
                  {previewResult.summary.committedIngredients ?? previewResult.summary.validRecords}{' '}
                  nguyên liệu và{' '}
                  {previewResult.summary.committedNutrientValues ??
                    previewResult.summary.mappedNutrientsCount}{' '}
                  giá trị dinh dưỡng vào cơ sở dữ liệu.
                  {previewResult.idempotentReplay &&
                    ' (Gói nạp này đã được nạp trước đó, hệ thống không tạo thêm bản ghi trùng lặp).'}
                </AlertDescription>
              </Alert>
            )}

            {/* Error List if any */}
            {previewResult.summary.errors && previewResult.summary.errors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Danh sách lỗi chi tiết:
                </span>
                <div className="max-h-48 overflow-y-auto border rounded p-3 bg-destructive/5 space-y-1 text-xs">
                  {previewResult.summary.errors.map((err, idx) => (
                    <div key={idx} className="font-mono text-destructive">
                      {err.line ? `[Dòng ${err.line}] ` : ''}
                      {err.path ? `(${err.path.join('.')}) ` : ''}
                      {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
