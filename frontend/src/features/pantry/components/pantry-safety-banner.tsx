import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PantrySafetyBanner() {
  return (
    <Alert className="border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="font-semibold text-amber-900 dark:text-amber-300">
        Khuyến cáo quản lý an toàn thực phẩm
      </AlertTitle>
      <AlertDescription className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
        Hạn sử dụng và ghi chú độ tươi là các quan sát do bạn ghi nhận hoặc thu thập từ bao bì. Hệ
        thống không thay thế việc kiểm tra màu sắc, mùi vị và cảm quan thực tế của thực phẩm trước
        khi chế biến nhằm đảm bảo an toàn vệ sinh tối đa.
      </AlertDescription>
    </Alert>
  );
}
