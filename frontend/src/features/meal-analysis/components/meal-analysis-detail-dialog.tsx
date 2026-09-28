'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Info, ShieldAlert, Utensils } from 'lucide-react';
import type { MealWarning } from '../types/meal-analysis.model';
import { EvidenceGradeBadge } from './evidence-grade-badge';

interface MealAnalysisDetailDialogProps {
  warning: MealWarning | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hộp thoại giải thích chi tiết cơ sở khoa học & nguồn tham chiếu của cảnh báo dinh dưỡng.
 * Tuân thủ quy định giáo dục an toàn y khoa D22.
 */
export function MealAnalysisDetailDialog({
  warning,
  open,
  onOpenChange,
}: MealAnalysisDetailDialogProps) {
  if (!warning) return null;

  const isDanger = warning.severity === 'DANGER';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant={isDanger ? 'destructive' : 'outline'}
              className={!isDanger ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' : ''}
            >
              {isDanger ? 'Nguy cơ cao' : 'Cần lưu ý'}
            </Badge>
            <EvidenceGradeBadge grade={warning.evidenceGrade} />
          </div>
          <DialogTitle className="mt-2 text-base font-semibold leading-snug">
            {warning.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Mã quy tắc: {warning.code} • Phiên bản quy chuẩn: {warning.ruleVersion}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Lời giải thích khoa học */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
              <BookOpen className="size-3.5 text-primary" />
              Cơ chế tương tác & tác động dinh dưỡng
            </h4>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">{warning.explanation}</p>
          </div>

          {/* Dữ liệu đo lường định lượng nếu có */}
          {warning.measuredValue !== null && warning.limitValue !== null && (
            <div className="rounded-lg border p-3">
              <h4 className="font-semibold text-foreground">Số liệu định lượng ghi nhận</h4>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded bg-muted p-2">
                  <span className="text-[11px] text-muted-foreground">Mức trong thực đơn:</span>
                  <p className="text-sm font-bold text-foreground">
                    {warning.measuredValue} {warning.unit}
                  </p>
                </div>
                <div className="rounded bg-muted p-2">
                  <span className="text-[11px] text-muted-foreground">
                    Ngưỡng an toàn tối đa (UL):
                  </span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {warning.limitValue} {warning.unit}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Các món & nguyên liệu liên quan */}
          {warning.affectedItems.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                <Utensils className="size-3.5 text-muted-foreground" />
                Món ăn & nguyên liệu trực tiếp liên quan
              </h4>
              <ul className="mt-2 divide-y rounded-lg border bg-card text-xs">
                {warning.affectedItems.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2.5">
                    <div>
                      <p className="font-medium text-foreground">{item.dishName}</p>
                      {item.ingredientName && (
                        <p className="text-[11px] text-muted-foreground">
                          Thành phần: {item.ingredientName}{' '}
                          {item.amount ? `(${item.amount}${item.unit ?? 'g'})` : ''}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.dishType === 'CUSTOM_MEAL' ? 'Món cá nhân' : 'Công thức cộng đồng'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cơ sở dữ liệu nguồn & độ tin cậy */}
          <div className="rounded-lg border border-border/60 p-3 text-[11px] text-muted-foreground">
            <p>
              <strong className="text-foreground">Tài liệu tham chiếu:</strong>{' '}
              {warning.evidenceSource}
            </p>
            <p className="mt-1">
              <strong className="text-foreground">Độ tin cậy thuật toán:</strong>{' '}
              {Math.round(warning.confidence * 100)}%
            </p>
          </div>

          {/* Tuyên bố miễn trừ an toàn y khoa D22 */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-300">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">
              <strong>Khuyến cáo giáo dục:</strong> Các thông tin và chỉ số trên mang tính hướng dẫn
              lối sống lành mạnh, không có giá trị thay thế chẩn đoán bệnh tật hoặc phác đồ điều trị
              của bác sĩ chuyên khoa dinh dưỡng.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
