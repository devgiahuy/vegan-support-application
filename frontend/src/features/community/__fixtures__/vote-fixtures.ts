import type { CommunitySummaryResponseDto, CommunityVoteResponseDto } from '../types/community.dto';

/** Fixture tóm tắt cộng đồng + vote (phase scaffold). */
export const communitySummaryFixture: CommunitySummaryResponseDto = {
  success: true,
  data: {
    postId: '22222222-2222-4222-8222-222222222222',
    voteCount: 128,
    rating: { count: 36, tasteAverage: 4.6, difficultyAverage: 2.4 },
    viewer: { voted: false, bookmarked: true, rating: { taste: 5, difficulty: 2 } },
  },
  meta: null,
};

export function voteFixture(voted: boolean, voteCount: number): CommunityVoteResponseDto {
  return {
    success: true,
    data: { postId: '22222222-2222-4222-8222-222222222222', voted, voteCount },
    meta: null,
  };
}
