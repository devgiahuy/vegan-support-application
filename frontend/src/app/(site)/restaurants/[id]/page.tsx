'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { RestaurantDetailView } from '@/features/restaurant/components/restaurant-detail-view';
import { MOCK_RESTAURANTS } from '@/features/restaurant/data/mock-restaurants';

export default function RestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const restaurant = React.useMemo(() => {
    const found = MOCK_RESTAURANTS.find((r) => r.id === id);
    return found || MOCK_RESTAURANTS[0];
  }, [id]);

  const nearbyRestaurants = React.useMemo(() => {
    return MOCK_RESTAURANTS.filter((r) => r.id !== restaurant.id);
  }, [restaurant.id]);

  return <RestaurantDetailView restaurant={restaurant} nearbyRestaurants={nearbyRestaurants} />;
}
