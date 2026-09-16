import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, Bookmark, Clock, Flame, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Recipe } from '../types/recipe.model';

export function RecipeCard({ recipe, className }: { recipe: Recipe; className?: string }) {
  const imageUrl =
    recipe.image ||
    recipe.coverImageUrl ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  const authorAvatar =
    (recipe.author && 'avatar' in recipe.author ? recipe.author.avatar : undefined) ||
    recipe.author?.avatarUrl ||
    '';
  const authorName = recipe.author?.name || 'Đầu bếp chay';
  const authorVerified =
    (recipe.author && 'verified' in recipe.author ? recipe.author.verified : undefined) ?? true;
  const rating = recipe.rating ?? 5.0;
  const ratingCount = recipe.ratingCount ?? 0;
  const minutes = recipe.minutes || recipe.totalTimeMinutes || 25;
  const kcal = recipe.kcal || recipe.nutrition?.calories || 250;
  const protein = recipe.protein || recipe.nutrition?.protein || 12;

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg',
        className
      )}
    >
      <Link href={`/recipes/${recipe.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
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
        <button
          type="button"
          aria-label="Lưu công thức"
          className="absolute right-3 top-3 rounded-full bg-background/90 p-2 text-foreground transition-colors hover:text-cta"
        >
          <Bookmark className={cn('h-4 w-4', recipe.saved && 'fill-current text-cta')} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Star className="h-3.5 w-3.5 fill-cta text-cta" />
            {rating.toFixed(1)} ({ratingCount})
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" />
            {kcal} kcal • {protein}g Đạm
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
          <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
        </h3>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/60">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {authorAvatar ? <AvatarImage src={authorAvatar} alt={authorName} /> : null}
              <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {authorName}
              {authorVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </article>
  );
}
