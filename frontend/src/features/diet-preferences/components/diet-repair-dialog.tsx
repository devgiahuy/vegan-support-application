'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
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

export interface DietRepairPlanView {
  id: string;
  title: string;
  ready: boolean;
  message: string;
  replacements: Array<{ id: string; location: string; beforeName: string; afterName: string }>;
  beforeNutrition: string;
  afterNutrition: string;
  shoppingChange: string;
  shoppingBeforeLines: string[];
  shoppingAfterLines: string[];
  programs: Array<{ id: string; title: string; expectedVersion: number }>;
}

export function DietRepairDialog({
  open,
  loading,
  applying,
  error,
  plans,
  onApply,
  onRetry,
  onClose,
  onCreateRevision,
  progress,
  onNextBatch,
}: {
  open: boolean;
  loading: boolean;
  applying: boolean;
  error: string | null;
  plans: DietRepairPlanView[];
  onApply: () => void;
  onRetry: () => void;
  onClose: () => void;
  onCreateRevision: (programId: string, expectedVersion: number) => void;
  progress?: React.ReactNode;
  onNextBatch?: () => void;
}) {
  const readyCount = plans.filter((plan) => plan.ready).length;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !applying) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-balance">Xem trước phương án thay món</DialogTitle>
          <DialogDescription className="text-pretty">
            Thiết lập ăn uống đã được lưu. Phương án này chỉ thay những bữa cần xử lý từ hôm nay trở
            đi; món đang phù hợp và các ngày trước hôm nay được giữ nguyên.
          </DialogDescription>
        </DialogHeader>
        {progress}
        {loading && (
          <p role="status" className="py-6 text-sm text-muted-foreground">
            Đang tìm món phù hợp để thay thế…
          </p>
        )}
        {!loading && plans.length > 0 && (
          <div className="flex flex-col gap-6">
            {plans.map((plan) => (
              <section key={plan.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-balance">{plan.title}</h3>
                  <Badge variant={plan.ready ? 'secondary' : 'outline'}>
                    {plan.ready ? `${plan.replacements.length} bữa sẽ thay` : 'Cần xử lý thêm'}
                  </Badge>
                </div>
                {plan.message && (
                  <p className="text-sm text-pretty text-muted-foreground">{plan.message}</p>
                )}
                {plan.programs.length > 0 && !plan.ready && (
                  <div className="flex flex-wrap gap-2">
                    {plan.programs.map((program) => (
                      <Button
                        key={program.id}
                        type="button"
                        variant="outline"
                        disabled={applying}
                        onClick={() => onCreateRevision(program.id, program.expectedVersion)}
                      >
                        Tạo bản điều chỉnh: {program.title}
                      </Button>
                    ))}
                  </div>
                )}
                {plan.replacements.length > 0 && (
                  <ul className="flex flex-col divide-y rounded-lg border px-4">
                    {plan.replacements.map((replacement) => (
                      <li key={replacement.id} className="flex flex-col gap-1.5 py-3">
                        <p className="text-xs text-muted-foreground">{replacement.location}</p>
                        <div className="grid gap-1 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
                          <span>{replacement.beforeName}</span>
                          <ArrowRight aria-hidden className="size-4 text-muted-foreground" />
                          <span className="font-medium">{replacement.afterName}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {plan.ready && (
                  <div className="flex flex-col gap-1 text-xs text-pretty text-muted-foreground">
                    <p>
                      Dinh dưỡng trước: <span className="tabular-nums">{plan.beforeNutrition}</span>
                    </p>
                    <p>
                      Dinh dưỡng sau: <span className="tabular-nums">{plan.afterNutrition}</span>
                    </p>
                    <p>{plan.shoppingChange}</p>
                    <details className="mt-2 rounded-lg border p-3">
                      <summary className="cursor-pointer font-medium text-foreground">
                        Xem nguyên liệu cần mua trước và sau
                      </summary>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 font-medium">Trước</p>
                          <ul className="flex flex-col gap-1">
                            {plan.shoppingBeforeLines.map((line, index) => (
                              <li key={index}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-2 font-medium">Sau</p>
                          <ul className="flex flex-col gap-1">
                            {plan.shoppingAfterLines.map((line, index) => (
                              <li key={index}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
        {!loading && !error && plans.length === 0 && (
          <p className="py-4 text-sm text-pretty text-muted-foreground">
            Không có bữa nào cần thay ở thời điểm này. Bạn có thể đóng cửa sổ và xem lại thực đơn.
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertDescription className="flex flex-col gap-2">
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={loading || applying}
                onClick={onRetry}
              >
                Tải lại phương án
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-pretty text-muted-foreground">
          Nếu chưa có đủ món thay thế cho một thực đơn, thực đơn đó được giữ nguyên kèm cảnh báo. Áp
          dụng không thay đổi số lượng nguyên liệu đang có trong tủ bếp.
        </p>
        <DialogFooter className="gap-2">
          {onNextBatch && (
            <Button
              type="button"
              variant="outline"
              disabled={loading || applying}
              onClick={onNextBatch}
            >
              {readyCount > 0 ? 'Giữ nhóm này, xem nhóm tiếp theo' : 'Xem nhóm tiếp theo'}
            </Button>
          )}
          <Button type="button" variant="outline" disabled={applying} onClick={onClose}>
            Giữ thực đơn, xử lý sau
          </Button>
          <Button
            type="button"
            disabled={loading || applying || readyCount === 0 || !!error}
            onClick={onApply}
          >
            {applying ? 'Đang áp dụng…' : `Áp dụng cho ${readyCount} thực đơn`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
