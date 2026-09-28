import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function MedicalDisclaimer({
  customNote,
  className,
}: {
  customNote?: string;
  className?: string;
}) {
  return (
    <Alert variant="default" className={className}>
      <AlertCircle className="size-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-xs font-semibold text-amber-900 dark:text-amber-200">
        Khuyến cáo miễn trừ trách nhiệm dinh dưỡng & y tế
      </AlertTitle>
      <AlertDescription className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
        {customNote ||
          'Thông tin do Trí tuệ Nhân tạo (AI) tổng hợp chỉ mang tính chất tham khảo khoa học, không thay thế cho chẩn đoán y khoa, phác đồ điều trị hoặc tư vấn từ bác sĩ chuyên khoa dinh dưỡng. Người dùng nên tham vấn chuyên gia y tế trước khi thực hiện các thay đổi lớn về chế độ ăn.'}
      </AlertDescription>
    </Alert>
  );
}
