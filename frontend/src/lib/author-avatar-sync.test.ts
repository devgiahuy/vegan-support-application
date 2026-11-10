import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CommentStatus,
  MemberStatus,
  PostStatus,
  RecipeDifficulty,
  UserRole,
  VideoSource,
} from '@/common/enums';
import type { User } from '@/features/auth/types/auth.model';
import type { CommunityComment } from '@/features/community/types/community.model';
import type { Article } from '@/features/post/types/post.model';
import type { Recipe } from '@/features/recipe/types/recipe.model';
import type { Video } from '@/features/video/types/video.model';

const authMockState = vi.hoisted(() => ({
  user: null as User | null,
  token: null as string | null,
  isAuthenticated: false,
}));

function setMockAuthUser(user: User | null) {
  authMockState.user = user;
  authMockState.token = user ? 'mock-token' : null;
  authMockState.isAuthenticated = Boolean(user);
}

vi.mock('@/store/useAuthStore', () => {
  type AuthSlice = {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
  };
  function useAuthStoreMock(): AuthSlice;
  function useAuthStoreMock<T>(selector: (state: AuthSlice) => T): T;
  function useAuthStoreMock<T>(selector?: (state: AuthSlice) => T): T | AuthSlice {
    const slice: AuthSlice = {
      token: authMockState.token,
      user: authMockState.user,
      isAuthenticated: authMockState.isAuthenticated,
    };
    return selector ? selector(slice) : slice;
  }
  return { useAuthStore: useAuthStoreMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/recipes/rec-1',
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children?: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children?: React.ReactNode; className?: string }) =>
    React.createElement('div', { 'data-slot': 'avatar', className }, children),
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) =>
    React.createElement('img', { 'data-avatar-src': src ?? '', alt: alt ?? '' }),
  AvatarFallback: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', { 'data-avatar-fallback': 'true' }, children),
}));

vi.mock('@/components/shared/safe-image', () => ({
  VIDEO_FALLBACK_COVER: 'https://example.com/video-fallback.jpg',
  resolveVideoCover: (url?: string) => url || 'https://example.com/video-fallback.jpg',
  SafeImage: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
}));

vi.mock('@/components/shared/vote-control', () => ({
  VoteControl: () => React.createElement('div', { 'data-mock': 'vote-control' }),
}));

vi.mock('@/components/shared/comment-section', () => ({
  CommentSection: () => React.createElement('div', { 'data-mock': 'comment-section' }),
}));

vi.mock('@/components/shared/report-button', () => ({
  ReportButton: () => React.createElement('button', { type: 'button' }, 'Báo cáo'),
}));

vi.mock('@/features/community/components/community-summary', () => ({
  CommunitySummary: () => React.createElement('div'),
}));

vi.mock('@/features/community/components/vote-button', () => ({
  VoteButton: () => React.createElement('button', { type: 'button' }, 'Vote'),
}));

vi.mock('@/features/community/components/bookmark-button', () => ({
  BookmarkButton: () => React.createElement('button', { type: 'button' }, 'Lưu'),
}));

vi.mock('@/features/community/queries/community.queries', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/community/queries/community.queries')>();
  return {
    ...actual,
    useCommunitySummaryQuery: () => ({ data: null }),
    useDeleteCommentMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useRatingMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  };
});

vi.mock('@/features/community/components/comment-form', () => ({
  CommentForm: () => React.createElement('form'),
}));

vi.mock('@/features/recipe/components/recipe-card-bookmark', () => ({
  RecipeCardBookmark: () => React.createElement('button', { type: 'button' }),
}));

vi.mock('@/features/recipe-nutrition/components/recipe-nutrition-card', () => ({
  RecipeNutritionCard: () => React.createElement('div'),
}));

vi.mock('@/features/food-data/components/nutrition-facts-panel', () => ({
  NutritionFactsPanel: () => React.createElement('div'),
}));

vi.mock('@/features/review/components/review-status-banner', () => ({
  ReviewStatusBanner: () => React.createElement('div'),
}));

vi.mock('@/features/review/components/review-history-dialog', () => ({
  ReviewHistoryDialog: () => React.createElement('div'),
}));

vi.mock('@/features/video/components/video-player', () => ({
  VideoPlayer: () => React.createElement('div'),
}));

vi.mock('@/features/post/components/delete-post-dialog', () => ({
  DeletePostDialog: () => React.createElement('div'),
}));

import { CommentItem } from '@/features/community/components/comment-item';
import { PostCard } from '@/features/post/components/post-card';
import { PostDetailView } from '@/features/post/components/post-detail-view';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { RecipeDetailView } from '@/features/recipe/components/recipe-detail-view';
import { VideoCard } from '@/features/video/components/video-card';
import { VideoDetailView } from '@/features/video/components/video-detail-view';

function renderWithQuery(node: React.ReactElement): string {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderToStaticMarkup(
    React.createElement(QueryClientProvider, { client: queryClient }, node)
  );
}

function makeUser(overrides?: Partial<User>): User {
  return {
    id: 'author-1',
    email: 'contributor@example.com',
    displayName: 'Demo Platform Contributor',
    avatarUrl: 'https://res.cloudinary.com/demo/image/upload/account-avatar.jpg',
    role: UserRole.CONTRIBUTOR,
    status: MemberStatus.ACTIVE,
    createdAt: null,
    contributorApplication: null,
    initials: 'DC',
    ...overrides,
  };
}

function makeRecipe(authorOverrides?: Partial<Recipe['author']>): Recipe {
  return {
    id: 'rec-1',
    title: 'Đậu hũ sốt nấm',
    status: PostStatus.PUBLISHED,
    version: 1,
    author: {
      id: 'author-1',
      name: 'Tên tác giả cũ',
      avatarUrl: 'https://example.com/stale-avatar.jpg',
      avatar: 'https://example.com/stale-avatar.jpg',
      ...authorOverrides,
    },
    category: { id: 'cat-1', name: 'Món kho' },
    coverImageUrl: 'https://example.com/recipe.jpg',
    image: 'https://example.com/recipe.jpg',
    minutes: 25,
    kcal: 280,
    protein: 14,
    difficulty: RecipeDifficulty.EASY,
    difficultyLabel: 'Dễ làm',
    ingredients: [],
    steps: [],
    stats: { views: 0, likes: 0, comments: 0 },
  };
}

function makeVideo(authorOverrides?: Partial<Video['author']>): Video {
  return {
    id: 'vid-1',
    title: 'Video nấu canh chua chay',
    slug: 'video-nau-canh-chua-chay',
    status: PostStatus.PUBLISHED,
    statusLabel: 'Đã xuất bản',
    version: 1,
    author: {
      id: 'author-1',
      name: 'Tên tác giả cũ',
      avatarUrl: 'https://example.com/stale-avatar.jpg',
      ...authorOverrides,
    },
    category: { id: 'cat-1', name: 'Canh' },
    coverImageUrl: 'https://example.com/video.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=mushroom001',
    videoSource: VideoSource.YOUTUBE,
    durationSeconds: 180,
    formattedDuration: '03:00',
    description: 'Hướng dẫn nấu canh chua chay.',
    ingredients: [],
    steps: [],
    publishedAt: null,
    formattedPublishedAt: '',
    stats: { views: 0, likes: 0, comments: 0 },
  };
}

function makeArticle(authorOverrides?: Partial<Article['author']>): Article {
  return {
    id: 'art-1',
    title: 'Bổ sung vitamin B12 khi ăn chay',
    slug: 'bo-sung-vitamin-b12',
    status: PostStatus.PUBLISHED,
    statusLabel: 'Đã xuất bản',
    version: 1,
    author: {
      id: 'author-1',
      name: 'Tên tác giả cũ',
      avatarUrl: 'https://example.com/stale-avatar.jpg',
      ...authorOverrides,
    },
    category: { id: 'cat-1', name: 'Dinh dưỡng' },
    coverImageUrl: 'https://example.com/article.jpg',
    excerpt: 'Tóm tắt bài viết.',
    content: 'Nội dung bài viết.',
    tags: [],
    readingTimeMinutes: 3,
    publishedAt: null,
    formattedPublishedAt: '',
    stats: { views: 0, likes: 0, comments: 0 },
  };
}

function makeComment(
  authorOverrides?: Partial<NonNullable<CommunityComment['author']>>
): CommunityComment {
  return {
    id: 'cmt-1',
    postId: 'rec-1',
    parentId: null,
    content: 'Món này rất dễ làm.',
    status: CommentStatus.VISIBLE,
    isPlaceholder: false,
    author: {
      id: 'author-1',
      displayName: 'Tên tác giả cũ',
      avatarUrl: 'https://example.com/stale-avatar.jpg',
      ...authorOverrides,
    },
    editedAt: null,
    createdAt: null,
    replies: [],
  };
}

describe('Đồng bộ avatar tài khoản trên /recipes/:id, /videos/:id, /articles/:id và bình luận', () => {
  beforeEach(() => {
    setMockAuthUser(null);
  });

  it('RecipeDetailView và RecipeCard ưu tiên avatar/tên mới nhất của tài khoản tác giả', () => {
    setMockAuthUser(makeUser());
    const html = renderWithQuery(
      React.createElement(RecipeDetailView, {
        recipe: makeRecipe(),
        relatedRecipes: [makeRecipe({ id: 'author-1', name: 'Cũ' })],
      })
    );

    expect(html).toContain(
      'data-avatar-src="https://res.cloudinary.com/demo/image/upload/account-avatar.jpg"'
    );
    expect(html).toContain('Demo Platform Contributor');
    expect(html).not.toContain('stale-avatar.jpg');
    expect(html).not.toContain('pravatar.cc');

    const cardHtml = renderWithQuery(React.createElement(RecipeCard, { recipe: makeRecipe() }));
    expect(cardHtml).toContain(
      'data-avatar-src="https://res.cloudinary.com/demo/image/upload/account-avatar.jpg"'
    );
  });

  it('RecipeDetailView hiển thị fallback initials khi user xóa ảnh hoặc tác giả chưa có ảnh (không ảnh giả)', () => {
    setMockAuthUser(makeUser({ avatarUrl: '', initials: 'DC' }));
    const html = renderWithQuery(
      React.createElement(RecipeDetailView, {
        recipe: makeRecipe(),
        relatedRecipes: [],
      })
    );
    expect(html).not.toContain('data-avatar-src=');
    expect(html).toContain('<span data-avatar-fallback="true">DC</span>');

    setMockAuthUser(null);
    const guestHtml = renderWithQuery(
      React.createElement(RecipeDetailView, {
        recipe: makeRecipe({
          id: 'author-2',
          name: 'Demo Platform Contributor',
          avatarUrl: null,
          avatar: undefined,
        }),
        relatedRecipes: [],
      })
    );
    expect(guestHtml).not.toContain('data-avatar-src=');
    expect(guestHtml).not.toContain('pravatar.cc');
    expect(guestHtml).toContain('<span data-avatar-fallback="true">DC</span>');
  });

  it('VideoDetailView và VideoCard đồng bộ avatar tài khoản tác giả và ẩn img khi xóa avatar', () => {
    setMockAuthUser(makeUser());
    const detailHtml = renderWithQuery(
      React.createElement(VideoDetailView, {
        video: makeVideo(),
        relatedVideos: [makeVideo({ id: 'author-1' })],
      })
    );
    expect(detailHtml).toContain(
      'data-avatar-src="https://res.cloudinary.com/demo/image/upload/account-avatar.jpg"'
    );
    expect(detailHtml).toContain('Demo Platform Contributor');
    expect(detailHtml).not.toContain('stale-avatar.jpg');

    const cardHtml = renderWithQuery(React.createElement(VideoCard, { video: makeVideo() }));
    expect(cardHtml).toContain(
      'data-avatar-src="https://res.cloudinary.com/demo/image/upload/account-avatar.jpg"'
    );

    setMockAuthUser(makeUser({ avatarUrl: '', initials: 'DC' }));
    const removedHtml = renderWithQuery(
      React.createElement(VideoDetailView, {
        video: makeVideo(),
        relatedVideos: [],
      })
    );
    expect(removedHtml).not.toContain('data-avatar-src=');
    expect(removedHtml).toContain('<span data-avatar-fallback="true">DC</span>');
  });

  it('PostDetailView (/articles/:id) và PostCard đồng bộ avatar ở cả header, khung tác giả và bài liên quan', () => {
    setMockAuthUser(makeUser());
    const detailHtml = renderWithQuery(
      React.createElement(PostDetailView, {
        post: makeArticle(),
        relatedPosts: [{ ...makeArticle(), id: 'art-2' }],
      })
    );
    const avatarOccurrences =
      detailHtml.match(
        /data-avatar-src="https:\/\/res\.cloudinary\.com\/demo\/image\/upload\/account-avatar\.jpg"/g
      ) ?? [];
    expect(avatarOccurrences.length).toBe(3);
    expect(detailHtml).not.toContain('stale-avatar.jpg');

    const horizontalCardHtml = renderWithQuery(
      React.createElement(PostCard, { post: makeArticle(), horizontal: true })
    );
    expect(horizontalCardHtml).toContain(
      'data-avatar-src="https://res.cloudinary.com/demo/image/upload/account-avatar.jpg"'
    );

    setMockAuthUser(makeUser({ avatarUrl: '', initials: 'DC' }));
    const removedHtml = renderWithQuery(
      React.createElement(PostDetailView, {
        post: makeArticle(),
        relatedPosts: [],
      })
    );
    expect(removedHtml).not.toContain('data-avatar-src=');
    expect(removedHtml).toContain('<span data-avatar-fallback="true">DC</span>');
  });

  it('CommentItem hiển thị avatar thật từ API và đồng bộ khi chủ bình luận cập nhật hoặc xóa avatar', () => {
    const otherUserHtml = renderWithQuery(
      React.createElement(CommentItem, {
        comment: makeComment({
          id: 'other-user',
          displayName: 'Bác sĩ Minh',
          avatarUrl: 'https://example.com/minh.jpg',
        }),
        postId: 'rec-1',
        onReply: vi.fn(),
      })
    );
    expect(otherUserHtml).toContain('data-avatar-src="https://example.com/minh.jpg"');
    expect(otherUserHtml).toContain('Bác sĩ Minh');

    setMockAuthUser(makeUser());
    const ownerHtml = renderWithQuery(
      React.createElement(CommentItem, {
        comment: makeComment(),
        postId: 'rec-1',
        onReply: vi.fn(),
      })
    );
    expect(ownerHtml).toContain(
      'data-avatar-src="https://res.cloudinary.com/demo/image/upload/account-avatar.jpg"'
    );
    expect(ownerHtml).toContain('Demo Platform Contributor');

    setMockAuthUser(makeUser({ avatarUrl: '', initials: 'DC' }));
    const removedHtml = renderWithQuery(
      React.createElement(CommentItem, {
        comment: makeComment(),
        postId: 'rec-1',
        onReply: vi.fn(),
      })
    );
    expect(removedHtml).not.toContain('data-avatar-src=');
    expect(removedHtml).toContain('<span data-avatar-fallback="true">DC</span>');
  });
});
