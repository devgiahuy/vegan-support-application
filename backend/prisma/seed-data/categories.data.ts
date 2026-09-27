import { CategoryType } from '@prisma/client';

export interface CategoryDefinition {
  type: CategoryType;
  name: string;
  slug: string;
  description?: string;
  parentSlug?: string;
  sortOrder: number;
}

export const categoryDefinitions: readonly CategoryDefinition[] = [
  // ==========================================
  // 1. FOOD_TYPE: Phân loại theo món ăn
  // ==========================================
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Món chính',
    slug: 'mon-chinh',
    description: 'Các món ăn giàu đạm, tinh bột và dinh dưỡng chủ đạo cho bữa trưa và tối',
    sortOrder: 10,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Cơm và ngũ cốc',
    slug: 'com-va-ngu-coc',
    description: 'Cơm gạo lứt, cơm tấm chay, xôi nếp và các loại hạt nguyên cám',
    parentSlug: 'mon-chinh',
    sortOrder: 10,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Bún, Phở và Mì',
    slug: 'bun-pho-va-mi',
    description: 'Phở chay, bún bò chay, bún riêu chay, hủ tiếu và miến xào',
    parentSlug: 'mon-chinh',
    sortOrder: 20,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Canh và súp',
    slug: 'canh-va-sup',
    description: 'Canh chua, canh rong biển, canh nấm, súp bí đỏ hạt sen thanh mát',
    parentSlug: 'mon-chinh',
    sortOrder: 30,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Món kho và rim',
    slug: 'mon-kho-va-rim',
    description: 'Nấm kho tiêu, đậu hũ kho sả ớt, rau củ kho quẹt chay đậm đà đưa cơm',
    parentSlug: 'mon-chinh',
    sortOrder: 40,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Món xào thanh vị',
    slug: 'mon-xao',
    description: 'Đậu hũ xào bông cải, măng tây xào nấm, miến xào rau củ ngũ sắc',
    parentSlug: 'mon-chinh',
    sortOrder: 50,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Món hầm và Cà ri',
    slug: 'mon-ham-va-ca-ri',
    description: 'Cà ri chay nước cốt dừa, bò kho chay từ nấm và đậu lăng ninh nhừ',
    parentSlug: 'mon-chinh',
    sortOrder: 60,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Lẩu chay sum vầy',
    slug: 'lau-chay',
    description: 'Lẩu nấm dưỡng sinh, lẩu thái chay chua cay, lẩu tiêu xanh nước ngọt',
    parentSlug: 'mon-chinh',
    sortOrder: 70,
  },

  {
    type: CategoryType.FOOD_TYPE,
    name: 'Món phụ và Ăn vặt',
    slug: 'mon-phu',
    description: 'Các món khai vị, gỏi nộm, nem chả chay và món ăn vặt lành mạnh',
    sortOrder: 20,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Gỏi và Nộm',
    slug: 'goi-va-nom',
    description: 'Gỏi ngó sen, gỏi cuốn ngũ sắc, salad bơ đậu gà thanh nhiệt',
    parentSlug: 'mon-phu',
    sortOrder: 10,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Chả giò và Món cuốn',
    slug: 'cha-gio-va-mon-cuon',
    description: 'Chả giò nấm hạt sen giòn rụm, bì cuốn chay bún tươi',
    parentSlug: 'mon-phu',
    sortOrder: 20,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Bánh mặn chay',
    slug: 'banh-man-chay',
    description: 'Bánh mì chay pate nấm, bánh bao chay, bánh xèo chay giòn rụm',
    parentSlug: 'mon-phu',
    sortOrder: 30,
  },

  {
    type: CategoryType.FOOD_TYPE,
    name: 'Tráng miệng và Thức uống',
    slug: 'trang-mieng-va-thuc-uong',
    description: 'Chè dưỡng sinh, sữa hạt nguyên chất, sinh tố xanh bổ sung năng lượng',
    sortOrder: 30,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Sữa hạt nguyên chất',
    slug: 'sua-hat',
    description: 'Sữa hạt sen, sữa đậu nành tươi, sữa hạt điều yến mạch thơm béo',
    parentSlug: 'trang-mieng-va-thuc-uong',
    sortOrder: 10,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Sinh tố và Nước ép',
    slug: 'sinh-to-va-nuoc-ep',
    description: 'Sinh tố cải bó xôi chuối chia, nước ép cần tây táo dưa leo detox',
    parentSlug: 'trang-mieng-va-thuc-uong',
    sortOrder: 20,
  },
  {
    type: CategoryType.FOOD_TYPE,
    name: 'Chè dưỡng nhan và Thanh nhiệt',
    slug: 'che-duong-nhan',
    description: 'Chè hạt sen long nhãn, chè tuyết yến táo đỏ kỷ tử',
    parentSlug: 'trang-mieng-va-thuc-uong',
    sortOrder: 30,
  },

  // ==========================================
  // 2. RECIPE_GROUP: Nhóm công thức & Bữa ăn
  // ==========================================
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Bữa sáng',
    slug: 'bua-sang',
    description: 'Các món ăn sáng nhẹ nhàng, bổ dưỡng và khởi động ngày mới',
    sortOrder: 10,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Bữa sáng nhanh dưới 15 phút',
    slug: 'bua-sang-nhanh-15-phut',
    description: 'Bánh mì chay, yến mạch ngâm, sinh tố năng lượng cho buổi sáng bận rộn',
    parentSlug: 'bua-sang',
    sortOrder: 10,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Bữa trưa',
    slug: 'bua-trua',
    description: 'Bữa trưa đầy đủ dinh dưỡng, năng lượng duy trì cho cả buổi chiều',
    sortOrder: 20,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Cơm văn phòng Meal Prep',
    slug: 'com-van-phong-meal-prep',
    description: 'Món ăn dễ chuẩn bị trước, mang hộp đi làm vẫn thơm ngon',
    parentSlug: 'bua-trua',
    sortOrder: 10,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Bữa tối',
    slug: 'bua-toi',
    description: 'Bữa tối ấm cúng cùng gia đình, dễ tiêu hóa, hỗ trợ giấc ngủ',
    sortOrder: 30,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Nhanh dưới 30 phút',
    slug: 'nhanh-duoi-30-phut',
    description: 'Công thức nấu siêu nhanh, tiết kiệm thời gian sau ngày dài làm việc',
    parentSlug: 'bua-toi',
    sortOrder: 10,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Mâm cỗ chay ngày Rằm & Vu Lan',
    slug: 'mam-co-ngay-ram',
    description: 'Thực đơn trang trọng, thanh tịnh cho ngày rằm, mùng một và lễ Vu Lan',
    sortOrder: 40,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Thực đơn giảm cân thanh lọc',
    slug: 'thuc-don-giam-can',
    description: 'Ít calo, giàu chất xơ, hỗ trợ thanh lọc và kiểm soát cân nặng bền vững',
    sortOrder: 50,
  },
  {
    type: CategoryType.RECIPE_GROUP,
    name: 'Thực đơn tăng cơ thuần chay',
    slug: 'thuc-don-tang-co',
    description: 'Giàu protein thực vật từ đậu, hạt và nấm dành cho người tập luyện thể thao',
    sortOrder: 60,
  },

  // ==========================================
  // 3. CONTENT_TOPIC: Chủ đề cẩm nang & bài viết
  // ==========================================
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Dinh dưỡng',
    slug: 'dinh-duong',
    description: 'Khoa học dinh dưỡng thực vật, vi chất và cân bằng bữa ăn',
    sortOrder: 10,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Kiến thức protein',
    slug: 'kien-thuc-protein',
    description: 'Cách phối hợp các nguồn đạm thực vật để hấp thu tối ưu',
    parentSlug: 'dinh-duong',
    sortOrder: 10,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Vi chất thiết yếu (B12, Sắt, Canxi)',
    slug: 'vi-chat-thiet-yeu',
    description: 'Hướng dẫn kiểm tra, bổ sung và hấp thu vi chất vi lượng thiết yếu',
    parentSlug: 'dinh-duong',
    sortOrder: 20,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Lối sống xanh',
    slug: 'loi-song-xanh',
    description: 'Bảo vệ môi trường, giảm thiểu lãng phí thực phẩm và sống bền vững',
    sortOrder: 20,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Bí quyết bảo quản và Meal Prep',
    slug: 'bi-quyet-bao-quan-meal-prep',
    description: 'Mẹo giữ rau củ tươi lâu, kỹ năng sơ chế nguyên liệu tuần',
    parentSlug: 'loi-song-xanh',
    sortOrder: 10,
  },
  {
    type: CategoryType.CONTENT_TOPIC,
    name: 'Văn hóa ẩm thực chay',
    slug: 'van-hoa-am-thuc-chay',
    description: 'Truyền thống ăn chay Phật giáo, ẩm thực chay ba miền và câu chuyện truyền cảm hứng',
    sortOrder: 30,
  },
] as const;
