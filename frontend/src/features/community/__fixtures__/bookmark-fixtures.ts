import type {
  CommunityBookmarkListResponseDto,
  CommunityBookmarkResponseDto,
  CommunityRatingResponseDto,
} from '../types/community.dto';

/** Fixture rating + bookmark (phase scaffold). */
export const ratingFixture: CommunityRatingResponseDto = {
  success: true,
  data: {
    postId: '22222222-2222-4222-8222-222222222222',
    rating: { taste: 5, difficulty: 2 },
    aggregate: { count: 36, tasteAverage: 4.6, difficultyAverage: 2.4 },
  },
  meta: null,
};

export function bookmarkFixture(bookmarked: boolean): CommunityBookmarkResponseDto {
  return {
    success: true,
    data: { postId: '22222222-2222-4222-8222-222222222222', bookmarked },
    meta: null,
  };
}

export const bookmarksListFixture: CommunityBookmarkListResponseDto = {
  success: true,
  data: [
    {
      postId: '22222222-2222-4222-8222-222222222222',
      type: 'RECIPE',
      slug: 'dau-hu-sot-nam',
      title: 'Đậu hũ sốt nấm',
      excerpt: 'Món chay giàu đạm cho bữa tối.',
      coverImageUrl: null,
      publishedAt: '2026-09-10T08:00:00.000Z',
      bookmarkedAt: '2026-09-15T12:00:00.000Z',
    },
    {
      postId: '66666666-6666-4666-8666-666666666666',
      type: 'VIDEO',
      slug: 'com-chien-duong-chau',
      title: 'Cơm chiên Dương Châu chay',
      excerpt: null,
      coverImageUrl: null,
      publishedAt: '2026-09-08T08:00:00.000Z',
      bookmarkedAt: '2026-09-14T12:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
};
