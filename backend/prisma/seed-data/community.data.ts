export interface SeedCommentItem {
  postSlug: string;
  userEmail: string;
  content: string;
  replyToUserEmail?: string;
}

export interface SeedRatingItem {
  postSlug: string;
  userEmail: string;
  taste: number;
  difficulty: number;
}

export interface SeedBookmarkItem {
  postSlug: string;
  userEmail: string;
}

export interface SeedVoteItem {
  postSlug: string;
  userEmail: string;
}

export const commentDefinitions: readonly SeedCommentItem[] = [
  {
    postSlug: 'pho-chay-ha-noi',
    userEmail: 'member@example.com',
    content: 'Nước dùng ngọt thanh và thơm nức mùi hoa hồi gừng nướng! Mình đã nấu thử cho cả nhà ăn vào sáng Chủ Nhật, ai cũng khen ngon hơn ngoài hàng.',
  },
  {
    postSlug: 'pho-chay-ha-noi',
    userEmail: 'platform.contributor@example.com',
    content: 'Cảm ơn bạn nhiều! Bạn có thể thêm một khúc mía lau nhỏ khi hầm nước dùng thì vị ngọt sẽ càng hậu và sâu hơn nữa nhé.',
    replyToUserEmail: 'member@example.com',
  },
  {
    postSlug: 'bun-bo-hue-chay',
    userEmail: 'member.weightloss@example.com',
    content: 'Món bún bò sa tế cay nồng ấm bụng rất hợp những ngày mưa. Mình giảm bớt dầu ớt một chút mà hương vị sả vẫn thơm lừng.',
  },
  {
    postSlug: 'ca-ri-chay-khoai-nam',
    userEmail: 'member.buddhist@example.com',
    content: 'Cà ri béo ngậy chấm bánh mì ngon tuyệt vời. Đậu hũ và khoai lang ngấm vị rất đậm đà.',
  },
  {
    postSlug: 'cam-nang-bo-sung-vitamin-b12',
    userEmail: 'member@example.com',
    content: 'Bài viết rất hữu ích và khoa học! Trước đây mình cứ nghĩ ăn rong biển là đủ B12, nhờ bài này mới biết phải bổ sung men dinh dưỡng tăng cường hoặc viên uống.',
  },
  {
    postSlug: 'toi-uu-nguon-dam-thuc-vat',
    userEmail: 'member@example.com',
    content: 'Rất cần những kiến thức kết hợp axit amin này cho người tập gym thuần chay. Cảm ơn bác sĩ Hoài Thu!',
  },
] as const;

export const ratingDefinitions: readonly SeedRatingItem[] = [
  { postSlug: 'pho-chay-ha-noi', userEmail: 'member@example.com', taste: 5, difficulty: 3 },
  { postSlug: 'pho-chay-ha-noi', userEmail: 'member.weightloss@example.com', taste: 5, difficulty: 3 },
  { postSlug: 'bun-bo-hue-chay', userEmail: 'member@example.com', taste: 5, difficulty: 3 },
  { postSlug: 'ca-ri-chay-khoai-nam', userEmail: 'member.buddhist@example.com', taste: 5, difficulty: 2 },
  { postSlug: 'nam-dong-co-kho-tieu', userEmail: 'member@example.com', taste: 5, difficulty: 1 },
  { postSlug: 'canh-chua-chay-nam-bo', userEmail: 'member.weightloss@example.com', taste: 4, difficulty: 2 },
  { postSlug: 'goi-cuon-chay-ngu-sac', userEmail: 'member@example.com', taste: 5, difficulty: 1 },
  { postSlug: 'banh-mi-chay-pate-nam', userEmail: 'member.weightloss@example.com', taste: 5, difficulty: 2 },
  { postSlug: 'salad-bo-dau-ga', userEmail: 'member@example.com', taste: 4, difficulty: 1 },
] as const;

export const bookmarkDefinitions: readonly SeedBookmarkItem[] = [
  { postSlug: 'pho-chay-ha-noi', userEmail: 'member@example.com' },
  { postSlug: 'ca-ri-chay-khoai-nam', userEmail: 'member@example.com' },
  { postSlug: 'cam-nang-bo-sung-vitamin-b12', userEmail: 'member@example.com' },
  { postSlug: 'toi-uu-nguon-dam-thuc-vat', userEmail: 'member@example.com' },
  { postSlug: 'pho-chay-ha-noi', userEmail: 'member.buddhist@example.com' },
  { postSlug: 'nam-dong-co-kho-tieu', userEmail: 'member.buddhist@example.com' },
  { postSlug: 'salad-bo-dau-ga', userEmail: 'member.weightloss@example.com' },
  { postSlug: 'sinh-to-xanh-cai-bo-xoi-chuoi', userEmail: 'member.weightloss@example.com' },
] as const;

export const voteDefinitions: readonly SeedVoteItem[] = [
  { postSlug: 'pho-chay-ha-noi', userEmail: 'member@example.com' },
  { postSlug: 'bun-bo-hue-chay', userEmail: 'member@example.com' },
  { postSlug: 'ca-ri-chay-khoai-nam', userEmail: 'member@example.com' },
  { postSlug: 'cam-nang-bo-sung-vitamin-b12', userEmail: 'member@example.com' },
  { postSlug: 'toi-uu-nguon-dam-thuc-vat', userEmail: 'member@example.com' },
  { postSlug: 'pho-chay-ha-noi', userEmail: 'member.buddhist@example.com' },
  { postSlug: 'salad-bo-dau-ga', userEmail: 'member.weightloss@example.com' },
] as const;
