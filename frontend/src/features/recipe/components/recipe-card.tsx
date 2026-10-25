import Link from 'next/link';
import { SafeImage } from '@/components/shared/safe-image';
import { ArrowRight, BadgeCheck, Clock, Flame, Star, User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Recipe } from '../types/recipe.model';
import { RecipeCardBookmark } from './recipe-card-bookmark';

export function RecipeCard({
  recipe,
  priority = false,
  className,
}: {
  recipe: Recipe;
  priority?: boolean;
  className?: string;
}) {
  const RECIPE_FALLBACK_COVER =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  const imageUrl = recipe.image || recipe.coverImageUrl || RECIPE_FALLBACK_COVER;
  const authorAvatar =
    (recipe.author && 'avatar' in recipe.author ? recipe.author.avatar : undefined) ||
    recipe.author?.avatarUrl ||
    '';
  const authorName = recipe.author?.name || 'Tác giả ẩn danh';
  const authorVerified =
    recipe.author && 'verified' in recipe.author ? recipe.author.verified === true : false;
  const isExpert = Boolean(
    recipe.isExpertAuthor ?? recipe.author?.isExpert ?? authorVerified ?? recipe.expertVerified
  );
  const usageCount = recipe.usageCount ?? 0;
  const rating = recipe.rating;
  const ratingCount = recipe.ratingCount;
  const minutes = recipe.minutes || recipe.totalTimeMinutes;
  const kcal = recipe.kcal ?? recipe.nutrition?.calories;
  const protein = recipe.protein ?? recipe.nutrition?.protein;

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg',
        className
      )}
    >
      <div className="relative block aspect-[4/3] overflow-hidden">
        <Link href={`/recipes/${recipe.id}`} className="absolute inset-0">
          <SafeImage
            src={imageUrl}
            fallbackSrc={RECIPE_FALLBACK_COVER}
            alt={recipe.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
          <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-background/90 text-foreground backdrop-blur">
            <Clock className="h-3 w-3" /> {minutes} phút
          </Badge>
          {recipe.dietTag && (
            <Badge className="absolute bottom-3 left-3 rounded-full bg-primary text-primary-foreground">
              {recipe.dietTag}
            </Badge>
          )}
        </Link>
        <div className="absolute right-3 top-3 z-10">
          <RecipeCardBookmark postId={recipe.id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
            <Users className="h-3.5 w-3.5" />
            {usageCount} người đang dùng
          </span>
          {typeof rating === 'number' && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="h-3.5 w-3.5 fill-cta text-cta" />
              {rating.toFixed(1)} ({ratingCount ?? 0})
            </span>
          )}
          {typeof kcal === 'number' && (
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              {kcal} kcal{typeof protein === 'number' ? ` • ${protein}g Đạm` : ''}
            </span>
          )}
          {typeof minutes === 'number' && <span>{minutes} phút</span>}
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
          <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
        </h3>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              {authorAvatar ? <AvatarImage src={authorAvatar} alt={authorName} /> : null}
              <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-medium text-foreground">{authorName}</span>
              <div className="mt-0.5 flex items-center gap-1.5">
                {isExpert ? (
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full border-emerald-500/40 bg-emerald-50 px-1.5 py-0 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <BadgeCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Chuyên gia
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-full px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                  >
                    <User className="h-3 w-3" />
                    Người dùng thường
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </article>
  );
}
