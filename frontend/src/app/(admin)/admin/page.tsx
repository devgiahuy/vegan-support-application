'use client';

import * as React from 'react';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const destination = query ? `/admin/dashboard?${query}` : '/admin/dashboard';
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-sm text-muted-foreground animate-pulse">
        Đang chuyển hướng đến Bảng điều khiển quản trị...
      </p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      }
    >
      <AdminRedirect />
    </Suspense>
  );
}
