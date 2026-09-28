import { RecipeDifficulty, type Prisma } from '@prisma/client';

export interface SeedRecipeStep {
  position: number;
  instruction: string;
  cookingMethodCode?: string;
  durationMinutes: number;
  affectedIngredientPositions: number[];
}

export interface SeedRecipeIngredient {
  ingredientNormalizedName: string;
  displayName: string;
  amount: number;
  unit: string;
}

export interface SeedRecipeDefinition {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  categorySlug: string;
  authorEmail: string;
  tags: string[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  vitaminB12Mcg?: number;
  mealPlannerEligible: boolean;
  allergenCodes: string[];
  traditionWarnings: Prisma.InputJsonValue;
  ingredients: SeedRecipeIngredient[];
  steps: SeedRecipeStep[];
  coverMedia: {
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    bytes: number;
  };
}

export const recipeDefinitions: readonly SeedRecipeDefinition[] = [
  // 1. Phở Chay Hà Nội Nước Dùng Nấm Sen
  {
    slug: 'pho-chay-ha-noi',
    title: 'Phở Chay Hà Nội Nước Dùng Nấm & Hạt Sen',
    excerpt: 'Hương vị phở Bắc ngọt thanh tự nhiên từ củ cải, hạt sen và nấm hương nướng.',
    body: 'Nồi nước dùng phở chay chuẩn vị không dùng hạt nêm công nghiệp mà tận dụng vị ngọt thanh từ củ cải trắng, mía lau, hạt sen và nấm hương nướng thơm cùng gừng già và hoa hồi. Kết hợp bánh phở tươi dẻo dai và sườn non chay áp chảo.',
    categorySlug: 'bun-pho-va-mi',
    authorEmail: 'platform.contributor@example.com',
    tags: ['phở chay', 'món nước', 'bữa sáng', 'hà nội'],
    servings: 2,
    prepTimeMinutes: 20,
    cookTimeMinutes: 45,
    difficulty: RecipeDifficulty.MEDIUM,
    calories: 410,
    proteinGrams: 18,
    carbsGrams: 68,
    fatGrams: 7,
    fiberGrams: 6,
    mealPlannerEligible: true,
    allergenCodes: ['SOY'],
    traditionWarnings: [
      { tradition: 'BUDDHIST', warningCode: 'FIVE_PUNGENT_ROOTS', label: 'Có hành boaro trang trí' },
    ],
    ingredients: [
      { ingredientNormalizedName: 'banh pho', displayName: 'Bánh phở tươi', amount: 300, unit: 'g' },
      { ingredientNormalizedName: 'nam huong', displayName: 'Nấm hương tươi', amount: 100, unit: 'g' },
      { ingredientNormalizedName: 'hat sen', displayName: 'Hạt sen tươi', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'cu cai trang', displayName: 'Củ cải trắng', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'suon non chay', displayName: 'Sườn non chay ngâm mềm', amount: 50, unit: 'g' },
      { ingredientNormalizedName: 'hanh boaro', displayName: 'Hành boaro thái lát', amount: 20, unit: 'g' },
      { ingredientNormalizedName: 'gung gia', displayName: 'Gừng già nướng', amount: 15, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Nướng gừng già trên lửa nhỏ cho thơm vỏ. Củ cải gọt vỏ cắt khúc 3cm.', cookingMethodCode: 'BAKING', durationMinutes: 5, affectedIngredientPositions: [3, 6] },
      { position: 1, instruction: 'Ninh củ cải, hạt sen, gừng nướng và chân nấm hương trong 1.2 lít nước để lấy nước dùng ngọt thanh.', cookingMethodCode: 'BOILING', durationMinutes: 30, affectedIngredientPositions: [1, 2, 3, 6] },
      { position: 2, instruction: 'Sườn non chay xé sợi, ướp chút tương tamari rồi áp chảo vàng giòn cùng nấm hương thái lát.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 7, affectedIngredientPositions: [1, 4] },
      { position: 3, instruction: 'Trần bánh phở qua nước sôi, xếp vào tô cùng nấm, sườn non chay và hành boaro, chan nước dùng sôi sùng sục.', durationMinutes: 3, affectedIngredientPositions: [0, 5] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/pho-chay-ha-noi',
      secureUrl: '/seed/recipes/pho-chay-ha-noi.png',
      width: 1200,
      height: 800,
      bytes: 655114,
    },
  },

  // 2. Bún Bò Huế Chay Sa Tế Đậm Đà
  {
    slug: 'bun-bo-hue-chay',
    title: 'Bún Bò Huế Chay Sa Tế Sả Cay Đậm Đà',
    excerpt: 'Tô bún đỏ rực màu hạt điều, dậy mùi sả ớt nồng nàn và riêu nấm thơm lừng.',
    body: 'Món bún cay nồng đậm chất miền Trung với nước dùng ninh từ bắp ngọt, củ cải, kết hợp sa tế sả ớt phi thơm cùng nấm đùi gà dai ngọt và đậu hũ chiên vàng.',
    categorySlug: 'bun-pho-va-mi',
    authorEmail: 'invited.contributor@example.com',
    tags: ['bún bò chay', 'món cay', 'đặc sản huế', 'bữa trưa'],
    servings: 2,
    prepTimeMinutes: 20,
    cookTimeMinutes: 35,
    difficulty: RecipeDifficulty.MEDIUM,
    calories: 450,
    proteinGrams: 20,
    carbsGrams: 64,
    fatGrams: 12,
    fiberGrams: 7,
    mealPlannerEligible: true,
    allergenCodes: ['SOY'],
    traditionWarnings: [
      { tradition: 'BUDDHIST', warningCode: 'FIVE_PUNGENT_ROOTS', label: 'Có hành boaro phi sa tế' },
    ],
    ingredients: [
      { ingredientNormalizedName: 'bun tuoi', displayName: 'Bún sợi to', amount: 300, unit: 'g' },
      { ingredientNormalizedName: 'dau hu', displayName: 'Đậu hũ chiên cắt miếng', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'nam dui ga', displayName: 'Nấm đùi gà cắt lát', amount: 120, unit: 'g' },
      { ingredientNormalizedName: 'bap ngot', displayName: 'Bắp ngọt cắt khúc', amount: 100, unit: 'g' },
      { ingredientNormalizedName: 'sa cay', displayName: 'Sả cây đập dập', amount: 40, unit: 'g' },
      { ingredientNormalizedName: 'hanh boaro', displayName: 'Hành boaro băm phi sa tế', amount: 20, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Nấu nước dùng ngọt từ bắp ngọt và sả đập dập sôi liu riu trong 20 phút.', cookingMethodCode: 'BOILING', durationMinutes: 20, affectedIngredientPositions: [3, 4] },
      { position: 1, instruction: 'Phi thơm hành boaro và sả băm với ớt sa tế, cho nấm đùi gà và đậu hũ vào xào ngấm gia vị.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 8, affectedIngredientPositions: [1, 2, 5] },
      { position: 2, instruction: 'Trút phần nhân xào vào nồi nước dùng, nêm chút hạt nêm nấm và muối hồng vừa ăn.', durationMinutes: 5, affectedIngredientPositions: [1, 2] },
      { position: 3, instruction: 'Cho bún vào tô, xếp đậu hũ, nấm đùi gà, chan nước dùng cay nồng ăn kèm rau bắp chuối và rau thơm.', durationMinutes: 2, affectedIngredientPositions: [0] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/bun-bo-hue-chay',
      secureUrl: '/seed/recipes/bun-bo-hue-chay.png',
      width: 1200,
      height: 800,
      bytes: 898898,
    },
  },

  // 3. Cà Ri Chay Khoai Nấm Nước Cốt Dừa
  {
    slug: 'ca-ri-chay-khoai-nam',
    title: 'Cà Ri Chay Khoai Lang Nấm Nước Cốt Dừa',
    excerpt: 'Vị béo ngậy của nước cốt dừa hòa quyện cùng khoai lang mật và nấm thơm lừng.',
    body: 'Món cà ri chay béo ngậy sánh mịn thơm nức hương sả và bột cà ri Ấn Độ. Từng miếng khoai lang mật bùi dẻo, đậu hũ thấm vị và nấm bào ngư dai giòn, chấm cùng bánh mì giòn rụm hoặc ăn với bún tươi đều xuất sắc.',
    categorySlug: 'mon-ham-va-ca-ri',
    authorEmail: 'platform.contributor@example.com',
    tags: ['cà ri chay', 'khoai lang', 'nước cốt dừa', 'món tiệc'],
    servings: 3,
    prepTimeMinutes: 25,
    cookTimeMinutes: 30,
    difficulty: RecipeDifficulty.EASY,
    calories: 480,
    proteinGrams: 16,
    carbsGrams: 62,
    fatGrams: 19,
    fiberGrams: 8,
    mealPlannerEligible: true,
    allergenCodes: ['SOY'],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'khoai lang', displayName: 'Khoai lang mật cắt khối', amount: 250, unit: 'g' },
      { ingredientNormalizedName: 'dau hu', displayName: 'Đậu hũ rán vàng', amount: 200, unit: 'g' },
      { ingredientNormalizedName: 'nam bao ngu', displayName: 'Nấm bào ngư xám', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'nuoc cot dua', displayName: 'Nước cốt dừa nguyên chất', amount: 150, unit: 'ml' },
      { ingredientNormalizedName: 'ca rot', displayName: 'Cà rốt tỉa hoa', amount: 100, unit: 'g' },
      { ingredientNormalizedName: 'sa cay', displayName: 'Sả cây đập dập', amount: 30, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Chiên sơ khoai lang và cà rốt trên chảo để khoai không bị nát khi hầm.', cookingMethodCode: 'AIR_FRYING', durationMinutes: 10, affectedIngredientPositions: [0, 4] },
      { position: 1, instruction: 'Phi sả đập dập cùng bột cà ri, xào săn nấm bào ngư và đậu hũ cho thấm màu vàng đẹp mắt.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 5, affectedIngredientPositions: [1, 2, 5] },
      { position: 2, instruction: 'Thêm 500ml nước lọc và sả cây vào hầm khoai, cà rốt mềm trong 12 phút.', cookingMethodCode: 'BOILING', durationMinutes: 12, affectedIngredientPositions: [0, 4, 5] },
      { position: 3, instruction: 'Hạ lửa nhỏ, rưới nước cốt dừa vào khuấy đều, đun sôi lăn tăn 3 phút rồi tắt bếp.', durationMinutes: 3, affectedIngredientPositions: [3] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/ca-ri-chay-khoai-nam',
      secureUrl: '/seed/recipes/ca-ri-chay-khoai-nam.png',
      width: 1200,
      height: 800,
      bytes: 1326504,
    },
  },

  // 4. Nấm Đông Cô Kho Tiêu Xanh Đậm Vị
  {
    slug: 'nam-dong-co-kho-tieu',
    title: 'Nấm Đông Cô Kho Tiêu Xanh Đậm Vị Đưa Cơm',
    excerpt: 'Vị ngọt dai tự nhiên của nấm hương hòa cùng nước sốt kho kẹo cay nồng.',
    body: 'Món kho kinh điển trong bữa cơm chay gia đình. Nấm hương tươi chọn tai dày, chiên xém cạnh rồi kho liu riu trong nồi đất với nước tương tamari, tiêu xanh và dầu mè thơm nức mũi.',
    categorySlug: 'mon-kho-va-rim',
    authorEmail: 'platform.contributor@example.com',
    tags: ['nấm kho', 'đưa cơm', 'bữa tối', 'nhanh dưới 30 phút'],
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    difficulty: RecipeDifficulty.EASY,
    calories: 220,
    proteinGrams: 8,
    carbsGrams: 22,
    fatGrams: 11,
    fiberGrams: 5,
    mealPlannerEligible: true,
    allergenCodes: ['SOY', 'SESAME'],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'nam huong', displayName: 'Nấm hương tươi tỉa hoa', amount: 250, unit: 'g' },
      { ingredientNormalizedName: 'nuoc tuong tamari', displayName: 'Nước tương Tamari', amount: 30, unit: 'ml' },
      { ingredientNormalizedName: 'dau me', displayName: 'Dầu mè thơm', amount: 10, unit: 'ml' },
      { ingredientNormalizedName: 'hanh boaro', displayName: 'Hành boaro băm nhỏ', amount: 15, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Nấm hương khía chữ thập trên mũ nấm, áp chảo vàng nhẹ 2 mặt.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 5, affectedIngredientPositions: [0] },
      { position: 1, instruction: 'Phi thơm hành boaro trong tộ đất, cho nấm vào đảo đều cùng nước tương tamari và 50ml nước dừa tươi.', durationMinutes: 3, affectedIngredientPositions: [0, 1, 3] },
      { position: 2, instruction: 'Kho lửa nhỏ liu riu cho nước sốt sánh kẹo lại, rắc tiêu xay và rưới dầu mè trước khi tắt bếp.', durationMinutes: 7, affectedIngredientPositions: [0, 2] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/nam-dong-co-kho-tieu',
      secureUrl: '/seed/recipes/nam-dong-co-kho-tieu.png',
      width: 1200,
      height: 800,
      bytes: 1073405,
    },
  },

  // 5. Canh Chua Chay Nam Bộ Thanh Mát
  {
    slug: 'canh-chua-chay-nam-bo',
    title: 'Canh Chua Chay Nam Bộ Thơm Dứa & Nấm Bào Ngư',
    excerpt: 'Bát canh chua hài hòa vị chua thanh từ me chín, ngọt từ dứa và nấm bào ngư.',
    body: 'Hương vị canh chua Nam Bộ thanh khiết giải nhiệt cho những ngày hè oi bức. Vị chua thanh tao từ me dốt, ngọt thanh từ dứa chín và bắp non, ăn kèm đậu hũ non mềm mịn tan trong miệng.',
    categorySlug: 'canh-va-sup',
    authorEmail: 'platform.contributor@example.com',
    tags: ['canh chua', 'thanh nhiệt', 'món nam bộ', 'bữa trưa'],
    servings: 3,
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    difficulty: RecipeDifficulty.EASY,
    calories: 160,
    proteinGrams: 9,
    carbsGrams: 26,
    fatGrams: 3,
    fiberGrams: 5,
    mealPlannerEligible: true,
    allergenCodes: ['SOY'],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'dau hu non', displayName: 'Đậu hũ non cắt khối', amount: 200, unit: 'g' },
      { ingredientNormalizedName: 'nam bao ngu', displayName: 'Nấm bào ngư xé sợi', amount: 120, unit: 'g' },
      { ingredientNormalizedName: 'dua mat', displayName: 'Dứa mật cắt rẻ quạt', amount: 100, unit: 'g' },
      { ingredientNormalizedName: 'ca chua', displayName: 'Cà chua bổ múi cau', amount: 100, unit: 'g' },
      { ingredientNormalizedName: 'bap ngot', displayName: 'Bắp ngọt cắt khúc', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'ngo ri', displayName: 'Ngò gai và ngò rí', amount: 15, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Xào thơm cà chua và dứa trong nồi với chút dầu ăn để tạo màu nước canh đẹp.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 4, affectedIngredientPositions: [2, 3] },
      { position: 1, instruction: 'Cho 800ml nước vào đun sôi cùng bắp ngọt, nấm bào ngư và nước cốt me chua.', cookingMethodCode: 'BOILING', durationMinutes: 8, affectedIngredientPositions: [1, 4] },
      { position: 2, instruction: 'Thả đậu hũ non vào nấu nhẹ tay 3 phút, nêm muối và hạt nêm nấm vừa vị chua ngọt thanh tao.', durationMinutes: 3, affectedIngredientPositions: [0] },
      { position: 3, instruction: 'Múc ra tô, rắc ngò gai, ngò rí thái nhỏ và vài lát ớt sừng ăn nóng.', durationMinutes: 1, affectedIngredientPositions: [5] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/canh-chua-chay-nam-bo',
      secureUrl: '/seed/recipes/canh-chua-chay-nam-bo.jpg',
      width: 1200,
      height: 800,
      bytes: 78366,
    },
  },

  // 6. Gỏi Cuốn Chay Ngũ Sắc Sốt Bơ Đậu Phộng
  {
    slug: 'goi-cuon-chay-ngu-sac',
    title: 'Gỏi Cuốn Chay Ngũ Sắc Sốt Bơ Đậu Phộng Tương Đen',
    excerpt: 'Món cuốn thanh nhẹ tươi mát, chấm đẫm sốt bơ đậu phộng béo ngậy thơm ngon.',
    body: 'Từng cuộn gỏi trong veo nhìn thấu sắc cam của cà rốt, xanh non của xà lách, đỏ mọng của ớt chuông và vàng óng của đậu hũ áp chảo. Linh hồn món ăn nằm ở chén sốt bơ đậu phộng béo bùi chuẩn vị.',
    categorySlug: 'cha-gio-va-mon-cuon',
    authorEmail: 'platform.contributor@example.com',
    tags: ['gỏi cuốn', 'ăn vặt lành mạnh', 'eat clean', 'nhanh dưới 15 phút'],
    servings: 2,
    prepTimeMinutes: 15,
    cookTimeMinutes: 5,
    difficulty: RecipeDifficulty.EASY,
    calories: 310,
    proteinGrams: 14,
    carbsGrams: 42,
    fatGrams: 10,
    fiberGrams: 6,
    mealPlannerEligible: true,
    allergenCodes: ['SOY', 'PEANUT'],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'dau hu', displayName: 'Đậu hũ thái sợi áp chảo', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'ca rot', displayName: 'Cà rốt bào sợi', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'dau phong', displayName: 'Bơ đậu phộng làm sốt', amount: 30, unit: 'g' },
      { ingredientNormalizedName: 'bun tuoi', displayName: 'Bún tươi', amount: 100, unit: 'g' },
      { ingredientNormalizedName: 'ngo ri', displayName: 'Rau thơm ngò rí', amount: 20, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Áp chảo đậu hũ thái que cho vàng giòn các mặt với chút muối tiêu.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 5, affectedIngredientPositions: [0] },
      { position: 1, instruction: 'Khuấy đều bơ đậu phộng với nước tương tamari, nước ấm và chút chanh tạo sốt chấm sánh mịn.', durationMinutes: 3, affectedIngredientPositions: [2] },
      { position: 2, instruction: 'Thấm ướt bánh tráng, xếp bún, đậu hũ, cà rốt và rau thơm cuộn tròn chặt tay.', durationMinutes: 7, affectedIngredientPositions: [0, 1, 3, 4] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/goi-cuon-chay-ngu-sac',
      secureUrl: '/seed/recipes/goi-cuon-chay-ngu-sac.jpg',
      width: 1200,
      height: 800,
      bytes: 83886,
    },
  },

  // 7. Cơm Chiên Trái Dứa Hạt Điều Thơm Lừng
  {
    slug: 'com-chien-trai-dua',
    title: 'Cơm Chiên Trái Dứa Hạt Điều Ngũ Sắc',
    excerpt: 'Hạt cơm gạo lứt tơi ráo, hạt điều giòn bùi và dứa chua ngọt bắt vị.',
    body: 'Món cơm chiên trình bày bắt mắt trong nửa trái dứa khoét ruột. Hạt cơm gạo lứt được rang săn hạt trên chảo nóng cùng hạt điều rang bùi béo, cà rốt giòn ngọt và nấm đùi gà dai ngon.',
    categorySlug: 'com-va-ngu-coc',
    authorEmail: 'platform.contributor@example.com',
    tags: ['cơm chiên', 'hạt điều', 'trái dứa', 'món tiệc'],
    servings: 2,
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    difficulty: RecipeDifficulty.EASY,
    calories: 460,
    proteinGrams: 16,
    carbsGrams: 65,
    fatGrams: 16,
    fiberGrams: 7,
    mealPlannerEligible: true,
    allergenCodes: ['TREE_NUT', 'SOY'],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'gao lut', displayName: 'Cơm gạo lứt để nguội', amount: 250, unit: 'g' },
      { ingredientNormalizedName: 'dua mat', displayName: 'Dứa chín thái hạt lựu', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'hat dieu', displayName: 'Hạt điều rang giòn', amount: 40, unit: 'g' },
      { ingredientNormalizedName: 'ca rot', displayName: 'Cà rốt thái hạt lựu', amount: 50, unit: 'g' },
      { ingredientNormalizedName: 'nam dui ga', displayName: 'Nấm đùi gà thái hạt lựu', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'dau me', displayName: 'Dầu mè đảo cơm', amount: 10, unit: 'ml' },
    ],
    steps: [
      { position: 0, instruction: 'Xào nhanh cà rốt và nấm đùi gà trên chảo nóng với chút dầu mè cho chín tới.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 4, affectedIngredientPositions: [3, 4, 5] },
      { position: 1, instruction: 'Cho cơm gạo lứt vào đảo đều tay trên lửa lớn để hạt cơm tơi săn và dậy mùi thơm.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 6, affectedIngredientPositions: [0] },
      { position: 2, instruction: 'Trút dứa và hạt điều vào đảo nhanh 2 phút, nêm hạt nêm nấm rồi xúc vào vỏ trái dứa.', durationMinutes: 2, affectedIngredientPositions: [1, 2] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/com-chien-trai-dua',
      secureUrl: '/seed/recipes/com-chien-trai-dua.jpg',
      width: 1200,
      height: 800,
      bytes: 32892,
    },
  },

  // 8. Bánh Mì Chay Pate Nấm Đậu Gà
  {
    slug: 'banh-mi-chay-pate-nam',
    title: 'Bánh Mì Chay Kẹp Pate Nấm Đậu Gà Thảo Mộc',
    excerpt: 'Bánh mì giòn rụm phết pate nấm béo ngậy tự làm không chất bảo quản.',
    body: 'Pate chay thơm lừng từ đậu gà nghiền mịn kết hợp nấm hương xào thơm, bơ đậu phộng và men dinh dưỡng giàu B12. Kẹp trong ổ bánh mì nóng giòn cùng dưa leo, ngò rí và đồ chua giòn rụm.',
    categorySlug: 'banh-man-chay',
    authorEmail: 'org.contributor@example.com',
    tags: ['bánh mì chay', 'pate chay', 'bữa sáng', 'dưới 15 phút'],
    servings: 2,
    prepTimeMinutes: 15,
    cookTimeMinutes: 10,
    difficulty: RecipeDifficulty.EASY,
    calories: 390,
    proteinGrams: 16,
    carbsGrams: 58,
    fatGrams: 11,
    fiberGrams: 8,
    vitaminB12Mcg: 1.2,
    mealPlannerEligible: true,
    allergenCodes: ['GLUTEN', 'SOY'],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'dau ga', displayName: 'Đậu gà luộc chín xay nhuyễn', amount: 120, unit: 'g' },
      { ingredientNormalizedName: 'nam huong', displayName: 'Nấm hương xào thơm làm pate', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'men dinh duong', displayName: 'Men dinh dưỡng bổ sung B12', amount: 10, unit: 'g' },
      { ingredientNormalizedName: 'dau hu', displayName: 'Chả lụa chay hoặc đậu hũ rán', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'ca rot', displayName: 'Đồ chua cà rốt', amount: 40, unit: 'g' },
      { ingredientNormalizedName: 'ngo ri', displayName: 'Ngò rí tươi kẹp bánh mì', amount: 15, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Xay nhuyễn đậu gà chín cùng nấm hương xào, men dinh dưỡng và chút dầu mè tạo pate mịn thơm.', durationMinutes: 5, affectedIngredientPositions: [0, 1, 2] },
      { position: 1, instruction: 'Nướng nóng giòn ổ bánh mì, rạch bụng phết đẫm một lớp pate nấm đậu gà.', cookingMethodCode: 'BAKING', durationMinutes: 3, affectedIngredientPositions: [] },
      { position: 2, instruction: 'Xếp chả chay, dưa leo, cà rốt đồ chua và ngò rí vào ổ bánh, rưới chút xì dầu và tiêu xay.', durationMinutes: 2, affectedIngredientPositions: [3, 4, 5] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/banh-mi-chay-pate-nam',
      secureUrl: '/seed/recipes/banh-mi-chay-pate-nam.jpg',
      width: 1200,
      height: 800,
      bytes: 39000,
    },
  },

  // 9. Súp Bí Đỏ Kem Dừa Hạt Bí Rang
  {
    slug: 'sup-bi-do-kem-dua',
    title: 'Súp Bí Đỏ Kem Dừa Hạt Bí Rang Bổ Dưỡng',
    excerpt: 'Món súp vàng ươm sánh mịn, ấm bụng cho bữa tối mùa thu đông.',
    body: 'Bí đỏ hồ lô nướng thơm ngọt đậm đà, nấu nhuyễn cùng nước cốt dừa béo bùi và rắc hạt bí ngô rang giòn tan. Giàu Beta-carotene và kẽm tốt cho làn da và hệ miễn dịch.',
    categorySlug: 'canh-va-sup',
    authorEmail: 'org.contributor@example.com',
    tags: ['súp bí đỏ', 'kem dừa', 'dưỡng sinh', 'bữa tối'],
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    difficulty: RecipeDifficulty.EASY,
    calories: 240,
    proteinGrams: 7,
    carbsGrams: 32,
    fatGrams: 11,
    fiberGrams: 6,
    mealPlannerEligible: true,
    allergenCodes: [],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'bi do', displayName: 'Bí đỏ hồ lô cắt miếng', amount: 350, unit: 'g' },
      { ingredientNormalizedName: 'nuoc cot dua', displayName: 'Nước cốt dừa', amount: 80, unit: 'ml' },
      { ingredientNormalizedName: 'hat bi', displayName: 'Hạt bí ngô rang rắc mặt súp', amount: 20, unit: 'g' },
      { ingredientNormalizedName: 'gung gia', displayName: 'Gừng già thái sợi nhỏ', amount: 5, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Hấp hoặc luộc chín mềm bí đỏ cùng một lát gừng đập dập.', cookingMethodCode: 'STEAMING', durationMinutes: 12, affectedIngredientPositions: [0, 3] },
      { position: 1, instruction: 'Cho bí đỏ chín cùng nước luộc và nước cốt dừa vào máy xay sinh tố xay nhuyễn mịn.', durationMinutes: 3, affectedIngredientPositions: [0, 1] },
      { position: 2, instruction: 'Đổ lại vào nồi đun sôi nhẹ 2 phút, nêm chút muối hồng và tiêu trắng.', durationMinutes: 2, affectedIngredientPositions: [] },
      { position: 3, instruction: 'Múc ra bát, rưới vệt nước cốt dừa tạo hình xoắn ốc và rắc hạt bí rang giòn lên trên.', durationMinutes: 1, affectedIngredientPositions: [2] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/sup-bi-do-kem-dua',
      secureUrl: '/seed/recipes/sup-bi-do-kem-dua.jpg',
      width: 1200,
      height: 800,
      bytes: 34827,
    },
  },

  // 10. Cháo Yến Mạch Nấm Hương Hạt Sen
  {
    slug: 'chao-yen-mach-nam-huong',
    title: 'Cháo Yến Mạch Nấm Hương Hạt Sen An Thần',
    excerpt: 'Bát cháo dưỡng sinh thơm lừng, dễ tiêu hóa, hỗ trợ giấc ngủ sâu.',
    body: 'Bát cháo ấm nóng kết hợp yến mạch giàu chất xơ beta-glucan với hạt sen ninh bở và nấm hương thơm lừng. Rất thích hợp cho người lớn tuổi, người ốm mới dậy hoặc bữa sáng thanh nhẹ.',
    categorySlug: 'bua-sang',
    authorEmail: 'invited.contributor@example.com',
    tags: ['cháo dưỡng sinh', 'yến mạch', 'hạt sen', 'an thần'],
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    difficulty: RecipeDifficulty.EASY,
    calories: 280,
    proteinGrams: 12,
    carbsGrams: 50,
    fatGrams: 5,
    fiberGrams: 8,
    mealPlannerEligible: true,
    allergenCodes: ['GLUTEN'],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'yen mach', displayName: 'Yến mạch cán dẹt', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'hat sen', displayName: 'Hạt sen tươi thông tâm', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'nam huong', displayName: 'Nấm hương tươi thái lát', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'dau me', displayName: 'Dầu mè nhỏ vài giọt', amount: 5, unit: 'ml' },
      { ingredientNormalizedName: 'ngo ri', displayName: 'Ngò rí rắc cháo', amount: 10, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Ninh hạt sen tươi với 600ml nước trong 10 phút cho hạt sen chín bở mềm.', cookingMethodCode: 'BOILING', durationMinutes: 10, affectedIngredientPositions: [1] },
      { position: 1, instruction: 'Xào nhanh nấm hương với chút dầu mè và hạt nêm nấm cho ngấm gia vị thơm ngon.', cookingMethodCode: 'STIR_FRYING', durationMinutes: 3, affectedIngredientPositions: [2, 3] },
      { position: 2, instruction: 'Trút yến mạch và nấm vào nồi hạt sen, khuấy đều tay lửa vừa 3 phút cho cháo sánh dẻo.', durationMinutes: 3, affectedIngredientPositions: [0, 2] },
      { position: 3, instruction: 'Múc ra tô, rắc tiêu xay và ngò rí, thưởng thức khi còn nóng hổi.', durationMinutes: 1, affectedIngredientPositions: [4] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/chao-yen-mach-nam-huong',
      secureUrl: '/seed/recipes/chao-yen-mach-nam-huong.jpg',
      width: 1200,
      height: 800,
      bytes: 47063,
    },
  },

  // 11. Salad Bơ Đậu Gà Sốt Chanh Dây
  {
    slug: 'salad-bo-dau-ga',
    title: 'Salad Bơ Quả Đậu Gà Sốt Chanh Dây Dầu Oliu',
    excerpt: 'Đĩa salad đầy màu sắc, cung cấp nguồn chất béo lành mạnh và đạm thực vật sạch.',
    body: 'Đậu gà bùi bở trộn cùng bơ sáp béo ngậy, cà chua bi mọng nước và cải bó xôi tươi giòn. Nước sốt chanh dây chua ngọt tươi mát kích thích vị giác tối đa.',
    categorySlug: 'goi-va-nom',
    authorEmail: 'org.contributor@example.com',
    tags: ['salad', 'eat clean', 'bơ sáp', 'dưới 15 phút'],
    servings: 2,
    prepTimeMinutes: 15,
    cookTimeMinutes: 0,
    difficulty: RecipeDifficulty.EASY,
    calories: 340,
    proteinGrams: 11,
    carbsGrams: 36,
    fatGrams: 18,
    fiberGrams: 11,
    mealPlannerEligible: true,
    allergenCodes: [],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'dau ga', displayName: 'Đậu gà luộc chín ráo nước', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'bo sap', displayName: 'Bơ sáp thái hạt lựu', amount: 120, unit: 'g' },
      { ingredientNormalizedName: 'cai bo xoi', displayName: 'Cải bó xôi non ăn sống', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'ca chua', displayName: 'Cà chua chín thái lát', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'hat chia', displayName: 'Hạt chia rắc mặt salad', amount: 10, unit: 'g' },
      { ingredientNormalizedName: 'chanh tuoi', displayName: 'Nước cốt chanh làm sốt', amount: 15, unit: 'ml' },
    ],
    steps: [
      { position: 0, instruction: 'Pha sốt: Nước cốt chanh, 1 muỗng mật mía, 1 muỗng dầu ô liu và chút muối tiêu đánh tan.', durationMinutes: 3, affectedIngredientPositions: [5] },
      { position: 1, instruction: 'Rửa sạch cải bó xôi để ráo, xếp vào tô cùng đậu gà, bơ sáp và cà chua bi.', durationMinutes: 5, affectedIngredientPositions: [0, 1, 2, 3] },
      { position: 2, instruction: 'Rưới sốt đều lên đĩa rau củ, rắc hạt chia lên trên và trộn nhẹ tay trước khi ăn.', durationMinutes: 2, affectedIngredientPositions: [4] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/salad-bo-dau-ga',
      secureUrl: '/seed/recipes/salad-bo-dau-ga.webp',
      width: 1200,
      height: 800,
      bytes: 762789,
    },
  },

  // 12. Sinh Tố Xanh Cải Bó Xôi Chuối Hạt Chia
  {
    slug: 'sinh-to-xanh-cai-bo-xoi-chuoi',
    title: 'Sinh Tố Xanh Cải Bó Xôi Chuối Hạt Chia Detox',
    excerpt: 'Ly sinh tố năng lượng xanh mướt, giàu sắt và kali cho buổi sáng tỉnh táo.',
    body: 'Công thức sinh tố xanh dễ uống nhất cho người mới bắt đầu. Vị ngọt tự nhiên của chuối tiêu chín làm dịu vị hăng của cải bó xôi, kết hợp hạt chia nở bung cung cấp Omega-3 quý giá.',
    categorySlug: 'sinh-to-va-nuoc-ep',
    authorEmail: 'org.contributor@example.com',
    tags: ['sinh tố xanh', 'detox', 'bữa sáng', 'năng lượng'],
    servings: 1,
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    difficulty: RecipeDifficulty.EASY,
    calories: 210,
    proteinGrams: 6,
    carbsGrams: 42,
    fatGrams: 4,
    fiberGrams: 8,
    mealPlannerEligible: true,
    allergenCodes: [],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'cai bo xoi', displayName: 'Cải bó xôi tươi rửa sạch', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'chuoi', displayName: 'Chuối chín đông lạnh', amount: 110, unit: 'g' },
      { ingredientNormalizedName: 'hat chia', displayName: 'Hạt chia ngâm nở', amount: 10, unit: 'g' },
      { ingredientNormalizedName: 'chanh tuoi', displayName: 'Nước cốt chanh tăng hấp thu sắt', amount: 5, unit: 'ml' },
    ],
    steps: [
      { position: 0, instruction: 'Cho chuối đông lạnh, cải bó xôi, hạt chia, nước cốt chanh và 150ml nước dừa vào cối xay.', durationMinutes: 2, affectedIngredientPositions: [0, 1, 2, 3] },
      { position: 1, instruction: 'Xay ở tốc độ cao trong 60 giây đến khi hỗn hợp sánh mịn và có màu xanh ngọc bích.', durationMinutes: 1, affectedIngredientPositions: [] },
      { position: 2, instruction: 'Rót ra ly thủy tinh và thưởng thức ngay để hấp thu trọn vẹn vitamin C.', durationMinutes: 1, affectedIngredientPositions: [] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/sinh-to-xanh-cai-bo-xoi-chuoi',
      secureUrl: '/seed/recipes/sinh-to-xanh-cai-bo-xoi.webp',
      width: 1200,
      height: 800,
      bytes: 77442,
    },
  },

  // 13. Sữa Hạt Sen Đậu Đỏ Dưỡng Nhan Nóng Hổi
  {
    slug: 'sua-hat-sen-dau-do',
    title: 'Sữa Hạt Sen Đậu Đỏ Dưỡng Nhan Nóng Hổi',
    excerpt: 'Ly sữa hạt thơm ngát béo ngậy, bồi bổ khí huyết và làm dịu tinh thần.',
    body: 'Sự kết hợp hoàn hảo giữa đậu đỏ hạt nhỏ giàu chất sắt và hạt sen tươi an thần. Thức uống ấm áp thơm thảo, không dùng sữa đặc hay đường tinh luyện mà giữ vị ngọt tự nhiên của hạt.',
    categorySlug: 'sua-hat',
    authorEmail: 'invited.contributor@example.com',
    tags: ['sữa hạt', 'dưỡng nhan', 'hạt sen', 'thức uống'],
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    difficulty: RecipeDifficulty.EASY,
    calories: 190,
    proteinGrams: 8,
    carbsGrams: 34,
    fatGrams: 2,
    fiberGrams: 7,
    mealPlannerEligible: true,
    allergenCodes: [],
    traditionWarnings: [],
    ingredients: [
      { ingredientNormalizedName: 'hat sen', displayName: 'Hạt sen tươi bỏ tâm', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'dau do', displayName: 'Đậu đỏ ngâm nở', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'yen mach', displayName: 'Yến mạch tạo độ sánh mịn', amount: 20, unit: 'g' },
    ],
    steps: [
      { position: 0, instruction: 'Nấu chín mềm hạt sen và đậu đỏ với 700ml nước trong 20 phút.', cookingMethodCode: 'BOILING', durationMinutes: 20, affectedIngredientPositions: [0, 1] },
      { position: 1, instruction: 'Thêm yến mạch vào nấu thêm 3 phút cho yến mạch nở dẻo.', durationMinutes: 3, affectedIngredientPositions: [2] },
      { position: 2, instruction: 'Rót hỗn hợp vào máy xay nhuyễn mịn, lọc qua rây nếu muốn uống thật sánh nhẹ.', durationMinutes: 3, affectedIngredientPositions: [] },
    ],
    coverMedia: {
      publicId: 'seed/recipes/sua-hat-sen-dau-do',
      secureUrl: '/seed/recipes/sua-hat-sen-dau-do.jpg',
      width: 1200,
      height: 800,
      bytes: 44635,
    },
  },
] as const;
