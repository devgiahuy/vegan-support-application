import { FoodGroup, UnitDimension } from '@prisma/client';

export interface IngredientSeedItem {
  canonicalName: string;
  normalizedName: string;
  foodGroup: FoodGroup;
  aliases: string[];
  allergens: string[];
  vegan: boolean;
  lactoOvo: boolean;
  buddhistWarning?: [string, string];
  nutrients: {
    energyKcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    iron?: number;
    calcium?: number;
    vitaminC?: number;
    vitaminB12?: number;
    potassium?: number;
    folate?: number;
    zinc?: number;
    sodium?: number;
  };
  conversions: Array<{
    unitName: string;
    quantity: number;
    grams: number;
    unitDimension: UnitDimension;
  }>;
}

export const ingredientDefinitions: readonly IngredientSeedItem[] = [
  // ========================================================
  // 1. LEGUMES: Các loại đậu & Chế phẩm từ đậu (Nguồn Protein chính)
  // ========================================================
  {
    canonicalName: 'Đậu hũ trắng',
    normalizedName: 'dau hu',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['tofu', 'đậu phụ', 'tàu hũ', 'đậu trắng'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 76, protein: 8.1, fat: 4.8, carbs: 1.9, fiber: 0.3, calcium: 350, iron: 5.4 },
    conversions: [
      { unitName: 'miếng', quantity: 1, grams: 150, unitDimension: UnitDimension.COUNT },
      { unitName: 'bìa', quantity: 1, grams: 150, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén', quantity: 1, grams: 120, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Đậu hũ non',
    normalizedName: 'dau hu non',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['silken tofu', 'tàu hũ non', 'đậu non'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 55, protein: 5.8, fat: 2.9, carbs: 1.5, fiber: 0.2, calcium: 110, iron: 1.2 },
    conversions: [
      { unitName: 'hộp', quantity: 1, grams: 300, unitDimension: UnitDimension.COUNT },
      { unitName: 'cây', quantity: 1, grams: 250, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Đậu hũ ky (Váng đậu)',
    normalizedName: 'dau hu ky',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['tofu skin', 'váng đậu', 'phù trúc'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 440, protein: 44.5, fat: 22.0, carbs: 15.0, fiber: 3.5, iron: 8.5, calcium: 280 },
    conversions: [
      { unitName: 'lá', quantity: 1, grams: 50, unitDimension: UnitDimension.COUNT },
      { unitName: 'cuộn', quantity: 1, grams: 100, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Đậu gà',
    normalizedName: 'dau ga',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['chickpea', 'garbanzo', 'đậu gà khô', 'đậu gà luộc'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 164, protein: 8.9, fat: 2.6, carbs: 27.4, fiber: 7.6, iron: 2.9, calcium: 49 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 160, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng canh', quantity: 1, grams: 15, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Đậu lăng đỏ',
    normalizedName: 'dau lang',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['lentil', 'red lentil', 'đậu lăng vàng'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 116, protein: 9.0, fat: 0.4, carbs: 20.1, fiber: 7.9, iron: 3.3, calcium: 19 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 180, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Đậu đen xanh lòng',
    normalizedName: 'dau den',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['black bean', 'đỗ đen', 'đậu đen'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 132, protein: 8.9, fat: 0.5, carbs: 23.7, fiber: 8.7, iron: 2.1, calcium: 27 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 170, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Đậu đỏ hạt nhỏ',
    normalizedName: 'dau do',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['red bean', 'đỗ đỏ', 'adzuki bean'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 128, protein: 7.5, fat: 0.2, carbs: 24.8, fiber: 7.3, iron: 2.0, calcium: 28 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 170, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Đậu xanh cà vỏ',
    normalizedName: 'dau xanh',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['mung bean', 'đỗ xanh', 'đậu xanh bóc vỏ'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 105, protein: 7.0, fat: 0.4, carbs: 19.2, fiber: 7.6, iron: 1.4, calcium: 27 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 170, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Sườn non chay (Đạm đậu nành)',
    normalizedName: 'suon non chay',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['tvp', 'textured vegetable protein', 'thịt thực vật', 'sườn chay'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 320, protein: 50.0, fat: 1.5, carbs: 30.0, fiber: 12.0, iron: 9.0, calcium: 240 },
    conversions: [
      { unitName: 'miếng', quantity: 1, grams: 25, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén', quantity: 1, grams: 60, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Tempeh đậu nành',
    normalizedName: 'tempeh',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['tempe', 'đậu gà tempeh', 'đậu nành lên men'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 192, protein: 20.3, fat: 10.8, carbs: 7.6, fiber: 4.8, iron: 2.7, calcium: 111 },
    conversions: [
      { unitName: 'thanh', quantity: 1, grams: 200, unitDimension: UnitDimension.COUNT },
      { unitName: 'lát', quantity: 1, grams: 30, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Chao trắng',
    normalizedName: 'chao trang',
    foodGroup: FoodGroup.LEGUMES,
    aliases: ['fermented bean curd', 'chao ủ', 'chao đậu'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 160, protein: 12.0, fat: 8.5, carbs: 7.0, fiber: 1.2, calcium: 210, iron: 3.5 },
    conversions: [
      { unitName: 'viên', quantity: 1, grams: 20, unitDimension: UnitDimension.COUNT },
      { unitName: 'muỗng canh', quantity: 1, grams: 20, unitDimension: UnitDimension.VOLUME },
    ],
  },

  // ========================================================
  // 2. GRAINS: Ngũ cốc nguyên cám & Tinh bột phức hợp
  // ========================================================
  {
    canonicalName: 'Gạo lứt huyết rồng',
    normalizedName: 'gao lut',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['brown rice', 'gạo lứt đỏ', 'gạo lức', 'gạo lứt'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 111, protein: 2.6, fat: 0.9, carbs: 23.0, fiber: 1.8, iron: 0.8, calcium: 10 },
    conversions: [
      { unitName: 'chén cơm', quantity: 1, grams: 150, unitDimension: UnitDimension.VOLUME },
      { unitName: 'lon gạo', quantity: 1, grams: 250, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Gạo thơm ST25',
    normalizedName: 'gao st25',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['jasmine rice', 'gạo trắng', 'gạo st25', 'cơm trắng'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 130, protein: 2.7, fat: 0.3, carbs: 28.2, fiber: 0.4, iron: 0.2, calcium: 3 },
    conversions: [
      { unitName: 'chén cơm', quantity: 1, grams: 150, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Yến mạch cán dẹt',
    normalizedName: 'yen mach',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['rolled oats', 'oatmeal', 'yến mạch quaker'],
    allergens: ['GLUTEN'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 389, protein: 16.9, fat: 6.9, carbs: 66.3, fiber: 10.6, iron: 4.7, calcium: 54 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 80, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng canh', quantity: 1, grams: 10, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Hạt Quinoa trắng',
    normalizedName: 'quinoa',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['quinoa hạt', 'diêm mạch', 'hạt diêm mạch'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 120, protein: 4.4, fat: 1.9, carbs: 21.3, fiber: 2.8, iron: 1.5, calcium: 17 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 185, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Bánh phở tươi',
    normalizedName: 'banh pho',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['pho noodles', 'bánh phở trắng', 'sợi phở'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 140, protein: 2.5, fat: 0.5, carbs: 31.0, fiber: 0.5, iron: 0.3, calcium: 8 },
    conversions: [
      { unitName: 'tô', quantity: 1, grams: 150, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Bún tươi',
    normalizedName: 'bun tuoi',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['rice vermicelli', 'sợi bún', 'bún gạo'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 110, protein: 1.7, fat: 0.2, carbs: 25.5, fiber: 0.4, iron: 0.2, calcium: 12 },
    conversions: [
      { unitName: 'tô', quantity: 1, grams: 150, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Miến dong sạch',
    normalizedName: 'mien dong',
    foodGroup: FoodGroup.GRAINS,
    aliases: ['glass noodles', 'cellophane noodles', 'bún tàu'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 351, protein: 0.7, fat: 0.1, carbs: 86.4, fiber: 1.5, iron: 1.2, calcium: 25 },
    conversions: [
      { unitName: 'cuộn', quantity: 1, grams: 50, unitDimension: UnitDimension.COUNT },
    ],
  },

  // ========================================================
  // 3. NUTS & SEEDS: Hạt dinh dưỡng & Bơ hạt (Chất béo tốt)
  // ========================================================
  {
    canonicalName: 'Đậu phộng rang',
    normalizedName: 'dau phong',
    foodGroup: FoodGroup.NUTS_SEEDS,
    aliases: ['peanut', 'lạc', 'hạt lạc', 'lạc rang'],
    allergens: ['PEANUT'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 567, protein: 25.8, fat: 49.2, carbs: 16.1, fiber: 8.5, iron: 4.6, calcium: 92 },
    conversions: [
      { unitName: 'nắm', quantity: 1, grams: 30, unitDimension: UnitDimension.COUNT },
      { unitName: 'muỗng canh', quantity: 1, grams: 15, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Hạt điều Bình Phước',
    normalizedName: 'hat dieu',
    foodGroup: FoodGroup.NUTS_SEEDS,
    aliases: ['cashew', 'hạt điều rang muối', 'điều sữa'],
    allergens: ['TREE_NUT'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 553, protein: 18.2, fat: 43.8, carbs: 30.2, fiber: 3.3, iron: 6.7, calcium: 37 },
    conversions: [
      { unitName: 'nắm', quantity: 1, grams: 30, unitDimension: UnitDimension.COUNT },
      { unitName: 'hạt', quantity: 10, grams: 15, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Hạt chia hữu cơ',
    normalizedName: 'hat chia',
    foodGroup: FoodGroup.NUTS_SEEDS,
    aliases: ['chia seeds', 'hạt chia đen', 'hạt chia úc'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 486, protein: 16.5, fat: 30.7, carbs: 42.1, fiber: 34.4, calcium: 631, iron: 7.7 },
    conversions: [
      { unitName: 'muỗng canh', quantity: 1, grams: 12, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng cà phê', quantity: 1, grams: 4, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Hạt sen tươi',
    normalizedName: 'hat sen',
    foodGroup: FoodGroup.NUTS_SEEDS,
    aliases: ['lotus seeds', 'sen huế', 'hạt sen khô'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 89, protein: 4.1, fat: 0.5, carbs: 17.2, fiber: 2.1, iron: 1.0, calcium: 44 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 120, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Hạt bí ngô',
    normalizedName: 'hat bi',
    foodGroup: FoodGroup.NUTS_SEEDS,
    aliases: ['pumpkin seeds', 'hạt bí xanh', 'pepitas'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 559, protein: 30.2, fat: 49.1, carbs: 10.7, fiber: 6.0, iron: 8.8, calcium: 46 },
    conversions: [
      { unitName: 'muỗng canh', quantity: 1, grams: 15, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Mè trắng rang',
    normalizedName: 'me trang',
    foodGroup: FoodGroup.NUTS_SEEDS,
    aliases: ['sesame seeds', 'vừng trắng', 'vừng rang'],
    allergens: ['SESAME'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 573, protein: 17.7, fat: 49.7, carbs: 23.4, fiber: 11.8, calcium: 975, iron: 14.6 },
    conversions: [
      { unitName: 'muỗng canh', quantity: 1, grams: 10, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng cà phê', quantity: 1, grams: 3, unitDimension: UnitDimension.VOLUME },
    ],
  },

  // ========================================================
  // 4. MUSHROOMS: Các loại Nấm (Hương vị Umami & Khoáng chất)
  // ========================================================
  {
    canonicalName: 'Nấm hương (Đông cô)',
    normalizedName: 'nam huong',
    foodGroup: FoodGroup.MUSHROOMS,
    aliases: ['shiitake', 'nấm đông cô', 'nấm hương tươi', 'nấm hương khô'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 34, protein: 2.2, fat: 0.5, carbs: 6.8, fiber: 2.5, iron: 0.4, calcium: 2 },
    conversions: [
      { unitName: 'tai nấm', quantity: 1, grams: 20, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén', quantity: 1, grams: 100, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Nấm đùi gà',
    normalizedName: 'nam dui ga',
    foodGroup: FoodGroup.MUSHROOMS,
    aliases: ['king oyster mushroom', 'nấm bào ngư nhật', 'nấm lục giác'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 35, protein: 3.3, fat: 0.5, carbs: 5.2, fiber: 2.3, iron: 0.6, calcium: 5 },
    conversions: [
      { unitName: 'cây', quantity: 1, grams: 120, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Nấm bào ngư xám',
    normalizedName: 'nam bao ngu',
    foodGroup: FoodGroup.MUSHROOMS,
    aliases: ['oyster mushroom', 'nấm sò', 'nấm dai'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 33, protein: 3.3, fat: 0.4, carbs: 6.1, fiber: 2.3, iron: 1.3, calcium: 3 },
    conversions: [
      { unitName: 'tai nấm', quantity: 1, grams: 30, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén', quantity: 1, grams: 90, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Nấm rơm tươi',
    normalizedName: 'nam rom',
    foodGroup: FoodGroup.MUSHROOMS,
    aliases: ['straw mushroom', 'nấm rơm búp', 'nấm rơm'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 31, protein: 3.8, fat: 0.7, carbs: 4.7, fiber: 2.1, iron: 1.7, calcium: 22 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 100, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Nấm kim châm',
    normalizedName: 'nam kim cham',
    foodGroup: FoodGroup.MUSHROOMS,
    aliases: ['enoki mushroom', 'nấm giá', 'nấm kim châm trắng'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 37, protein: 2.7, fat: 0.3, carbs: 7.8, fiber: 2.7, iron: 1.2, calcium: 3 },
    conversions: [
      { unitName: 'gói', quantity: 1, grams: 150, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Mộc nhĩ (Nấm mèo)',
    normalizedName: 'moc nhi',
    foodGroup: FoodGroup.MUSHROOMS,
    aliases: ['wood ear mushroom', 'nấm mèo', 'nấm tai mèo'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 25, protein: 0.5, fat: 0.2, carbs: 7.0, fiber: 5.1, iron: 5.6, calcium: 159 },
    conversions: [
      { unitName: 'tai nấm khô', quantity: 1, grams: 10, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén ngâm nở', quantity: 1, grams: 80, unitDimension: UnitDimension.VOLUME },
    ],
  },

  // ========================================================
  // 5. VEGETABLES: Rau xanh & Củ quả nhiệt đới
  // ========================================================
  {
    canonicalName: 'Bông cải xanh',
    normalizedName: 'bong cai xanh',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['broccoli', 'súp lơ xanh', 'bông cải'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6, vitaminC: 89.2, calcium: 47, iron: 0.7 },
    conversions: [
      { unitName: 'cây', quantity: 1, grams: 350, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén', quantity: 1, grams: 90, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Cải thìa (Cải chíp)',
    normalizedName: 'cai thia',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['bok choy', 'cải chíp', 'cải bẹ trắng'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 13, protein: 1.5, fat: 0.2, carbs: 2.2, fiber: 1.0, vitaminC: 45.0, calcium: 105, iron: 0.8 },
    conversions: [
      { unitName: 'cây', quantity: 1, grams: 60, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Cải bó xôi (Rau bina)',
    normalizedName: 'cai bo xoi',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['spinach', 'rau bina', 'rau chân vịt'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 23, protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2, iron: 2.7, calcium: 99, vitaminC: 28.1 },
    conversions: [
      { unitName: 'bó', quantity: 1, grams: 250, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén', quantity: 1, grams: 60, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Rau muống',
    normalizedName: 'rau muong',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['water spinach', 'rau muống nước', 'rau muống cạn'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 19, protein: 2.6, fat: 0.2, carbs: 3.1, fiber: 2.1, iron: 1.7, calcium: 77, vitaminC: 31.0 },
    conversions: [
      { unitName: 'bó', quantity: 1, grams: 300, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Cà rốt tươi',
    normalizedName: 'ca rot',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['carrot', 'củ cà rốt', 'cà rốt đà lạt'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 41, protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8, vitaminC: 5.9, calcium: 33, iron: 0.3 },
    conversions: [
      { unitName: 'củ', quantity: 1, grams: 120, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén thái lát', quantity: 1, grams: 110, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Củ cải trắng',
    normalizedName: 'cu cai trang',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['daikon', 'radish', 'củ cải đường'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 18, protein: 0.6, fat: 0.1, carbs: 4.1, fiber: 1.6, vitaminC: 22.0, calcium: 27 },
    conversions: [
      { unitName: 'củ', quantity: 1, grams: 250, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Bí đỏ hồ lô',
    normalizedName: 'bi do',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['pumpkin', 'bí ngô', 'bí đỏ'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 26, protein: 1.0, fat: 0.1, carbs: 6.5, fiber: 0.5, vitaminC: 9.0, calcium: 21 },
    conversions: [
      { unitName: 'miếng', quantity: 1, grams: 200, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén nấu nhừ', quantity: 1, grams: 150, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Cà chua chín',
    normalizedName: 'ca chua',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['tomato', 'quả cà chua', 'cà chua bi'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2, vitaminC: 13.7, calcium: 10 },
    conversions: [
      { unitName: 'quả', quantity: 1, grams: 100, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Cà tím',
    normalizedName: 'ca tim',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['eggplant', 'aubergine', 'cà tím tròn', 'cà tím dài'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 25, protein: 1.0, fat: 0.2, carbs: 5.9, fiber: 3.0, calcium: 9, iron: 0.2 },
    conversions: [
      { unitName: 'trái', quantity: 1, grams: 200, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Khổ qua (Mướp đắng)',
    normalizedName: 'kho qua',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['bitter melon', 'mướp đắng', 'khổ qua đèo'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 17, protein: 1.0, fat: 0.2, carbs: 3.7, fiber: 2.8, vitaminC: 84.0, calcium: 19 },
    conversions: [
      { unitName: 'trái', quantity: 1, grams: 180, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Bắp ngọt (Ngô ngọt)',
    normalizedName: 'bap ngot',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['sweet corn', 'ngô ngọt', 'bắp vàng'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 86, protein: 3.2, fat: 1.2, carbs: 19.0, fiber: 2.7, iron: 0.5, calcium: 2 },
    conversions: [
      { unitName: 'trái', quantity: 1, grams: 200, unitDimension: UnitDimension.COUNT },
      { unitName: 'chén hạt', quantity: 1, grams: 140, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Khoai lang mật',
    normalizedName: 'khoai lang',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['sweet potato', 'khoai lang vàng', 'khoai lang tím'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 86, protein: 1.6, fat: 0.1, carbs: 20.1, fiber: 3.0, vitaminC: 2.4, calcium: 30 },
    conversions: [
      { unitName: 'củ', quantity: 1, grams: 150, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Khoai môn sáp',
    normalizedName: 'khoai mon',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['taro', 'khoai sọ', 'khoai môn'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 112, protein: 1.5, fat: 0.2, carbs: 26.5, fiber: 4.1, iron: 0.7, calcium: 43 },
    conversions: [
      { unitName: 'củ', quantity: 1, grams: 200, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Măng tây xanh',
    normalizedName: 'mang tay',
    foodGroup: FoodGroup.VEGETABLES,
    aliases: ['asparagus', 'măng tây đà lạt'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 20, protein: 2.2, fat: 0.1, carbs: 3.9, fiber: 2.1, vitaminC: 5.6, iron: 2.1, folate: 52 },
    conversions: [
      { unitName: 'cây', quantity: 5, grams: 80, unitDimension: UnitDimension.COUNT },
    ],
  },

  // ========================================================
  // 6. FRUITS: Trái cây giàu Vitamin & Khoáng
  // ========================================================
  {
    canonicalName: 'Quả bơ sáp 034',
    normalizedName: 'bo sap',
    foodGroup: FoodGroup.FRUITS,
    aliases: ['avocado', 'trái bơ', 'bơ 034', 'bơ hass'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 160, protein: 2.0, fat: 14.7, carbs: 8.5, fiber: 6.7, potassium: 485, vitaminC: 10.0 },
    conversions: [
      { unitName: 'trái', quantity: 1, grams: 200, unitDimension: UnitDimension.COUNT },
      { unitName: 'nửa trái', quantity: 1, grams: 100, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Chuối tiêu chín',
    normalizedName: 'chuoi',
    foodGroup: FoodGroup.FRUITS,
    aliases: ['banana', 'chuối già', 'chuối sứ'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 89, protein: 1.1, fat: 0.3, carbs: 22.8, fiber: 2.6, potassium: 358, vitaminC: 8.7 },
    conversions: [
      { unitName: 'trái', quantity: 1, grams: 110, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Dứa mật (Thơm)',
    normalizedName: 'dua mat',
    foodGroup: FoodGroup.FRUITS,
    aliases: ['pineapple', 'thơm', 'khóm'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 50, protein: 0.5, fat: 0.1, carbs: 13.1, fiber: 1.4, vitaminC: 47.8, calcium: 13 },
    conversions: [
      { unitName: 'lát', quantity: 1, grams: 50, unitDimension: UnitDimension.COUNT },
      { unitName: 'trái', quantity: 1, grams: 500, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Chanh tươi',
    normalizedName: 'chanh tuoi',
    foodGroup: FoodGroup.FRUITS,
    aliases: ['lime', 'lemon', 'nước cốt chanh'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 29, protein: 1.1, fat: 0.3, carbs: 9.3, fiber: 2.8, vitaminC: 53.0 },
    conversions: [
      { unitName: 'trái', quantity: 1, grams: 60, unitDimension: UnitDimension.COUNT },
      { unitName: 'muỗng canh nước cốt', quantity: 1, grams: 15, unitDimension: UnitDimension.VOLUME },
    ],
  },

  // ========================================================
  // 7. HERBS & SPICES: Gia vị & Thảo mộc thơm
  // ========================================================
  {
    canonicalName: 'Hành boaro (Tỏi tây)',
    normalizedName: 'hanh boaro',
    foodGroup: FoodGroup.HERBS_SPICES,
    aliases: ['leek', 'boa-rô', 'hành ba-rô', 'tỏi tây'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    buddhistWarning: ['FIVE_PUNGENT_ROOTS', 'Có thể thuộc nhóm ngũ vị tân theo truyền thống Phật giáo'],
    nutrients: { energyKcal: 61, protein: 1.5, fat: 0.3, carbs: 14.2, fiber: 1.8, vitaminC: 12.0 },
    conversions: [
      { unitName: 'cây', quantity: 1, grams: 80, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Hành lá',
    normalizedName: 'hanh la',
    foodGroup: FoodGroup.HERBS_SPICES,
    aliases: ['spring onion', 'scallion', 'hành hoa'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    buddhistWarning: ['FIVE_PUNGENT_ROOTS', 'Có thể thuộc nhóm ngũ vị tân theo truyền thống Phật giáo'],
    nutrients: { energyKcal: 32, protein: 1.8, fat: 0.2, carbs: 7.3, fiber: 2.6, vitaminC: 18.8 },
    conversions: [
      { unitName: 'nhánh', quantity: 1, grams: 15, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Ngò rí (Rau mùi)',
    normalizedName: 'ngo ri',
    foodGroup: FoodGroup.HERBS_SPICES,
    aliases: ['coriander', 'cilantro', 'rau mùi'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 23, protein: 2.1, fat: 0.5, carbs: 3.7, fiber: 2.8, vitaminC: 27.0 },
    conversions: [
      { unitName: 'nắm nhỏ', quantity: 1, grams: 20, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Sả cây tươi',
    normalizedName: 'sa cay',
    foodGroup: FoodGroup.HERBS_SPICES,
    aliases: ['lemongrass', 'cây sả', 'sả băm'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 99, protein: 1.8, fat: 0.5, carbs: 25.3, fiber: 0 },
    conversions: [
      { unitName: 'cây', quantity: 1, grams: 30, unitDimension: UnitDimension.COUNT },
    ],
  },
  {
    canonicalName: 'Gừng già',
    normalizedName: 'gung gia',
    foodGroup: FoodGroup.HERBS_SPICES,
    aliases: ['ginger', 'củ gừng', 'gừng tươi'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 80, protein: 1.8, fat: 0.8, carbs: 17.8, fiber: 2.0 },
    conversions: [
      { unitName: 'củ nhỏ', quantity: 1, grams: 30, unitDimension: UnitDimension.COUNT },
      { unitName: 'lát', quantity: 1, grams: 5, unitDimension: UnitDimension.COUNT },
    ],
  },

  // ========================================================
  // 8. OTHER: Gia vị chay dưỡng sinh & Siêu thực phẩm
  // ========================================================
  {
    canonicalName: 'Men dinh dưỡng (Nutritional Yeast)',
    normalizedName: 'men dinh duong',
    foodGroup: FoodGroup.OTHER,
    aliases: ['nutritional yeast', 'nooch', 'men dinh dưỡng b12'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 375, protein: 50.0, fat: 5.0, carbs: 35.0, fiber: 20.0, vitaminB12: 44.0, iron: 5.0, zinc: 30.0 },
    conversions: [
      { unitName: 'muỗng canh', quantity: 1, grams: 10, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng cà phê', quantity: 1, grams: 3, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Nước tương Tamari',
    normalizedName: 'nuoc tuong tamari',
    foodGroup: FoodGroup.OTHER,
    aliases: ['tamari', 'nước tương lên men', 'xì dầu'],
    allergens: ['SOY'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 60, protein: 10.5, fat: 0.1, carbs: 5.5, fiber: 0.8, sodium: 5400 },
    conversions: [
      { unitName: 'muỗng canh', quantity: 1, grams: 15, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng cà phê', quantity: 1, grams: 5, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Hạt nêm nấm hương',
    normalizedName: 'hat nem nam',
    foodGroup: FoodGroup.OTHER,
    aliases: ['mushroom seasoning', 'bột nêm chay', 'hạt nêm nấm'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 180, protein: 8.0, fat: 0.5, carbs: 36.0, fiber: 2.0, sodium: 18000 },
    conversions: [
      { unitName: 'muỗng cà phê', quantity: 1, grams: 5, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng canh', quantity: 1, grams: 15, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Dầu mè nguyên chất',
    normalizedName: 'dau me',
    foodGroup: FoodGroup.OTHER,
    aliases: ['sesame oil', 'dầu vừng', 'dầu mè thơm'],
    allergens: ['SESAME'],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 884, protein: 0, fat: 100.0, carbs: 0, fiber: 0 },
    conversions: [
      { unitName: 'muỗng cà phê', quantity: 1, grams: 5, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng canh', quantity: 1, grams: 14, unitDimension: UnitDimension.VOLUME },
    ],
  },
  {
    canonicalName: 'Nước cốt dừa nguyên chất',
    normalizedName: 'nuoc cot dua',
    foodGroup: FoodGroup.OTHER,
    aliases: ['coconut milk', 'nước dừa béo', 'cốt dừa'],
    allergens: [],
    vegan: true,
    lactoOvo: true,
    nutrients: { energyKcal: 230, protein: 2.3, fat: 23.8, carbs: 5.5, fiber: 2.2, iron: 1.6 },
    conversions: [
      { unitName: 'chén', quantity: 1, grams: 150, unitDimension: UnitDimension.VOLUME },
      { unitName: 'muỗng canh', quantity: 1, grams: 15, unitDimension: UnitDimension.VOLUME },
    ],
  },
] as const;
