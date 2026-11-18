'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface DietImpactMealView {
  id: string;
  name: string;
  location: string;
  reasons: string[];
  unverified: boolean;
}

/** The save action remains explicit; closing this dialog does not save a draft profile. */
export function DietImpactDialog({
  open,
  planCount,
  meals,
  busy,
  error,
  onReplace,
  onKeep,
  onBack,
  profileAlreadySaved = false,
}: {
  open: boolean;
  planCount: number;
  meals: DietImpactMealView[];
  busy: boolean;
  error: string | null;
  onReplace: () => void;
  onKeep: () => void;
  onBack: () => void;
  profileAlreadySaved?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onBack();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-balance">Thiết lập mới ảnh hưởng đến thực đơn</DialogTitle>
          <DialogDescription className="text-pretty">
            Có {meals.length} bữa trong {planCount} thực đơn cần được xem lại. Bạn có thể tìm món
            thay thế hoặc giữ nội dung thực đơn và xử lý sau.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex max-h-72 flex-col divide-y overflow-y-auto rounded-lg border px-4">
          {meals.map((meal) => (
            <li key={meal.id} className="flex flex-col gap-1.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{meal.name}</p>
                {meal.unverified && <Badge variant="outline">Chưa đủ dữ liệu</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{meal.location}</p>
              <p className="text-sm text-pretty text-muted-foreground">{meal.reasons.join('; ')}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-pretty text-muted-foreground">
          {profileAlreadySaved
            ? 'Thiết lập mới đã được lưu. '
            : 'Chọn một trong hai cách bên dưới sẽ lưu thiết lập mới. '}
          Món thay thế được hiển thị để bạn xem trước khi áp dụng. Nếu giữ thực đơn, cảnh báo vẫn
          còn ở các bữa cần xử lý.
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" disabled={busy} onClick={onReplace}>
            {busy
              ? 'Đang xử lý…'
              : profileAlreadySaved
                ? 'Tự động tìm món thay thế'
                : 'Lưu và tự động tìm món thay thế'}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onKeep}>
            {profileAlreadySaved ? 'Giữ thực đơn và xử lý sau' : 'Lưu, giữ thực đơn và xử lý sau'}
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onBack}>
            Quay lại chỉnh sửa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
