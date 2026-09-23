'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Clock,
  Flame,
  Dumbbell,
  Star,
  Bookmark,
  Share2,
  CalendarPlus,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Home,
  Utensils,
  Lightbulb,
  Heart,
  MessageSquare,
  Users,
  ShieldCheck,
  Leaf,
  Plus,
  Minus,
  Hourglass,
  AlertTriangle,
  Pencil,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { NutritionFactsPanel } from '@/features/food-data/components/nutrition-facts-panel';
import { RecipeCard } from './recipe-card';
import type { Recipe } from '../types/recipe.model';
import { VoteControl } from '@/components/shared/vote-control';
import { CommentSection } from '@/components/shared/comment-section';
import { CommunitySummary } from '@/features/community/components/community-summary';
import { VoteButton } from '@/features/community/components/vote-button';
import { ReportButton } from '@/components/shared/report-button';
import { ReportTargetKind } from '@/common/enums';
import { RatingInput } from '@/features/community/components/rating-input';
import { BookmarkButton } from '@/features/community/components/bookmark-button';
import { useCommunitySummaryQuery } from '@/features/community/queries/community.queries';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';
import { ReviewStatusBanner } from '@/features/review/components/review-status-banner';
import { ReviewHistoryDialog } from '@/features/review/components/review-history-dialog';

interface RecipeDetailViewProps {
  recipe: Recipe;
  relatedRecipes: Recipe[];
}

export function RecipeDetailView({ recipe, relatedRecipes }: RecipeDetailViewProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const isAuthor = Boolean(user && recipe.author?.id && user.id === recipe.author.id);
  const { data: summary } = useCommunitySummaryQuery(recipe.id);
  const canModerate = user?.role === UserRole.ADMIN || user?.role === UserRole.CONTRIBUTOR;
  const [servings, setServings] = React.useState<number>(recipe.servings || 2);
  const [isSaved, setIsSaved] = React.useState<boolean>(recipe.saved ?? false);
  const [checkedIngredients, setCheckedIngredients] = React.useState<string[]>([]);
  const [viewingNutritionIngredient, setViewingNutritionIngredient] = React.useState<{
    id?: string;
    name: string;
  } | null>(null);

  // Tỷ lệ nhân khẩu phần
  const baseServings = recipe.servings || 2;
  const ratio = servings / baseServings;

  const toggleIngredient = (name: string) => {
    setCheckedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    toast.success(
      !isSaved
        ? 'Đã lưu công thức vào mục Yêu thích của bạn!'
        : 'Đã bỏ lưu công thức khỏi danh sách yêu thích.'
    );
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết công thức vào bộ nhớ tạm!');
    }
  };

  const handleAddToMealPlan = () => {
    toast.success(`Đã thêm "${recipe.title}" vào Kế hoạch bữa ăn tuần này!`, {
      action: {
        label: 'Mở thực đơn',
        onClick: () => router.push('/meal-plans'),
      },
    });
  };

  const incompatibilities = (recipe.dietCompatibilities || []).filter((c) => !c.compatible);
  const hasCompatibilityInfo =
    (recipe.allergenCodes && recipe.allergenCodes.length > 0) ||
    (recipe.traditionWarnings && recipe.traditionWarnings.length > 0) ||
    incompatibilities.length > 0 ||
    typeof recipe.mealPlannerEligible === 'boolean';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="h-4 w-4" /> Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/recipes" className="hover:text-primary transition-colors">
          Khám phá công thức
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-primary truncate max-w-xs sm:max-w-md">
          {recipe.title}
        </span>
      </nav>

      {/* Main Grid: Left content (65%) & Right sidebar (35%) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Recipe Details */}
        <div className="space-y-8 lg:col-span-8">
          {/* Review Status Banner (hiển thị cho tác giả hoặc khi công thức chưa xuất bản) */}
          {(isAuthor || recipe.status !== 'PUBLISHED') && (
            <ReviewStatusBanner
              postId={recipe.id}
              postTitle={recipe.title}
              postStatus={recipe.status}
              revisionId={recipe.revisionId}
              revisionVersion={recipe.revisionVersion ?? recipe.version}
              publishedRevisionVersion={recipe.publishedRevisionVersion}
              isAuthor={isAuthor}
              onOpenHistory={() => setHistoryDialogOpen(true)}
              onSuccess={() => router.refresh()}
            />
          )}

          {/* History Dialog */}
          <ReviewHistoryDialog
            open={historyDialogOpen}
            onOpenChange={setHistoryDialogOpen}
            postId={recipe.id}
            postTitle={recipe.title}
          />

          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 text-xs">
                {typeof recipe.category === 'string' ? recipe.category : recipe.category?.name}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs">
                {recipe.difficultyLabel || recipe.difficulty}
              </Badge>
              {recipe.mealPlannerEligible && (
                <Badge className="gap-1 bg-emerald-500/15 px-3 py-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <Leaf className="h-3.5 w-3.5" /> Đủ điều kiện thực đơn
                </Badge>
              )}
              {(summary?.ratingCount ?? 0) > 0 && summary?.tasteAverage !== null && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 px-3 py-1 text-xs font-semibold"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {summary?.tasteAverage?.toFixed(1)} ({summary?.ratingCount} đánh giá)
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {recipe.title}
            </h1>

            {recipe.description && (
              <p className="text-base text-muted-foreground leading-relaxed">
                {recipe.description}
              </p>
            )}

            {/* Author info & Actions bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-y py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage
                    src={
                      (recipe.author && 'avatar' in recipe.author
                        ? recipe.author.avatar
                        : undefined) ||
                      recipe.author?.avatarUrl ||
                      ''
                    }
                    alt={recipe.author.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {recipe.author.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-sm sm:text-base">
                      {recipe.author.name}
                    </span>
                    {((recipe.author && 'verified' in recipe.author
                      ? recipe.author.verified
                      : undefined) ??
                      true) && <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(recipe.author && 'roleTitle' in recipe.author
                      ? recipe.author.roleTitle
                      : undefined) || 'Tác giả công thức'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <VoteControl
                  initialScore={recipe.stats?.likes ?? 0}
                  orientation="horizontal"
                  size="sm"
                  itemTitle={recipe.title}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveToggle}
                  className={cn(
                    'gap-1.5 transition-colors',
                    isSaved && 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/30'
                  )}
                >
                  <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
                  <span>{isSaved ? 'Đã lưu' : 'Lưu món'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </Button>
                <Button size="sm" onClick={handleAddToMealPlan} className="gap-1.5 font-medium">
                  <CalendarPlus className="h-4 w-4" />
                  <span>Thêm vào thực đơn</span>
                </Button>
                {isAuthor && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5 font-medium">
                    <Link href={`/recipes/${recipe.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span>Sửa công thức</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Hero Media Cover */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 shadow-md bg-muted">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs sm:text-sm font-medium">
              <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                <Clock className="h-4 w-4 text-emerald-400" /> {recipe.minutes} phút chuẩn bị & nấu
              </span>
              {(((summary?.ratingCount ?? 0) > 0 && summary?.tasteAverage !== null) ||
                (typeof recipe.ratingCount === 'number' && recipe.ratingCount > 0)) && (
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />{' '}
                  {summary?.tasteAverage?.toFixed(1) ?? recipe.rating} (
                  {summary?.ratingCount ?? recipe.ratingCount} đánh giá)
                </span>
              )}
            </div>
          </div>

          {/* Key Metrics Quick Ribbon */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-3 text-center border-border/60 bg-muted/30">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/50">
                <Flame className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">Lượng Calo</p>
              <p className="text-base font-bold text-foreground">{recipe.kcal} kcal</p>
            </Card>

            <Card className="p-3 text-center border-border/60 bg-muted/30">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50">
                <Dumbbell className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">Chất đạm (Protein)</p>
              <p className="text-base font-bold text-foreground">{recipe.protein}g</p>
            </Card>

            <Card className="p-3 text-center border-border/60 bg-muted/30">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50">
                <Utensils className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">Carbohydrate</p>
              <p className="text-base font-bold text-foreground">{recipe.carbs || 35}g</p>
            </Card>

            <Card className="p-3 text-center border-border/60 bg-muted/30">
              <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">Thời gian</p>
              <p className="text-base font-bold text-foreground">{recipe.minutes} phút</p>
            </Card>
          </div>

          {/* INGREDIENTS CHECKLIST SECTION */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 pb-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Utensils className="h-5 w-5 text-primary" /> Nguyên liệu cần chuẩn bị
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tích chọn nguyên liệu bạn đã có sẵn trong bếp
                </p>
              </div>

              {/* Servings calculator */}
              <div className="flex items-center gap-2 bg-background border rounded-lg p-1 shadow-sm">
                <span className="text-xs font-medium text-muted-foreground px-1.5 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Khẩu phần:
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs font-bold w-4 text-center">{servings}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded"
                  onClick={() => setServings(servings + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {recipe.ingredients.map((ing, idx) => {
                    const isChecked = checkedIngredients.includes(ing.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleIngredient(ing.name)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150',
                          isChecked
                            ? 'bg-primary/5 border-primary/40 text-muted-foreground line-through'
                            : 'bg-card border-border/70 hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                              isChecked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">
                            {ing.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {ing.amount}
                          </span>
                          {ing.ingredientId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title={`Xem dinh dưỡng của ${ing.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingNutritionIngredient({
                                  id: ing.ingredientId || undefined,
                                  name: ing.name,
                                });
                              }}
                            >
                              <Info className="h-3.5 w-3.5" />
                              <span className="sr-only">Xem dinh dưỡng {ing.name}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Đang cập nhật danh sách nguyên liệu chi tiết...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick-view Nutrition Dialog */}
          <Dialog
            open={Boolean(viewingNutritionIngredient?.id)}
            onOpenChange={(open) => !open && setViewingNutritionIngredient(null)}
          >
            <DialogContent className="max-w-md p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
              <DialogTitle className="sr-only">
                Dinh dưỡng {viewingNutritionIngredient?.name}
              </DialogTitle>
              {viewingNutritionIngredient?.id && (
                <NutritionFactsPanel
                  ingredientId={viewingNutritionIngredient.id}
                  className="w-full max-w-none border-0 shadow-none p-0"
                />
              )}
            </DialogContent>
          </Dialog>

          {/* STEP-BY-STEP INSTRUCTIONS */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Các bước thực hiện
            </h3>

            <div className="space-y-4">
              {(recipe.instructions || recipe.steps) &&
              (recipe.instructions || recipe.steps)!.length > 0 ? (
                (
                  (recipe.instructions || recipe.steps) as Array<{
                    stepNumber: number;
                    title?: string;
                    desc?: string;
                    instruction?: string;
                    tip?: string;
                    durationMinutes?: number;
                  }>
                ).map((step) => (
                  <Card
                    key={step.stepNumber}
                    className="border-border/60 shadow-sm overflow-hidden"
                  >
                    <CardHeader className="pb-2 pt-4 px-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {step.stepNumber}
                          </span>
                          <CardTitle className="text-base font-bold text-foreground">
                            {step.title || `Bước ${step.stepNumber}`}
                          </CardTitle>
                        </div>
                        {step.durationMinutes && (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> ~{step.durationMinutes} phút
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.desc || step.instruction}
                      </p>
                      {step.tip && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Mẹo nấu chay ngon: </span>
                            {step.tip}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : recipe.body ? (
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {recipe.body}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">
                  Đang cập nhật hướng dẫn từng bước cho công thức này...
                </Card>
              )}
            </div>
          </div>

          {/* REVIEWS & COMMUNITY FEEDBACK — chỉ hiện khi có dữ liệu thật */}
          {((recipe.reviews && recipe.reviews.length > 0) ||
            (summary?.ratingCount ?? 0) > 0 ||
            (typeof recipe.ratingCount === 'number' && recipe.ratingCount > 0)) && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> Đánh giá & Nhận xét
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ý kiến từ Chuyên gia dinh dưỡng và cộng đồng người nấu chay
                  </p>
                </div>
                {(((summary?.ratingCount ?? 0) > 0 && summary?.tasteAverage !== null) ||
                  (typeof recipe.ratingCount === 'number' && recipe.ratingCount > 0)) && (
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                    <Star className="h-5 w-5 fill-current" />
                    <span>{summary?.tasteAverage?.toFixed(1) ?? recipe.rating}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      ({summary?.ratingCount ?? recipe.ratingCount})
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {recipe.reviews && recipe.reviews.length > 0 ? (
                  <div className="space-y-4 divide-y">
                    {recipe.reviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={rev.userAvatar} alt={rev.userName} />
                              <AvatarFallback>{rev.userName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {rev.userName}
                                </span>
                                {rev.roleBadge && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-primary/10 text-primary font-medium"
                                  >
                                    {rev.roleBadge}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">{rev.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: rev.rating }).map((_, i) => (
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
                    Chưa có đánh giá nào. Hãy là người đầu tiên thử nấu và để lại nhận xét!
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tương thích & dị ứng từ backend — chỉ hiện khi có dữ liệu thật */}
          {hasCompatibilityInfo && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Tương thích & dị ứng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-sm">
                {recipe.allergenCodes && recipe.allergenCodes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Có thể chứa dị ứng:
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {recipe.allergenCodes.map((code) => (
                        <Badge
                          key={code}
                          variant="outline"
                          className="rounded-full border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        >
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {typeof recipe.mealPlannerEligible === 'boolean' && !recipe.mealPlannerEligible && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Công thức chưa đủ điều kiện đưa vào thực đơn tự động (nguyên liệu chưa chuẩn hóa
                    hết hoặc thiếu chỉ số dinh dưỡng).
                  </p>
                )}
                {recipe.traditionWarnings && recipe.traditionWarnings.length > 0 && (
                  <ul className="space-y-1.5">
                    {recipe.traditionWarnings.map((w) => (
                      <li
                        key={`${w.tradition}-${w.warningCode}`}
                        className="text-xs text-muted-foreground leading-relaxed"
                      >
                        <span className="font-semibold text-foreground">{w.tradition}:</span>{' '}
                        {w.label || w.warningCode}
                      </li>
                    ))}
                  </ul>
                )}
                {incompatibilities.map((c) => (
                  <p key={c.dietPattern} className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">{c.dietPattern}:</span> chưa
                    tương thích ({c.reasonCodes.join(', ') || 'đang cập nhật nguyên nhân'}).
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* UC-03: Community Comment & Discussion Section */}
          <div className="space-y-3 pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <CommunitySummary postId={recipe.id} />
              <VoteButton postId={recipe.id} />
              <BookmarkButton postId={recipe.id} />
              <ReportButton
                targetKind={ReportTargetKind.POST}
                targetId={recipe.id}
                authorId={recipe.author.id}
              />
            </div>
            <RatingInput
              postId={recipe.id}
              initialTaste={summary?.viewerTaste ?? 0}
              initialDifficulty={summary?.viewerDifficulty ?? 0}
            />
            <CommentSection postId={recipe.id} itemType="công thức" />
          </div>
        </div>

        {/* RIGHT COLUMN: Nutrition Breakdown & Related Recipes (Sidebar) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Nutrition Facts Detailed Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="bg-primary/5 pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Phân tích dinh dưỡng (1 khẩu phần)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm py-1 border-b">
                <span className="text-muted-foreground">Tổng năng lượng:</span>
                <span className="font-bold text-foreground">{recipe.kcal} kcal</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b">
                <span className="text-muted-foreground">Chất đạm thực vật (Protein):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {recipe.protein}g
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b">
                <span className="text-muted-foreground">Carbohydrate tinh bột lành:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {recipe.carbs || 35}g
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b">
                <span className="text-muted-foreground">Chất béo thực vật lành mạnh:</span>
                <span className="font-semibold text-foreground">{recipe.fat || 8}g</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-muted-foreground">Chất xơ tự nhiên:</span>
                <span className="font-semibold text-foreground">{recipe.fiber || 6}g</span>
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed mt-2">
                🌱 Món ăn đã được cân đối dinh dưỡng theo chuẩn tháp thực phẩm ăn chay khoa học của
                Viện Dinh Dưỡng.
              </div>
            </CardContent>
          </Card>

          {/* Related Recipes */}
          {relatedRecipes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-foreground">Món chay cùng chuyên mục</h4>
              <div className="space-y-3">
                {relatedRecipes.slice(0, 3).map((item) => (
                  <RecipeCard key={item.id} recipe={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
