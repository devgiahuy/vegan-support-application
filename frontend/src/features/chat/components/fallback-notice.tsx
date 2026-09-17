import { Wrench } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** Banner bảo trì khi tính năng AI bị tắt — lịch sử vẫn xem được. */
export function FallbackNotice({ maintenance }: { maintenance: boolean }) {
  if (!maintenance) return null;
  return (
    <Alert>
      <Wrench className="size-4" />
      <AlertTitle>Trợ lý đang bảo trì</AlertTitle>
      <AlertDescription>
        Bạn tạm thời chưa gửi được câu hỏi mới, nhưng lịch sử trò chuyện bên dưới vẫn xem được.
      </AlertDescription>
    </Alert>
  );
}
