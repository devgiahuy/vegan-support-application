'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Phone,
  Star,
  ExternalLink,
  Navigation,
  CheckCircle2,
  Calendar,
  Utensils,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Restaurant } from '../types/restaurant.model';

interface RestaurantDetailSheetProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantDetailSheet({ restaurant, isOpen, onClose }: RestaurantDetailSheetProps) {
  if (!restaurant) return null;

  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleCall = () => {
    if (restaurant.phone) {
      window.location.href = `tel:${restaurant.phone.replace(/\s/g, '')}`;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l border-border/70">
        {/* Cover image */}
        <div className="relative aspect-[16/9] w-full bg-muted">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {restaurant.badge && (
              <Badge className="bg-primary text-white border-0 font-medium text-xs">
                {restaurant.badge}
              </Badge>
            )}
            {restaurant.veganCertified && (
              <Badge variant="secondary" className="bg-white/90 text-primary backdrop-blur text-xs">
                🌱 Thuần chay
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-xs bg-emerald-600/90 backdrop-blur px-2.5 py-0.5 rounded-full font-medium inline-block mb-1">
              {restaurant.open}
            </span>
            <h3 className="text-lg font-bold leading-snug drop-shadow-sm">{restaurant.name}</h3>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Quick Metrics */}
          <div className="flex items-center justify-between text-sm py-2 border-b">
            <div className="flex items-center gap-1.5 font-semibold text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span>{restaurant.rating}</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({restaurant.reviews} đánh giá)
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Khoảng cách: <strong className="text-foreground">{restaurant.distance}</strong>
            </div>
            <div className="text-xs font-semibold text-primary">{restaurant.price}</div>
          </div>

          {/* Contact & Address info */}
          <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground leading-relaxed">{restaurant.address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>Giờ mở cửa: {restaurant.hours}</span>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>Hotline: {restaurant.phone}</span>
              </div>
            )}
          </div>

          {/* Lunar hours alert */}
          {restaurant.lunarHoursNote && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Lưu ý ngày Rằm & Mùng 1: </strong>
                  {restaurant.lunarHoursNote}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {restaurant.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Featured Menu items preview */}
          {restaurant.menu && restaurant.menu.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-primary" /> Món ngon nổi bật
              </h4>
              <div className="space-y-2">
                {restaurant.menu.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-foreground truncate">{item.name}</div>
                      {item.desc && (
                        <div className="text-muted-foreground truncate">{item.desc}</div>
                      )}
                    </div>
                    <span className="font-bold text-primary shrink-0">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action buttons */}
          <div className="space-y-2 pt-2 border-t">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMaps}
                className="gap-1.5 w-full text-xs font-semibold"
              >
                <Navigation className="h-3.5 w-3.5 text-primary" /> Chỉ đường Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCall}
                className="gap-1.5 w-full text-xs font-semibold"
              >
                <Phone className="h-3.5 w-3.5 text-primary" /> Đặt bàn ngay
              </Button>
            </div>

            <Button asChild className="w-full gap-1.5 font-semibold text-sm">
              <Link href={`/restaurants/${restaurant.id}`}>
                Xem chi tiết toàn trang <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
