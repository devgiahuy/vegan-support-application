export interface MenuItem {
  id: string;
  name: string;
  price: string;
  desc?: string;
  image?: string;
  isBestSeller?: boolean;
}

export interface RestaurantReview {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  galleryImages?: string[];
  badge?: string;
  badgeTone?: string;
  open: string;
  openNow: boolean;
  distance: string;
  area: string;
  address: string;
  phone?: string;
  rating: number;
  reviews: number;
  price: string;
  hours: string;
  lunarHoursNote?: string;
  tags: string[];
  description?: string;
  veganCertified?: boolean;
  menu?: MenuItem[];
  customerReviews?: RestaurantReview[];
  coordinates?: { lat: number; lng: number };
}
