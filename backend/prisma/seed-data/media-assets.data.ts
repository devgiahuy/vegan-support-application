import { MediaKind, MediaResourceType } from '@prisma/client';

export interface SeedMediaAssetItem {
  id?: string;
  publicId: string;
  secureUrl: string;
  resourceType: MediaResourceType;
  kind: MediaKind;
  ownerEmail: string;
  mimeType: string;
  extension: string;
  bytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  description: string;
  aspectRatio: string;
  recommendedResolution: string;
}

export const mediaAssetDefinitions: readonly SeedMediaAssetItem[] = [
  // ==========================================
  // 1. RECIPE COVERS (Ảnh bìa món ăn - Tỉ lệ 16:9 hoặc 4:3)
  // ==========================================
  {
    publicId: 'seed/recipes/bun-bo-hue-chay',
    secureUrl: '/seed/recipes/bun-bo-hue-chay.png',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'invited.contributor@example.com',
    mimeType: 'image/png',
    extension: '.png',
    bytes: 898898,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Tô Bún Bò Huế chay màu nước dùng đỏ sa tế sả ớt bắt mắt, sợi bún to, chả lụa chay, đậu hũ chiên phồng, nấm đùi gà cắt lát, ăn kèm đĩa bắp chuối bào và rau thơm.',
  },
  {
    publicId: 'seed/recipes/ca-ri-chay-khoai-nam',
    secureUrl: '/seed/recipes/ca-ri-chay-khoai-nam.png',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'platform.contributor@example.com',
    mimeType: 'image/png',
    extension: '.png',
    bytes: 1326504,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Tô Cà Ri Chay màu vàng nghệ óng ả sóng sánh nước cốt dừa, có khoai lang mật, cà rốt tỉa hoa, nấm bào ngư xám và đậu hũ rán, ăn kèm ổ bánh mì nướng giòn.',
  },
  {
    publicId: 'seed/recipes/nam-dong-co-kho-tieu',
    secureUrl: '/seed/recipes/nam-dong-co-kho-tieu.png',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'platform.contributor@example.com',
    mimeType: 'image/png',
    extension: '.png',
    bytes: 1073405,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Tộ đất kho Nấm Đông Cô tai dày bóng mượt, sốt kẹo màu cánh gián, rắc tiêu xanh nguyên chùm và tiêu đen xay thơm nức mũi.',
  },
  {
    publicId: 'seed/recipes/canh-chua-chay-nam-bo',
    secureUrl: '/seed/recipes/canh-chua-chay-nam-bo.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'platform.contributor@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 78366,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Bát Canh Chua Chay Nam Bộ rực rỡ sắc màu: cà chua đỏ mọng, dứa vàng ươm, đậu bắp xanh non, bắp ngọt, đậu hũ non trắng mềm và ngò gai ngò rí.',
  },
  {
    publicId: 'seed/recipes/sup-bi-do-kem-dua',
    secureUrl: '/seed/recipes/sup-bi-do-kem-dua.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'org.contributor@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 34827,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Bát Súp Bí Đỏ màu cam ấm áp sánh mịn, rưới vệt nước cốt dừa trang trí hình xoắn ốc nghệ thuật, rắc hạt bí ngô xanh giòn tan lên bề mặt.',
  },
  {
    publicId: 'seed/recipes/chao-yen-mach-nam-huong',
    secureUrl: '/seed/recipes/chao-yen-mach-nam-huong.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'invited.contributor@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 47063,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Bát Cháo Yến Mạch sánh dẻo thơm phức mùi dầu mè, nấm hương xào thơm, hạt sen ninh bở và chút ngò rí tiêu xay rắc nhẹ.',
  },
  {
    publicId: 'seed/recipes/salad-bo-dau-ga',
    secureUrl: '/seed/recipes/salad-bo-dau-ga.webp',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'org.contributor@example.com',
    mimeType: 'image/webp',
    extension: '.webp',
    bytes: 762789,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Đĩa Salad Bơ Quả Đậu Gà tươi mọng: bơ sáp cắt miếng vuông, đậu gà bùi bở, cà chua bi, cải bó xôi non và hạt chia rắc nhẹ cùng sốt chanh dây.',
  },
  {
    publicId: 'seed/recipes/sua-hat-sen-dau-do',
    secureUrl: '/seed/recipes/sua-hat-sen-dau-do.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'invited.contributor@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 44635,
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    recommendedResolution: '1200 x 800 px',
    description:
      'Cốc gốm đựng Sữa Hạt Sen Đậu Đỏ màu hồng phớt ấm áp, có làn khói nhẹ bay lên, bên cạnh là hũ thủy tinh đựng hạt sen và đậu đỏ khô.',
  },

  // ==========================================
  // 2. HANDBOOK COVERS (Ảnh bìa cẩm nang - Tỉ lệ 16:9)
  // ==========================================
  {
    publicId: 'seed/handbooks/meal-prep-cover',
    secureUrl: '/seed/handbooks/meal-prep-cover.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.COVER_IMAGE,
    ownerEmail: 'platform.contributor@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 39996,
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    recommendedResolution: '1200 x 675 px',
    description:
      'Hình chụp góc thẳng từ trên xuống (flat lay) 5 hộp thủy tinh meal prep đựng các món cơm gạo lứt, rau củ nướng và đậu hũ ngăn nắp cho 5 ngày làm việc.',
  },

  // ==========================================
  // 3. FRIDGE VISION IMAGES (Ảnh chụp ngăn mát tủ lạnh)
  // ==========================================
  {
    id: '21000000-0000-4000-8000-000000000001',
    publicId: 'seed/vision/fridge-primary',
    secureUrl: '/seed/vision/fridge-scan-sample.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.FRIDGE_IMAGE,
    ownerEmail: 'member@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 40800,
    width: 1280,
    height: 960,
    aspectRatio: '4:3',
    recommendedResolution: '1280 x 960 px',
    description:
      'Ảnh chụp chính diện ngăn mát tủ lạnh gia đình: nhìn rõ 2 bìa đậu hũ trắng trong hộp nước, 1 cây bông cải xanh, 3 củ cà rốt và một khay nấm bào ngư tươi.',
  },
  {
    id: '21000000-0000-4000-8000-000000000002',
    publicId: 'seed/vision/fridge-secondary',
    secureUrl: '/seed/vision/my-lunch-bowl.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.FRIDGE_IMAGE,
    ownerEmail: 'member@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 56190,
    width: 1280,
    height: 960,
    aspectRatio: '4:3',
    recommendedResolution: '1280 x 960 px',
    description: 'Ảnh chụp bữa trưa thanh đạm rau củ và hạt đậu trong tô salad.',
  },

  // ==========================================
  // 4. RECEIPT IMAGES (Ảnh hóa đơn siêu thị thực tế)
  // ==========================================
  {
    id: '22000000-0000-4000-8000-000000000001',
    publicId: 'seed/receipts/market-primary',
    secureUrl: '/seed/vision/supermarket-receipt-sample.jpg',
    resourceType: MediaResourceType.IMAGE,
    kind: MediaKind.RECEIPT_IMAGE,
    ownerEmail: 'member@example.com',
    mimeType: 'image/jpeg',
    extension: '.jpg',
    bytes: 45874,
    width: 1024,
    height: 1600,
    aspectRatio: '9:16 (Dọc)',
    recommendedResolution: '1024 x 1600 px',
    description:
      'Ảnh chụp dọc hóa đơn thanh toán siêu thị thực tế rõ nét: các mặt hàng nông sản và thực phẩm chay kèm đơn giá và tổng tiền.',
  },
] as const;
