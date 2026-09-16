import type { VideoItem } from '../types/video.model';

export const MOCK_VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    title: 'Cách làm Cơm Chiên Trái Thơm Hạt Điều Giòn Thơm Không Ngán',
    description:
      'Video hướng dẫn từng bước làm món cơm chiên trái thơm chuẩn vị Thái thuần chay. Hạt cơm tơi xốp, thơm mùi dứa chín vàng và bùi béo từ hạt điều Bình Phước.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    durationLabel: '08:45',
    durationSeconds: 525,
    views: 14200,
    likes: 854,
    uploadedAt: '3 ngày trước',
    dietSchool: 'THUAN_CHAY',
    category: 'Món chính',
    author: {
      name: 'Bếp Mẹ An',
      avatar: 'https://i.pravatar.cc/80?img=45',
      verified: true,
      roleBadge: 'Chuyên gia Bếp Chay',
    },
    aiSummary: {
      dishName: 'Cơm chiên trái thơm hạt điều',
      summaryText:
        'Hệ thống AI đã lắng nghe và trích xuất tự động toàn bộ quy trình: sơ chế trái thơm tạo thố đựng cơm, kỹ thuật chiên cơm khô ráo không đọng dầu, và thời điểm thêm hạt điều rang để giữ trọn độ giòn.',
      confidenceScore: 0.96,
      detectedIngredients: [
        'Cơm nguội gạo thơm ST25 (2 chén)',
        'Trái thơm chín vừa (1 quả)',
        'Hạt điều rang muối bóc vỏ (50g)',
        'Đậu Hà Lan & bắp ngọt hạt (60g)',
        'Chả lụa chay thái hạt lựu (50g)',
        'Bột cà ri chay & hạt nêm nấm men (2 thìa)',
      ],
      timelineSteps: [
        {
          timeSeconds: 25,
          timeLabel: '00:25',
          title: 'Sơ chế và tạo hình thố thơm',
          desc: 'Khoét ruột trái thơm lấy thịt quả cắt hạt lựu, giữ lại vỏ thơm làm thố đựng đẹp mắt.',
        },
        {
          timeSeconds: 120,
          timeLabel: '02:00',
          title: 'Trộn cơm với bột cà ri chay',
          desc: 'Bóp đều cơm nguội với 1/2 thìa bột nghệ và cà ri chay để hạt cơm lên màu vàng óng.',
        },
        {
          timeSeconds: 260,
          timeLabel: '04:20',
          title: 'Xào rau củ hạt sen & chả chay',
          desc: 'Xào nhanh đậu Hà Lan, bắp ngọt và chả lụa trên chảo gang lửa lớn.',
        },
        {
          timeSeconds: 380,
          timeLabel: '06:20',
          title: 'Chiên cơm tơi giòn & cho hạt điều',
          desc: 'Đảo đều tay cho cơm săn hạt, trút thơm và hạt điều rang giòn vào đảo thêm 2 phút.',
        },
      ],
    },
  },
  {
    id: 'v2',
    title: 'Bí Quyết Làm Đậu Hũ Chiên Sả Ớt Giòn Tan Ngoài Mềm Trong',
    description:
      'Tuyệt chiêu ướp sả ớt sao cho không bị cháy khét khi chiên. Món ăn thanh đạm nhưng cực kỳ hao cơm cho bữa cơm gia đình ngày rằm.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    durationLabel: '05:30',
    durationSeconds: 330,
    views: 28900,
    likes: 1520,
    uploadedAt: '1 tuần trước',
    dietSchool: 'DAO_GIAO',
    category: 'Món chiên & rim',
    author: {
      name: 'Chay Healthy',
      avatar: 'https://i.pravatar.cc/80?img=8',
      verified: true,
      roleBadge: 'Đầu bếp Chay có kinh nghiệm',
    },
    aiSummary: {
      dishName: 'Đậu hũ chiên sả ớt giòn rụm',
      summaryText:
        'AI nhận diện kỹ thuật khía cạnh đậu hũ tạo rãnh nhồi sả và công thức sốt nước tương ướp thấm sâu vào từng thớ đậu.',
      confidenceScore: 0.94,
      detectedIngredients: [
        'Đậu hũ trắng miếng dày (4 miếng)',
        'Sả tươi băm nhuyễn (4 nhánh)',
        'Ớt sừng không cay hoặc ớt hiểm (1 trái)',
        'Hạt nêm nấm men & đường mía thô (1 thìa)',
        'Dầu thực vật chiên ngập dầu',
      ],
      timelineSteps: [
        {
          timeSeconds: 15,
          timeLabel: '00:15',
          title: 'Khía rãnh đậu hũ',
          desc: 'Dùng dao rạch ca-rô sâu 1/2 miếng đậu hũ để ngấm trọn gia vị.',
        },
        {
          timeSeconds: 90,
          timeLabel: '01:30',
          title: 'Phi sả ớt thơm giòn',
          desc: 'Phi vàng 1/2 lượng sả ớt rồi vớt ra để riêng giữ độ giòn.',
        },
        {
          timeSeconds: 210,
          timeLabel: '03:30',
          title: 'Chiên vàng đậu hũ & áo sả ớt',
          desc: 'Chiên đậu vàng đều 2 mặt, rải phần sả ớt phi thơm lên bề mặt.',
        },
      ],
    },
  },
  {
    id: 'v3',
    title: 'Gỏi Cuốn Đậu Hũ Nướng Xốt Bơ Đậu Phộng Béo Ngậy Đậm Vị',
    description:
      'Món gỏi cuốn Eat Clean giải nhiệt mùa hè, giàu protein thực vật và chất xơ. Công thức xốt bơ đậu phộng độc quyền sánh mịn thơm ngon.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
    durationLabel: '06:15',
    durationSeconds: 375,
    views: 18400,
    likes: 930,
    uploadedAt: '5 ngày trước',
    dietSchool: 'THUAN_CHAY',
    category: 'Salad & Gỏi',
    author: {
      name: 'Thảo Mộc Kitchen',
      avatar: 'https://i.pravatar.cc/80?img=44',
      verified: true,
      roleBadge: 'Food Creator Thuần Chay',
    },
    aiSummary: {
      dishName: 'Gỏi cuốn xốt bơ đậu phộng',
      summaryText:
        'AI tổng hợp các loại rau thơm ăn kèm và công thức tỉ lệ vàng 2 thìa bơ đậu phộng + 1 thìa tương đen hoisin tạo nên bát nước chấm hoàn hảo.',
      confidenceScore: 0.97,
      detectedIngredients: [
        'Bánh tráng dẻo mè đen hoặc gạo lứt',
        'Đậu hũ ướp sốt teriyaki nướng nồi chiên không dầu (200g)',
        'Xà lách thủy canh, dưa leo, cà rốt thái sợi',
        'Bơ đậu phộng mịn hữu cơ & tương đậu đen',
        'Húng lủi, tía tô, ngò gai',
      ],
      timelineSteps: [
        {
          timeSeconds: 20,
          timeLabel: '00:20',
          title: 'Nướng đậu hũ trong nồi chiên',
          desc: 'Cắt thanh dài, nướng ở 180°C trong 10 phút cho xém vàng.',
        },
        {
          timeSeconds: 130,
          timeLabel: '02:10',
          title: 'Khuấy xốt chấm bơ đậu phộng',
          desc: 'Đun ấm bơ đậu phộng với tương đen, nước ấm và giấm táo.',
        },
        {
          timeSeconds: 240,
          timeLabel: '04:00',
          title: 'Cuốn gỏi chặt tay đẹp mắt',
          desc: 'Thấm ướt bánh tráng, xếp rau xanh, cà rốt, bún tươi và đậu hũ cuộn chặt.',
        },
      ],
    },
  },
  {
    id: 'v4',
    title: 'Nấu Nồi Lẩu Nấm Dưỡng Sinh Nước Dùng Trong Vắt Ngọt Lịm',
    description:
      'Bí quyết nấu nước dùng lẩu chay từ bắp mỹ, củ sen, lê ngọt và táo đỏ không cần dùng đến bột nêm hóa học. Phù hợp cho tiệc gia đình ngày rằm.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    durationLabel: '12:10',
    durationSeconds: 730,
    views: 34100,
    likes: 2150,
    uploadedAt: '2 tuần trước',
    dietSchool: 'PHAT_GIAO',
    category: 'Lẩu chay',
    author: {
      name: 'Bếp Cô Diệu',
      avatar: 'https://i.pravatar.cc/80?img=32',
      verified: true,
      roleBadge: 'Chuyên gia Dinh dưỡng Thực dưỡng',
    },
    aiSummary: {
      dishName: 'Lẩu nấm dưỡng sinh thảo mộc',
      summaryText:
        'AI ghi nhận công thức hầm 5 loại củ quả ngọt tự nhiên và hướng dẫn thời điểm thả nấm rơm, nấm đông cô, nấm linh chi để không bị chua nước dùng.',
      confidenceScore: 0.98,
      detectedIngredients: [
        'Bắp ngọt Mỹ, củ sen, lê ngọt, cà rốt (hầm nước dùng)',
        'Nấm đùi gà, nấm linh chi trắng/nâu, nấm hương tươi (300g)',
        'Táo đỏ hữu cơ, kỷ tử khô (30g)',
        'Mướp hương & rau cúc ngọt ăn kèm',
        'Đậu hũ ky chiên giòn & tàu hũ non',
      ],
      timelineSteps: [
        {
          timeSeconds: 30,
          timeLabel: '00:30',
          title: 'Ninh nước hầm thảo mộc củ quả',
          desc: 'Cho bắp, củ sen, lê và táo đỏ hầm lửa nhỏ 30 phút.',
        },
        {
          timeSeconds: 300,
          timeLabel: '05:00',
          title: 'Sơ chế và rửa nấm đúng cách',
          desc: 'Ngâm nấm nước muối loãng 5 phút, vớt ráo để giữ vị ngọt thanh.',
        },
        {
          timeSeconds: 520,
          timeLabel: '08:40',
          title: 'Thưởng thức lẩu nấm dưỡng sinh',
          desc: 'Đun sôi nước lẩu tại bàn, nhúng nấm tươi và tàu hũ non ăn kèm bún.',
        },
      ],
    },
  },
];
