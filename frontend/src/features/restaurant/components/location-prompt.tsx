'use client';

import * as React from 'react';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Vị trí đã phân giải kèm nguồn — nguồn quyết định việc gửi `locationConsent` lên backend. */
export interface ResolvedLocation {
  lat: number;
  lng: number;
  /** `DEVICE` bắt buộc kèm cờ đồng ý chia sẻ vị trí (FR-026). */
  source: 'DEVICE' | 'MANUAL';
  label: string;
}

export interface LocationPromptProps {
  onLocated: (location: ResolvedLocation) => void;
  onDenied: (message: string) => void;
}

/**
 * Xin vị trí trình duyệt SAU thao tác rõ ràng của người dùng (timeout 10s).
 *
 * Quy tắc: chỉ được lấy vị trí khi người dùng bấm nút. Khi từ chối / hết hạn / trình duyệt không
 * hỗ trợ thì chỉ gọi `onDenied` với thông báo tiếng Việt — TUYỆT ĐỐI không trả tọa độ mặc định,
 * vì như vậy người dùng sẽ thấy quán ở một khu vực hoàn toàn không liên quan.
 */
export function LocationPrompt({ onLocated, onDenied }: LocationPromptProps) {
  const [pending, setPending] = React.useState(false);

  const request = () => {
    if (!('geolocation' in navigator)) {
      onDenied('Trình duyệt không hỗ trợ định vị. Vui lòng nhập địa chỉ để tìm quán chay.');
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPending(false);
        onLocated({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'DEVICE',
          label: 'Vị trí hiện tại của bạn',
        });
      },
      () => {
        setPending(false);
        onDenied('Không lấy được vị trí. Vui lòng nhập địa chỉ để tìm quán chay thay thế.');
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000, enableHighAccuracy: true }
    );
  };

  return (
    <Button onClick={request} disabled={pending} className="gap-1.5">
      <LocateFixed data-icon="inline-start" className="size-4" />
      {pending ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
    </Button>
  );
}
