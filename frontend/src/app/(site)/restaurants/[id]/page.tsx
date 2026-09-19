'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { RestaurantDetail } from '@/features/restaurant/components/restaurant-detail';

/** Chi tiết 1 quán (fixture ở phase scaffold). */
export default function RestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 lg:px-6">
      <RestaurantDetail id={id} />
    </div>
  );
}
