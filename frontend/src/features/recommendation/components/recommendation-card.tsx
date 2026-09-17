import Link from 'next/link';
import { ArrowRight, Clock, Flame, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/shared/safe-image';
import { cn } from '@/lib/utils';
import type { Recommendation } from '../types/recommendation.model';
import { ReasonBadges } from './reason-badges';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

/**
 * Card 1 món gợi ý được đồng bộ tỉ lệ và phong cách thiết kế chuẩn mực với RecipeCard:
 * - Ảnh chuẩn tỉ lệ 4:3 phủ kín (object-cover) chống hở viền xám.
 * - Bo góc rounded-2xl, viền border-border/70, hiệu ứng hover nhấc nhẹ (-translate-y-1).
 * - Nhãn thời gian, calo, đánh giá và lý do gợi ý được bố trí cân đối, gọn gàng.
 */
export function RecommendationCard({
  item,
  className,
}: {
  item: Recommendation;
  className?: string;
}) {
  const href = `/recipes/${item.slug || item.id}`;
  const coverImage = item.coverImageUrl || FALLBACK_COVER;

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg',
        className
      )}
    >
      {/* 1. Phần ảnh tỉ lệ 4:3 phủ kín với hiệu ứng zoom khi hover */}
      <Link href={href} className="relative block aspect-[4/3] w-full overflow-hidden bg-muted">
        <SafeImage
          src={coverImage}
          fallbackSrc={FALLBACK_COVER}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badge thời gian nấu trên ảnh */}
        {item.cookTimeMinutes > 0 && (
          <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-background/90 text-foreground backdrop-blur text-xs font-medium shadow-xs">
            <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            {item.cookTimeMinutes} phút
          </Badge>
        )}

        {/* Badge độ khó trên ảnh góc phải */}
        {item.difficultyLabel && (
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 rounded-full bg-background/90 text-foreground backdrop-blur text-xs font-medium shadow-xs"
          >
            {item.difficultyLabel}
          </Badge>
        )}
      </Link>

      {/* 2. Phần nội dung thông tin món ăn */}
      <div className="flex flex-1 flex-col p-4">
        {/* Hàng chỉ số dinh dưỡng & đánh giá */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.calories !== null && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              {item.calories} kcal
            </span>
          )}

          {item.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {item.ratingAverage.toFixed(1)} ({item.ratingCount})
            </span>
          )}
        </div>

        {/* Tiêu đề món ăn */}
        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary transition-colors">
          <Link href={href}>{item.title}</Link>
        </h3>

        {/* Badges lý do gợi ý */}
        {item.reasonCodes.length > 0 && (
          <div className="mt-2.5">
            <ReasonBadges codes={item.reasonCodes} labels={item.reasonLabels} />
          </div>
        )}

        {/* 3. Nút hành động xem công thức ở đáy card */}
        <div className="mt-auto pt-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-border/80 font-medium transition-all duration-200 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <Link href={href} className="inline-flex items-center justify-center gap-1.5">
              <span>Xem công thức</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
