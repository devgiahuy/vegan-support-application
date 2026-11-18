'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DietPreferenceSummary } from '@/features/profile/types/profile.model';
import { foodSummary } from '../types/diet.model';
export function CurrentDietCard({
  summary,
  onChangeDiet,
}: {
  summary: DietPreferenceSummary;
  onChangeDiet?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thiết lập ăn uống của bạn</CardTitle>
        <CardDescription>{foodSummary(summary)}. Áp dụng mỗi ngày.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p>
          Dị ứng: {summary.allergies.length + summary.ingredientAllergies.length} · Nguyên liệu
          kiêng: {summary.ingredientExclusions.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {summary.allergies.map((a) => (
            <Badge key={a.allergenCode} variant="outline">
              {a.label}
            </Badge>
          ))}
          {summary.ingredientAllergies.map((a) => (
            <Badge key={a.ingredientId} variant="outline">
              {a.ingredientName}
            </Badge>
          ))}
          {summary.ingredientExclusions.map((e) => (
            <Badge key={e.ingredientName} variant="secondary">
              {e.ingredientName}
            </Badge>
          ))}
        </div>
        {onChangeDiet && (
          <Button className="w-fit" onClick={onChangeDiet}>
            Thay đổi thiết lập ăn uống
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
