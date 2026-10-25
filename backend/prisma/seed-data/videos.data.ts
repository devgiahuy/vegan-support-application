export interface SeedVideoDefinition {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  categorySlug: string;
  authorEmail: string;
  tags: string[];
  /** Public YouTube video, verified through YouTube oEmbed on 2026-10-26. */
  youtubeId: string;
  channelName: string;
  durationSeconds: number;
}

/** YouTube's own thumbnail for the video (480×360 `hqdefault`). */
export function youtubeThumbnail(youtubeId: string) {
  return {
    publicId: `youtube/${youtubeId}`,
    secureUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    width: 480,
    height: 360,
  };
}

// Real public videos embedded from YouTube; the platform only stores the link and description.
// Each body names the channel and points to the matching seeded recipe or handbook.
export const videoDefinitions: readonly SeedVideoDefinition[] = [
  {
    slug: 'video-nuoc-dung-pho-chay',
    title: 'Phở Chay Việt Nam: Bí Quyết Nấu Nước Dùng Ngọt Tự Nhiên',
    excerpt: 'Cách nấu nước dùng phở chay ngọt từ rau củ, gừng và hoa hồi, quế nướng.',
    body: 'Video của kênh Dzoãn Cẩm Vân (series Vân Du Chay) hướng dẫn nấu nước dùng phở chay từ rau củ và gia vị nướng, không dùng xương. Xem công thức chi tiết trong món "Phở Chay Nấm Hương Đậu Hũ".',
    categorySlug: 'van-hoa-am-thuc-chay',
    authorEmail: 'platform.contributor@example.com',
    tags: ['phở chay', 'video nấu ăn', 'nước dùng'],
    youtubeId: 'o0ZzxoezMqI',
    channelName: 'Dzoãn Cẩm Vân',
    durationSeconds: 1106,
  },
  {
    slug: 'video-15-phut-bua-toi-chay',
    title: 'Đậu Hũ Xào Sả Ớt Với Nấm Rơm – Món Chay Nhanh Cho Bữa Tối',
    excerpt: 'Món xào nhanh với đậu hũ, sả, ớt và nấm rơm, làm xong trong khoảng 20 phút.',
    body: 'Video của kênh Tú Lê Miền Tây hướng dẫn chiên đậu hũ, phi sả ớt và xào cùng nấm rơm. Món hợp bữa tối ngày bận; có thể ăn kèm cơm gạo lứt như trong các thực đơn mẫu của ứng dụng.',
    categorySlug: 'nhanh-duoi-30-phut',
    authorEmail: 'platform.contributor@example.com',
    tags: ['đậu hũ', 'món xào', 'bữa tối', 'nhanh'],
    youtubeId: 'A3XbRsGffI0',
    channelName: 'TÚ LÊ MIỀN TÂY',
    durationSeconds: 429,
  },
  {
    slug: 'video-sua-hat-sen-dau-do',
    title: 'Cách Nấu Sữa Hạt Sen Sánh Mịn Không Tách Nước',
    excerpt: 'Nấu chín hạt sen rồi xay và lọc để có sữa hạt sánh, không bị tách lớp.',
    body: 'Video của kênh Tú Lê Miền Tây hướng dẫn nấu sữa hạt sen tại nhà. Có thể kết hợp với đậu đỏ như công thức "Sữa Hạt Sen Đậu Đỏ" trong ứng dụng.',
    categorySlug: 'sua-hat',
    authorEmail: 'invited.contributor@example.com',
    tags: ['sữa hạt', 'hạt sen', 'đồ uống'],
    youtubeId: '5Yuko8btRrY',
    channelName: 'TÚ LÊ MIỀN TÂY',
    durationSeconds: 457,
  },
  {
    slug: 'video-bun-hue-chay',
    title: 'Cách Nấu Bún Huế Chay Đúng Vị',
    excerpt: 'Nước dùng sả, sa tế và các loại nấm, chả chay cho tô bún Huế chay đậm đà.',
    body: 'Video của kênh Ghiền nấu ăn (Duyen\'s Kitchen) hướng dẫn nấu bún Huế chay: nấu nước dùng ngọt từ rau củ, phi sa tế sả ớt và chuẩn bị phần topping chay. Tham khảo thêm công thức "Bún Bò Huế Chay".',
    categorySlug: 'bun-pho-va-mi',
    authorEmail: 'invited.contributor@example.com',
    tags: ['bún huế chay', 'món nước', 'video nấu ăn'],
    youtubeId: '3t9-zaDhA1o',
    channelName: 'Ghiền nấu ăn',
    durationSeconds: 574,
  },
  {
    slug: 'video-ca-ri-chay',
    title: 'Cách Nấu Cà Ri Chay Không Ngấy Trong 30 Phút',
    excerpt: 'Cà ri chay với khoai, nấm và nước cốt dừa, nêm vừa để không bị ngấy.',
    body: 'Video của kênh Ghiền nấu ăn (Duyen\'s Kitchen) hướng dẫn nấu cà ri chay khoảng 30 phút. Tham khảo công thức "Cà Ri Chay Khoai Lang Nấm Nước Cốt Dừa" để xem định lượng và giá trị dinh dưỡng.',
    categorySlug: 'mon-ham-va-ca-ri',
    authorEmail: 'platform.contributor@example.com',
    tags: ['cà ri chay', 'nước cốt dừa', 'video nấu ăn'],
    youtubeId: 'LIahLgoRtuo',
    channelName: 'Ghiền nấu ăn',
    durationSeconds: 458,
  },
  {
    slug: 'video-an-chay-truong-thieu-chat-gi',
    title: 'Ăn Chay Trường Thiếu Chất Gì, Bổ Sung Ở Đâu?',
    excerpt: 'Bác sĩ chuyên khoa dinh dưỡng giải thích các vi chất người ăn chay trường dễ thiếu.',
    body: 'Video của kênh AloBacsi với BS.CK1 Đinh Trần Ngọc Mai về những chất người ăn chay trường cần chú ý như vitamin B12, sắt, canxi, kẽm và đạm. Đọc thêm các cẩm nang về B12 và sắt, canxi, kẽm, omega-3 trong ứng dụng.',
    categorySlug: 'vi-chat-thiet-yeu',
    authorEmail: 'org.contributor@example.com',
    tags: ['dinh dưỡng', 'vi chất', 'ăn chay trường', 'bác sĩ'],
    youtubeId: 'i7yrc9zT84U',
    channelName: 'Video AloBacsi',
    durationSeconds: 1048,
  },
  {
    slug: 'video-lieu-vitamin-b12',
    title: 'Liều Vitamin B12 Tối Ưu Cho Người Trưởng Thành (tiếng Anh)',
    excerpt: 'NutritionFacts.org tóm tắt các nghiên cứu về liều và tần suất bổ sung B12.',
    body: 'Video tiếng Anh của NutritionFacts.org ("The Optimal Vitamin B12 Dosage for Adults") tổng hợp nghiên cứu về liều bổ sung B12 hằng ngày và hằng tuần. Đây là thông tin tham khảo; hãy hỏi bác sĩ trước khi chọn liều. Xem thêm cẩm nang "Vitamin B12 Cho Người Ăn Thuần Chay".',
    categorySlug: 'vi-chat-thiet-yeu',
    authorEmail: 'org.contributor@example.com',
    tags: ['vitamin b12', 'thuần chay', 'tiếng anh'],
    youtubeId: 'wY4vEBilWN4',
    channelName: 'NutritionFacts.org',
    durationSeconds: 357,
  },
] as const;
