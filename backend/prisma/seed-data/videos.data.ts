export interface SeedVideoDefinition {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  categorySlug: string;
  authorEmail: string;
  tags: string[];
  youtubeId: string;
  durationSeconds: number;
  videoUrl?: string;
  videoBytes?: number;
  coverMedia: {
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    bytes: number;
  };
}

export const videoDefinitions: readonly SeedVideoDefinition[] = [
  // 1. Video Bí quyết nước dùng Phở Chay
  {
    slug: 'video-nuoc-dung-pho-chay',
    title: 'Video Hướng Dẫn: Bí Quyết Nấu Nước Dùng Phở Chay Ngọt Thanh Tự Nhiên Không Mì Chính',
    excerpt: 'Từng bước nướng thơm gia vị, ninh củ quả và hầm nấm sen tạo vị ngọt thanh sâu lắng.',
    body: 'Trong video dài 12 phút này, Bếp Trưởng Minh Tâm sẽ chia sẻ kỹ thuật hãm lửa và chọn nguyên liệu củ quả theo tỷ lệ vàng để nước phở trong veo, ngọt thanh tự nhiên mà không cần bất kỳ hạt nêm công nghiệp nào.',
    categorySlug: 'van-hoa-am-thuc-chay',
    authorEmail: 'platform.contributor@example.com',
    tags: ['phở chay', 'video nấu ăn', 'nước dùng', 'bếp chay'],
    youtubeId: 'phoChayTutorial01',
    durationSeconds: 720,
    videoUrl: '/seed/videos/video-pho-nuoc-dung.mp4',
    videoBytes: 13462323,
    coverMedia: {
      publicId: 'seed/recipes/pho-chay-ha-noi',
      secureUrl: '/seed/recipes/pho-chay-ha-noi.png',
      width: 1200,
      height: 800,
      bytes: 655114,
    },
  },

  // 2. Video 15 Phút Meal Prep
  {
    slug: 'video-15-phut-bua-toi-chay',
    title: 'Video Hướng Dẫn: 15 Phút Nấu Bữa Tối Chay Nhanh Gọn Cho Người Bận Rộn',
    excerpt: 'Cách sắp xếp gian bếp và chuẩn bị 2 món xào - canh nóng hổi chỉ trong 15 phút.',
    body: 'Video hướng dẫn thao tác song song giữa bếp xào đậu hũ bông cải và nồi canh chua thanh mát. Phù hợp cho các bạn trẻ văn phòng sau giờ làm tan ca.',
    categorySlug: 'nhanh-duoi-30-phut',
    authorEmail: 'platform.contributor@example.com',
    tags: ['meal prep', '15 phút', 'bữa tối', 'nhanh'],
    youtubeId: 'quickDinner15m',
    durationSeconds: 900,
    videoUrl: '/seed/videos/video-bua-toi-15-phut.mp4',
    videoBytes: 12083292,
    coverMedia: {
      publicId: 'seed/recipes/canh-chua-chay-nam-bo',
      secureUrl: '/seed/recipes/canh-chua-chay-nam-bo.jpg',
      width: 1200,
      height: 800,
      bytes: 78366,
    },
  },

  // 3. Video Làm Sữa Hạt Sen Đậu Đỏ
  {
    slug: 'video-sua-hat-sen-dau-do',
    title: 'Video Hướng Dẫn: Nấu Sữa Hạt Sen Đậu Đỏ Thơm Béo Mịn Bằng Máy Xay Sinh Tố',
    excerpt: 'Cách làm sữa hạt sánh dẻo tại nhà không tách nước, không cần lọc bỏ bã.',
    body: 'Video chia sẻ mẹo nấu chín hạt sen và đậu đỏ trước khi xay cùng yến mạch để ly sữa hạt mịn màng, giàu chất xơ hòa tan và giữ trọn hương thơm tự nhiên.',
    categorySlug: 'sua-hat',
    authorEmail: 'invited.contributor@example.com',
    tags: ['sữa hạt', 'hạt sen', 'thức uống dưỡng nhan', 'máy xay sinh tố'],
    youtubeId: 'nutMilkTutorial',
    durationSeconds: 540,
    videoUrl: '/seed/videos/video-sua-hat-sen.mp4',
    videoBytes: 9181510,
    coverMedia: {
      publicId: 'seed/recipes/sua-hat-sen-dau-do',
      secureUrl: '/seed/recipes/sua-hat-sen-dau-do.jpg',
      width: 1200,
      height: 800,
      bytes: 44635,
    },
  },
] as const;
