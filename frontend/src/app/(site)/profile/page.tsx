'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Camera,
  Sparkles,
  Award,
  Plus,
  User,
  HeartPulse,
  BookOpen,
  CheckCircle2,
  UtensilsCrossed,
  Eye,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  BadgeCheck,
  CalendarDays,
  FileDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WhyRecommendedDialog } from '@/components/shared/why-recommended-dialog';
import { calGoalTargets } from '@/features/health/lib/bmi';

import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { SafeImage } from '@/components/shared/safe-image';
import { DeletePostDialog } from '@/features/post/components/delete-post-dialog';
import { useArticlesQuery } from '@/features/post/queries/post.queries';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useAuthStore } from '@/store/useAuthStore';
import type { Article } from '@/features/post/types/post.model';
import { useDetailedProfileQuery } from '@/features/profile/queries/profile.queries';
import { BasicProfileForm } from '@/features/profile/components/basic-profile-form';
import { HealthProfileForm } from '@/features/profile/components/health-profile-form';
import { HealthSummary } from '@/features/profile/components/health-summary';
import { DietWizard } from '@/features/diet-preferences/components/diet-wizard';
import { CurrentDietCard } from '@/features/diet-preferences/components/current-diet-card';
import { ConsentSwitch } from '@/features/recommendation/components/consent-switch';
import { BookmarksList } from '@/features/community/components/bookmarks-list';
import { ApplicationForm } from '@/features/contributor/components/application-form';
import { MyApplications } from '@/features/contributor/components/my-applications';
import { DeleteHistoryButton } from '@/features/safety/components/delete-history-button';
import { useMyApplicationsQuery } from '@/features/contributor/queries/contributor.queries';
import { ScheduleEditor } from '@/features/diet-preferences/components/schedule-editor';

type Tab = 'info' | 'health' | 'diet' | 'posts' | 'privacy' | 'contributor';

const DIET_MODES = ['Thuần chay (Vegan)', 'Chay bán phần', 'Ăn chay rằm/mùng 1'];

/** Tab Đóng góp: form nộp đơn + lịch sử đơn (1 query dùng chung cho cả 2). */
function ContributorTab() {
  const { data, isLoading, isError, refetch } = useMyApplicationsQuery();
  const apps = data?.items ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-4">
        <h3 className="text-base font-bold text-foreground">Đăng ký người đóng góp</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Đơn được duyệt không tự nâng quyền — hãy đăng nhập lại sau khi có kết quả.
        </p>
        <div className="mt-3">
          <ApplicationForm existing={apps} />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground">Lịch sử đơn của bạn</h3>
        {isLoading && <LoadingState message="Đang tải lịch sử đơn..." />}
        {isError && (
          <ErrorState title="Không tải được lịch sử đơn." onRetry={() => void refetch()} />
        )}
        {!isLoading && !isError && <MyApplications apps={apps} />}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  // Đọc tab khởi đầu từ URL một lần duy nhất lúc mount (không setState trong effect).
  const [tab, setTab] = React.useState<Tab>(() => {
    if (typeof window === 'undefined') return 'health';
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    return urlTab && ['info', 'health', 'diet', 'posts', 'privacy', 'contributor'].includes(urlTab)
      ? (urlTab as Tab)
      : 'health';
  });
  const shouldReduceMotion = useReducedMotion();
  const [healthSyncEnabled, setHealthSyncEnabled] = React.useState(true);
  const [isWhyDialogOpen, setIsWhyDialogOpen] = React.useState(false);

  const {
    data: detailedProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useDetailedProfileQuery();

  const { user } = useAuthStore();
  const { data: articlesPagination, isLoading: isArticlesLoading } = useArticlesQuery({
    limit: 50,
  });
  const { data: recipesPagination, isLoading: isRecipesLoading } = useRecipesQuery({ limit: 50 });
  const isMyPostsLoading = isArticlesLoading || isRecipesLoading;

  const [postSearch, setPostSearch] = React.useState('');
  const [postStatusFilter, setPostStatusFilter] = React.useState<
    'ALL' | 'PUBLISHED' | 'PENDING_REVIEW' | 'FLAGGED' | 'DRAFT'
  >('ALL');
  const [postToDelete, setPostToDelete] = React.useState<{
    id: string;
    title: string;
    version?: number;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Bài viết của tôi: kết hợp Công thức + Tin tức, lọc theo tác giả đang đăng nhập.
  const myPosts = React.useMemo(() => {
    if (!user) return [];
    const articles = (articlesPagination?.items || []).map((a) => ({
      id: a.id,
      type: 'BLOG' as const,
      title: a.title,
      excerpt: a.excerpt,
      coverImageUrl: a.coverImageUrl,
      status: a.status,
      statusLabel: a.statusLabel,
      categoryName: a.category.name,
      formattedPublishedAt: a.formattedPublishedAt,
      authorId: a.author.id,
      authorName: a.author.name,
      version: a.version,
    }));

    const recipes = (recipesPagination?.items || []).map((r) => ({
      id: r.id,
      type: 'RECIPE' as const,
      title: r.title,
      excerpt: r.description || '',
      coverImageUrl: r.coverImageUrl,
      status: r.status,
      statusLabel: r.statusLabel,
      categoryName: typeof r.category === 'string' ? r.category : r.category?.name || 'Món chay',
      formattedPublishedAt: r.formattedPublishedAt,
      authorId: r.author.id,
      authorName: r.author.name,
      version: r.version,
    }));

    return [...articles, ...recipes].filter(
      (p) => p.authorId === user.id || (user.displayName && p.authorName === user.displayName)
    );
  }, [articlesPagination?.items, recipesPagination?.items, user]);

  const filteredMyPosts = React.useMemo(() => {
    let list = [...myPosts];
    if (postStatusFilter !== 'ALL') {
      list = list.filter((p) => p.status === postStatusFilter);
    }
    if (postSearch.trim()) {
      const q = postSearch.toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [myPosts, postStatusFilter, postSearch]);

  const publishedCount = myPosts.filter((p) => p.status === 'PUBLISHED').length;
  const pendingCount = myPosts.filter((p) => p.status === 'PENDING_REVIEW').length;
  const flaggedCount = myPosts.filter((p) => p.status === 'FLAGGED').length;
  const draftCount = myPosts.filter((p) => p.status === 'DRAFT').length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'info', label: 'Thông tin cá nhân', icon: User },
    { id: 'health', label: 'Sức khỏe & BMI', icon: HeartPulse, badge: 'AI Phân tích' },
    { id: 'diet', label: 'Chế độ ăn', icon: UtensilsCrossed },
    { id: 'posts', label: 'Bài viết của tôi', icon: BookOpen, badge: `${myPosts.length}` },
    { id: 'privacy', label: 'Cá nhân hoá & Dữ liệu', icon: ShieldCheck, badge: 'NĐ 13/2023' },
    { id: 'contributor', label: 'Đóng góp', icon: BadgeCheck },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      {/* Profile banner — dữ liệu thật từ GET /users/me */}
      {isProfileLoading && <LoadingState message="Đang tải hồ sơ của bạn..." />}

      {isProfileError && (
        <ErrorState
          title="Không tải được hồ sơ. Vui lòng kiểm tra kết nối và thử lại."
          onRetry={() => void refetchProfile()}
        />
      )}

      {!isProfileLoading && !isProfileError && detailedProfile && (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
            <div className="relative">
              <Avatar className="h-20 w-20 rounded-2xl">
                {detailedProfile.user.avatarUrl && (
                  <AvatarImage
                    src={detailedProfile.user.avatarUrl}
                    alt={detailedProfile.user.displayName}
                    className="rounded-2xl"
                  />
                )}
                <AvatarFallback className="rounded-2xl bg-primary/10 text-2xl text-primary">
                  {detailedProfile.user.initials || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-2 -right-2 rounded-full bg-background p-1.5 shadow">
                <Camera className="h-4 w-4 text-primary" />
              </span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{detailedProfile.user.displayName}</h1>
                <Badge className="gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                  <Award className="h-3.5 w-3.5" /> {detailedProfile.user.role}
                </Badge>
                {detailedProfile.diet && (
                  <Badge variant="secondary" className="rounded-full">
                    {detailedProfile.diet.dietPatternLabel} ·{' '}
                    {detailedProfile.diet.practiceScheduleLabel}
                  </Badge>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {detailedProfile.user.email}
              </p>
              <div className="mt-3 grid max-w-md grid-cols-3 gap-4">
                <div>
                  <p className="text-lg font-bold text-primary">12</p>
                  <p className="text-xs text-muted-foreground">Công thức đăng</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">1,850</p>
                  <p className="text-xs text-muted-foreground">Điểm sống lành</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">{detailedProfile.memberSince}</p>
                  <p className="text-xs text-muted-foreground">Ngày tham gia</p>
                </div>
              </div>
            </div>
            {/* <Button asChild className="gap-1.5 rounded-full">
              <Link href="/recipes/new">
                <Plus className="h-4 w-4" /> Tạo công thức mới
              </Link>
            </Button> */}
          </CardContent>
        </Card>
      )}

      {/* Tabs Bar với Motion Animation */}
      <div className="relative mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-border/80 bg-muted/80 p-1.5 shadow-sm backdrop-blur-sm sm:grid-cols-3 lg:grid-cols-6 lg:rounded-full">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <motion.button
              key={t.id}
              type="button"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-profile-tab"
                  className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm border border-border/40"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isActive && 'scale-110 text-primary'
                )}
              />
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge && (
                <Badge
                  className={cn(
                    'hidden rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors lg:inline-flex',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'bg-primary/10 text-primary/80 hover:bg-primary/20'
                  )}
                >
                  {t.badge}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Contents với AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6"
        >
          {/* TAB: INFO — form thật (PATCH /users/me: displayName + avatarUrl).
          Ảnh upload qua POST /uploads/signature → Cloudinary rồi PATCH URL.
          Số điện thoại / bio / đổi mật khẩu không có endpoint READY nên không render. */}
          {tab === 'info' && (
            <div>
              {isProfileLoading && <LoadingState message="Đang tải thông tin..." />}
              {isProfileError && (
                <ErrorState
                  title="Không tải được thông tin hồ sơ."
                  onRetry={() => void refetchProfile()}
                />
              )}
              {!isProfileLoading && !isProfileError && detailedProfile && (
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div>
                      <h2 className="font-semibold">Thông tin chi tiết</h2>
                      <p className="text-xs text-muted-foreground">
                        Email {detailedProfile.user.email} không thể thay đổi tại đây.
                      </p>
                    </div>
                    <BasicProfileForm
                      initialDisplayName={detailedProfile.user.displayName}
                      initialAvatarUrl={detailedProfile.user.avatarUrl}
                      fallbackInitials={detailedProfile.user.initials}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB: HEALTH — dữ liệu thật (PUT /users/me/health-profile).
          Số BMI/BMR/TDEE hiển thị đúng backend trả; mục tiêu calo dùng TDEE thật. */}
          {tab === 'health' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <Card className="lg:col-span-5">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <h2 className="font-semibold">Nhập chỉ số thể trạng</h2>
                    <p className="text-sm text-muted-foreground">
                      Lưu để xem BMI, BMR và TDEE do hệ thống tính cho bạn.
                    </p>
                  </div>
                  {isProfileLoading && <LoadingState message="Đang tải..." />}
                  {isProfileError && (
                    <ErrorState
                      title="Không tải được dữ liệu sức khỏe."
                      onRetry={() => void refetchProfile()}
                    />
                  )}
                  {!isProfileLoading && !isProfileError && (
                    <HealthProfileForm initial={detailedProfile?.health ?? null} />
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6 lg:col-span-7">
                {isProfileLoading && <LoadingState message="Đang tải kết quả..." />}
                {!isProfileLoading && !isProfileError && (
                  <HealthSummary health={detailedProfile?.health ?? null} />
                )}

                {!isProfileLoading && !isProfileError && detailedProfile?.health && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="flex items-center gap-2 font-semibold">
                        <UtensilsCrossed className="h-4 w-4 text-primary" /> Mục tiêu Calo khuyến
                        nghị cho người ăn chay
                      </h2>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {calGoalTargets(detailedProfile.health.tdee).map((g) => (
                          <div
                            key={g.key}
                            className={cn(
                              'rounded-2xl border p-4',
                              g.key === 'maintain' && 'border-primary bg-primary/5'
                            )}
                          >
                            <p className="text-sm font-medium">{g.label}</p>
                            <p className="mt-2 text-xl font-bold text-primary">
                              {g.kcal.toLocaleString('vi-VN')} kcal
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{g.note}</p>
                            {g.key === 'maintain' && (
                              <Badge className="mt-2 rounded-full bg-primary text-primary-foreground">
                                Khuyên dùng
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <Sparkles className="h-4 w-4 text-primary" /> Lời khuyên dinh dưỡng từ AI
                      ChayXanh
                    </h2>
                    <ul className="mt-3 space-y-3 text-sm">
                      {[
                        'Bổ sung đạm thực vật toàn phần: cần ~65-75g protein/ngày từ tempeh, đậu hũ nướng, đậu gà và hạt gai dầu.',
                        'Tối ưu hấp thu Sắt & Vitamin C: kết hợp rau bina, cải xoăn với chanh hoặc ớt chuông đỏ trong bữa chính.',
                        'Vitamin B12 & Omega-3: người thuần chay lâu năm nên bổ sung men dinh dưỡng, hạt lanh hoặc vi tảo định kỳ.',
                      ].map((tip) => (
                        <li key={tip} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB: DIET — wizard xem trước + xác nhận chế độ ăn */}
          {tab === 'diet' && (
            <div className="space-y-4">
              {isProfileLoading && <LoadingState message="Đang tải chế độ ăn..." />}
              {isProfileError && (
                <ErrorState
                  title="Không tải được chế độ ăn."
                  onRetry={() => void refetchProfile()}
                />
              )}
              {!isProfileLoading && !isProfileError && detailedProfile?.diet && (
                <CurrentDietCard summary={detailedProfile.diet} />
              )}
              {!isProfileLoading && !isProfileError && (
                <DietWizard
                  initialSelection={
                    detailedProfile?.diet
                      ? {
                          dietPattern: detailedProfile.diet.dietPattern,
                          practiceSchedule: detailedProfile.diet.practiceSchedule,
                          tradition: detailedProfile.diet.tradition,
                        }
                      : null
                  }
                  scheduleSlot={(preference) => (
                    <ScheduleEditor initialDates={preference.schedule?.dates ?? []} />
                  )}
                />
              )}
            </div>
          )}

          {/* TAB: POSTS */}
          {tab === 'posts' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Quản lý bài viết cá nhân</h2>
                  <p className="text-xs text-muted-foreground">
                    Quản lý các bài chia sẻ dinh dưỡng, tin tức nấu chay và theo dõi trạng thái kiểm
                    duyệt từ Chuyên gia (SRS UC-02 &amp; UC-11).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" className="rounded-xl gap-1.5 shadow-sm">
                    <Link href="/articles/new">
                      <Plus className="h-4 w-4" /> Viết bài mới
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
                    <Link href="/recipes/new">
                      <UtensilsCrossed className="h-4 w-4 text-primary" /> Đăng công thức
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'ALL', label: `Tất cả (${myPosts.length})` },
                      { id: 'PUBLISHED', label: `Đã duyệt (${publishedCount})` },
                      { id: 'PENDING_REVIEW', label: `Chờ duyệt (${pendingCount})` },
                      { id: 'FLAGGED', label: `Cần sửa (${flaggedCount})` },
                      { id: 'DRAFT', label: `Bản nháp (${draftCount})` },
                    ] as const
                  ).map((f) => (
                    <Badge
                      key={f.id}
                      variant={postStatusFilter === f.id ? 'default' : 'secondary'}
                      onClick={() => setPostStatusFilter(f.id)}
                      className="rounded-full px-3 py-1 cursor-pointer text-xs transition-all"
                    >
                      {f.label}
                    </Badge>
                  ))}
                </div>
                <div className="relative sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm bài viết của bạn..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {isMyPostsLoading ? (
                  [1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
                    />
                  ))
                ) : filteredMyPosts.length > 0 ? (
                  filteredMyPosts.map((p) => {
                    const isPublished = p.status === 'PUBLISHED';
                    const isPending = p.status === 'PENDING_REVIEW';
                    const isFlagged = p.status === 'FLAGGED';

                    return (
                      <Card
                        key={p.id}
                        className="overflow-hidden border-border/70 hover:border-primary/40 transition-colors"
                      >
                        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                          <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted md:w-36">
                            <SafeImage
                              src={p.coverImageUrl || ''}
                              fallbackSrc="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&auto=format&fit=crop&q=80"
                              alt={p.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 144px"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={cn(
                                  'rounded-full text-[11px] font-medium',
                                  isPublished &&
                                    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                                  isPending &&
                                    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                                  isFlagged &&
                                    'bg-destructive/15 text-destructive border-destructive/30',
                                  p.status === 'DRAFT' && 'bg-muted text-muted-foreground'
                                )}
                              >
                                {p.statusLabel || p.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="rounded-full text-[10px] px-2 py-0.5"
                              >
                                {p.type === 'RECIPE' ? 'Công thức' : 'Tin tức'}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {p.categoryName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {p.formattedPublishedAt
                                  ? `Đăng ngày ${p.formattedPublishedAt}`
                                  : 'Chưa xuất bản'}
                              </span>
                            </div>

                            <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-1">
                              {p.title}
                            </h3>

                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {p.excerpt}
                            </p>
                          </div>

                          <div className="flex gap-1 shrink-0 self-end md:self-center">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              aria-label="Xem chi tiết"
                              className="rounded-xl"
                            >
                              <Link
                                href={
                                  p.type === 'RECIPE' ? `/recipes/${p.id}` : `/articles/${p.id}`
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {p.type === 'BLOG' && (
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                aria-label="Sửa bài viết"
                                className="rounded-xl"
                              >
                                <Link href={`/articles/${p.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Xoá bài viết"
                              className="text-destructive hover:bg-destructive/10 rounded-xl"
                              onClick={() => {
                                setPostToDelete({ id: p.id, title: p.title, version: p.version });
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed p-8 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Chưa có bài viết hoặc công thức nào trong danh mục này.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                        <Link href="/recipes/new">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Đăng công thức mới
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                        <Link href="/articles/new">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Viết tin tức mới
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <h3 className="text-base font-bold text-foreground">Nội dung đã lưu</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Món ăn và video bạn đã lưu để xem lại sau.
                </p>
                <div className="mt-3">
                  <BookmarksList />
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRIVACY & PERSONALIZATION (NĐ 13/2023) */}
          {tab === 'privacy' && (
            <div className="space-y-6">
              <Card className="border-border/70">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        Quyền riêng tư &amp; Quản trị dữ liệu cá nhân
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Quick links to Meal Plans */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border bg-primary/5 border-primary/20 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <CalendarDays className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          Kế hoạch bữa ăn & Thực đơn tuần
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Tạo thực đơn 7 ngày mới theo thể trạng hoặc xem lại các kế hoạch đã lưu
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button asChild variant="outline" size="sm" className="gap-1.5 font-medium">
                        <Link href="/meal-plans/saved">Thực đơn đã lưu</Link>
                      </Button>
                      <Button asChild size="sm" className="gap-1.5 font-semibold">
                        <Link href="/meal-plans">
                          <Plus className="h-4 w-4" /> Tạo thực đơn mới
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Consent Switches */}
                  <div className="space-y-4 divide-y">
                    <div className="pt-4 first:pt-0">
                      <ConsentSwitch />
                    </div>

                    {/* <div className="flex items-start justify-between gap-4 pt-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-foreground">
                          Đồng bộ dữ liệu thể trạng &amp; vận động (UC-13)
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Đồng bộ dữ liệu chiều cao, cân nặng, đếm bước từ Health Connect / cảm biến
                          điện thoại để tự động tính toán BMR, TDEE và đề xuất mức calo tương ứng.
                        </p>
                      </div>
                      <Switch
                        checked={healthSyncEnabled}
                        onCheckedChange={(val) => {
                          setHealthSyncEnabled(val);
                          toast.success(
                            val
                              ? 'Đã bật đồng bộ dữ liệu sức khoẻ.'
                              : 'Đã tắt đồng bộ dữ liệu sức khoẻ.'
                          );
                        }}
                      />
                    </div> */}
                  </div>

                  {/* Transparency explanation button */}
                  {/* <div className="rounded-2xl border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" /> Minh bạch thuật toán gợi ý AI
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Xem chi tiết các nguồn tín hiệu nào đang được dùng để đề xuất món ăn và thực
                        đơn cho bạn
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsWhyDialogOpen(true)}
                      className="gap-1.5 text-xs font-semibold shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Xem căn cứ giải trình
                    </Button>
                  </div> */}

                  {/* Data Rights: Download & Delete */}
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Quyền đối với dữ liệu cá nhân (Nghị định 13/2023)
                    </h4>

                    <div className="flex flex-wrap gap-3">
                      <DeleteHistoryButton />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: CONTRIBUTOR — nộp đơn + lịch sử đơn (features/contributor, fixture) */}
          {tab === 'contributor' && <ContributorTab />}
        </motion.div>
      </AnimatePresence>

      {/* Why recommended transparency dialog */}
      <WhyRecommendedDialog
        isOpen={isWhyDialogOpen}
        onClose={() => setIsWhyDialogOpen(false)}
        targetTitle="Tài khoản cá nhân & Dữ liệu hành vi"
      />

      {/* Delete Post Confirmation Dialog */}
      <DeletePostDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setPostToDelete(null);
        }}
        postId={postToDelete?.id || ''}
        postTitle={postToDelete?.title || ''}
        expectedVersion={postToDelete?.version}
        onSuccess={() => {
          setPostToDelete(null);
        }}
      />
    </div>
  );
}
