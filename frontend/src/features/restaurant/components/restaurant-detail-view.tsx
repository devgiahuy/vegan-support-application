'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Phone,
  Star,
  Navigation,
  CheckCircle2,
  Calendar,
  Utensils,
  Share2,
  Bookmark,
  ChevronRight,
  Home,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Restaurant } from '../types/restaurant.model';

interface RestaurantDetailViewProps {
  restaurant: Restaurant;
  nearbyRestaurants: Restaurant[];
}

export function RestaurantDetailView({ restaurant, nearbyRestaurants }: RestaurantDetailViewProps) {
  const [isSaved, setIsSaved] = React.useState<boolean>(false);

  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết quán ăn!');
    }
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(
      !isSaved ? 'Đã lưu quán ăn vào danh sách yêu thích!' : 'Đã bỏ lưu quán ăn khỏi danh sách.'
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/ban-do" className="hover:text-primary transition-colors">
          Bản đồ quán chay
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary truncate max-w-xs sm:max-w-md">
          {restaurant.name}
        </span>
      </nav>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Information */}
        <div className="space-y-8 lg:col-span-8">
          {/* Header & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-white hover:bg-primary/90 px-3 py-1 font-medium">
                {restaurant.badge || 'Quán chay chất lượng'}
              </Badge>
              {restaurant.veganCertified && (
                <Badge
                  variant="secondary"
                  className="border-primary/30 bg-primary/10 text-primary gap-1 px-3 py-1 font-medium"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Chứng nhận Thuần chay
                </Badge>
              )}
              <Badge variant="outline" className="px-3 py-1 text-xs">
                {restaurant.area}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs">
                Khoảng cách ~{restaurant.distance}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {restaurant.name}
              </h1>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleSave}
                  className={cn(
                    'gap-1.5',
                    isSaved && 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30'
                  )}
                >
                  <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
                  <span>{isSaved ? 'Đã lưu' : 'Lưu quán'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                  <Share2 className="h-4 w-4" />
                  <span>Chia sẻ</span>
                </Button>
                <Button size="sm" onClick={handleOpenMaps} className="gap-1.5 font-semibold">
                  <Navigation className="h-4 w-4" />
                  <span>Chỉ đường</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 font-bold text-amber-500 text-base">
                <Star className="h-4 w-4 fill-current" />
                <span>{restaurant.rating}</span>
              </div>
              <span>•</span>
              <span>{restaurant.reviews} đánh giá thực khách</span>
              <span>•</span>
              <span className="font-semibold text-primary">{restaurant.price}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {restaurant.open}
              </span>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-hidden rounded-2xl">
            <div className="sm:col-span-2 aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              {(restaurant.galleryImages || []).slice(0, 2).map((img, i) => (
                <div key={i} className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                  <img
                    src={img}
                    alt={`${restaurant.name} ${i}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* About / Description */}
          {restaurant.description && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  Giới thiệu về quán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {restaurant.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {restaurant.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      #{t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* MENU SECTION */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Utensils className="h-5 w-5 text-primary" /> Thực đơn món chay tiêu biểu
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Giá món tham khảo và có thể thay đổi tùy dịp lễ, ngày rằm
              </p>
            </CardHeader>
            <CardContent className="p-5">
              {restaurant.menu && restaurant.menu.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {restaurant.menu.map((dish) => (
                    <div
                      key={dish.id}
                      className="flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground text-sm">{dish.name}</h4>
                          {dish.isBestSeller && (
                            <Badge className="bg-cta text-white text-[10px] px-2 py-0.5">
                              Bán chạy
                            </Badge>
                          )}
                        </div>
                        {dish.desc && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {dish.desc}
                          </p>
                        )}
                      </div>
                      <div className="font-bold text-primary text-sm">{dish.price}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Đang cập nhật thực đơn đầy đủ...
                </p>
              )}
            </CardContent>
          </Card>

          {/* CUSTOMER REVIEWS */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Đánh giá thực tế từ thực khách
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tổng hợp từ Google Maps và cộng đồng ăn chay VeggieConnect
                </p>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-base">
                <Star className="h-4 w-4 fill-current" />
                <span>{restaurant.rating}</span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {restaurant.customerReviews && restaurant.customerReviews.length > 0 ? (
                <div className="space-y-4 divide-y">
                  {restaurant.customerReviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={rev.userAvatar} alt={rev.userName} />
                            <AvatarFallback>{rev.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-semibold text-foreground block">
                              {rev.userName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{rev.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: Math.floor(rev.rating) }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-11">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có đánh giá nào. Hãy ghé quán và chia sẻ trải nghiệm đầu tiên!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Contact, Hours & Map Sidebar */}
        <div className="space-y-6 lg:col-span-4">
          {/* Location & Contact Info */}
          <Card className="border-border/60 shadow-sm sticky top-20">
            <CardHeader className="bg-primary/5 pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Info className="h-4 w-4 text-primary" /> Thông tin liên hệ & Giờ phục vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground block">Địa chỉ</span>
                    <strong className="text-foreground text-sm leading-relaxed block">
                      {restaurant.address}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Giờ mở cửa ngày thường
                    </span>
                    <strong className="text-foreground text-sm block">{restaurant.hours}</strong>
                  </div>
                </div>

                {restaurant.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Hotline đặt bàn</span>
                      <strong className="text-foreground text-sm block">{restaurant.phone}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Lunar hours highlight note */}
              {restaurant.lunarHoursNote && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Calendar className="h-4 w-4" /> Lưu ý ngày Rằm & Mùng 1:
                  </div>
                  <p className="leading-relaxed">{restaurant.lunarHoursNote}</p>
                </div>
              )}

              {/* Map mockup & Action button */}
              <div className="pt-2">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border bg-muted flex items-center justify-center text-center p-4">
                  <div className="space-y-1.5">
                    <MapPin className="h-6 w-6 text-primary mx-auto animate-bounce" />
                    <p className="text-xs font-semibold text-foreground">Google Maps Platform</p>
                    <p className="text-[11px] text-muted-foreground">Toạ độ: {restaurant.area}</p>
                  </div>
                </div>

                <Button
                  onClick={handleOpenMaps}
                  className="w-full mt-3 gap-2 font-semibold shadow-md"
                >
                  <Navigation className="h-4 w-4" /> Mở Google Maps chỉ đường
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Nearby Vegan Restaurants */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-foreground">Quán chay lân cận</h4>
            <div className="space-y-3">
              {nearbyRestaurants.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/ban-do/${item.id}`}
                  className="flex gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm group"
                >
                  <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h5 className="text-sm font-semibold text-foreground truncate group-hover:text-primary">
                      {item.name}
                    </h5>
                    <p className="text-xs text-muted-foreground truncate">{item.address}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="h-3 w-3 fill-current" /> {item.rating}
                      </span>
                      <span>•</span>
                      <span className="text-muted-foreground">{item.distance}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
