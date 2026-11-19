'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/** Presentation-only notice; values are assessed and mapped by the owning feature. */
export function DietImpactNotice({
  affectedCount,
  unverifiedCount = 0,
  onRepair,
  pending = false,
  assessmentUnavailable = false,
  onRecheck,
  showTitle = true,
}: {
  affectedCount: number;
  unverifiedCount?: number;
  onRepair?: () => void;
  pending?: boolean;
  assessmentUnavailable?: boolean;
  onRecheck?: () => void;
  showTitle?: boolean;
}) {
  if (!assessmentUnavailable && affectedCount <= 0 && unverifiedCount <= 0) return null;

  return (
    <Alert>
      <AlertTriangle aria-hidden />
      {showTitle && (
        <AlertTitle className="text-balance">
          {assessmentUnavailable
            ? 'Chưa kiểm tra được ảnh hưởng lên thực đơn'
            : 'Thực đơn cần được xem lại theo thiết lập ăn uống'}
        </AlertTitle>
      )}
      <AlertDescription className="flex flex-col gap-3">
        <p className="text-pretty">
          {assessmentUnavailable ? (
            'Thiết lập ăn uống đã được lưu, nhưng hệ thống chưa kiểm tra được các thực đơn. Hãy kiểm tra lại trước khi xem chúng là phù hợp.'
          ) : (
            <>
              {affectedCount > 0 && `${affectedCount} bữa không còn phù hợp. `}
              {unverifiedCount > 0 && `${unverifiedCount} bữa chưa đủ dữ liệu để kiểm tra. `}
              Nội dung thực đơn vẫn được giữ. Các bữa này chưa được xác nhận phù hợp với thiết lập
              hiện tại của bạn.
            </>
          )}
        </p>
        {assessmentUnavailable && onRecheck && (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={pending}
            onClick={onRecheck}
          >
            {pending ? 'Đang kiểm tra…' : 'Kiểm tra lại thực đơn'}
          </Button>
        )}
        {!assessmentUnavailable && onRepair && (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={pending}
            onClick={onRepair}
          >
            {pending ? 'Đang tìm món thay thế…' : 'Tìm món thay thế'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
