import * as React from 'react';
import { Apple, CheckCircle2, ChefHat, MessageSquare, Receipt, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AiArtifactType } from '@/common/enums';
import type { AiArtifactContent } from '../types/ai-artifact.model';

export function ArtifactContentRenderer({
  content,
  className,
}: {
  content: AiArtifactContent;
  className?: string;
}) {
  switch (content.type) {
    case AiArtifactType.CHAT_ANSWER:
      return (
        <div className={`space-y-3 ${className || ''}`}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MessageSquare className="size-4 text-primary" />
            <span>Câu trả lời từ Trợ lý Trí tuệ Nhân tạo</span>
          </div>
          <div className="rounded-lg border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {content.answer || '(Nội dung câu trả lời trống)'}
          </div>
        </div>
      );

    case AiArtifactType.RECIPE_NUTRITION:
      return (
        <div className={`space-y-4 ${className || ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <div className="flex items-center gap-2">
              <ChefHat className="size-4 text-primary" />
              <span className="font-semibold text-foreground">{content.recipe.title}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{content.recipe.servings} khẩu phần</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Scale className="size-3.5" />
                {content.totals.rawGrams}g sống → {content.totals.cookedGrams}g chín
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bảng dinh dưỡng ước tính trên mỗi khẩu phần
            </h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%] text-xs">Chỉ số</TableHead>
                    <TableHead className="text-xs">Hàm lượng</TableHead>
                    <TableHead className="text-xs">Khoảng dao động</TableHead>
                    <TableHead className="text-right text-xs">Độ tin cậy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.perServingNutrients.map((n, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-xs">{n.name}</TableCell>
                      <TableCell className="text-xs">
                        {n.amount} {n.unit}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {n.range.min !== null && n.range.max !== null
                          ? `${n.range.min} - ${n.range.max} ${n.unit}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className="font-medium">{Math.round(n.confidence * 100)}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {content.disclaimer && (
            <p className="text-[11px] italic text-muted-foreground">* {content.disclaimer}</p>
          )}
        </div>
      );

    case AiArtifactType.FRIDGE_RECOGNITION:
      return (
        <div className={`space-y-3 ${className || ''}`}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Apple className="size-4 text-emerald-600" />
            <span>Nguyên liệu nhận diện từ ảnh tủ lạnh</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {content.items.map((item, idx) => (
              <Card key={idx} className="border shadow-none">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity.value !== null
                        ? `${item.quantity.value} ${item.quantity.unit || ''}`
                        : 'Không rõ số lượng'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {item.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(item.confidence * 100)}% tin cậy
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

    case AiArtifactType.RECEIPT_EXTRACTION:
      return (
        <div className={`space-y-3 ${className || ''}`}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Receipt className="size-4 text-blue-600" />
            <span>Mặt hàng trích xuất từ hóa đơn mua sắm</span>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Mặt hàng</TableHead>
                  <TableHead className="text-xs">Số lượng</TableHead>
                  <TableHead className="text-xs">Trạng thái</TableHead>
                  <TableHead className="text-right text-xs">Độ tin cậy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-xs">{item.name}</TableCell>
                    <TableCell className="text-xs">
                      {item.quantity.value !== null
                        ? `${item.quantity.value} ${item.quantity.unit || ''}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="text-[10px]">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {Math.round(item.confidence * 100)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
  }
}
