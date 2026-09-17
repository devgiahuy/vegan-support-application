'use client';

import * as React from 'react';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface UserCoordinates {
  lat: number;
  lng: number;
}

/**
 * Xin vị trí trình duyệt SAU thao tác rõ ràng (timeout 10s).
 * Từ chối/hết hạn → caller hiện form địa chỉ thay thế.
 */
export function LocationPrompt({
  onLocated,
  onDenied,
}: {
  onLocated: (coords: UserCoordinates) => void;
  onDenied: (message: string) => void;
}) {
  const [pending, setPending] = React.useState(false);

  const request = () => {
    if (!('geolocation' in navigator)) {
      onDenied('Trình duyệt không hỗ trợ định vị. Vui lòng nhập địa chỉ.');
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPending(false);
        onLocated({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setPending(false);
        onDenied('Không lấy được vị trí. Vui lòng nhập địa chỉ thay thế.');
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  return (
    <Button onClick={request} disabled={pending} className="gap-1.5">
      <LocateFixed data-icon="inline-start" />
      {pending ? 'Đang lấy vị trí...' : 'Dùng vị trí của tôi'}
    </Button>
  );
}
