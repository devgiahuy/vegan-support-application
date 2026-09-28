import { NutritionCoverage } from '@prisma/client';

export interface SeedCustomMealDefinition {
  id: string;
  userEmail: string;
  name: string;
  notes?: string;
  servings: number;
  userCalories: number;
  userProteinGrams: number;
  userCarbsGrams: number;
  userFatGrams: number;
  nutritionCoverage: NutritionCoverage;
  tags: string[];
  ingredients: Array<{
    ingredientNormalizedName: string;
    displayName: string;
    amount: number;
    unit: string;
  }>;
}

export const customMealDefinitions: readonly SeedCustomMealDefinition[] = [
  // 1. Overnight Oats Hạt Chia Việt Quất của Huy (Member)
  {
    id: '18000000-0000-4000-8000-000000000001',
    userEmail: 'member@example.com',
    name: 'Bát Yến Mạch Ngâm Hạt Chia & Chuối Đông Lạnh',
    notes: 'Yến mạch ngâm qua đêm cùng sữa đậu nành, hạt chia và chuối tiêu. Tiện lợi cho bữa sáng sau khi tập gym.',
    servings: 1,
    userCalories: 380,
    userProteinGrams: 15,
    userCarbsGrams: 62,
    userFatGrams: 8,
    nutritionCoverage: NutritionCoverage.COMPLETE,
    tags: ['bữa sáng gym', 'overnight oats', 'nhanh dưới 5 phút', 'shopee'],
    ingredients: [
      { ingredientNormalizedName: 'yen mach', displayName: 'Yến mạch cán dẹt', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'hat chia', displayName: 'Hạt chia hữu cơ', amount: 15, unit: 'g' },
      { ingredientNormalizedName: 'chuoi', displayName: 'Chuối tiêu cắt lát', amount: 100, unit: 'g' },
      { ingredientNormalizedName: 'dau phong', displayName: 'Bơ đậu phộng quết', amount: 15, unit: 'g' },
    ],
  },

  // 2. Cơm Gạo Lứt Muối Mè Rong Biển
  {
    id: '18000000-0000-4000-8000-000000000002',
    userEmail: 'member.buddhist@example.com',
    name: 'Cơm Gạo Lứt Muối Mè Dưỡng Sinh Ohsawa',
    notes: 'Bữa cơm dưỡng sinh thanh tịnh vào ngày rằm, nhai kỹ 50 lần mỗi miếng để hấp thu tinh túy.',
    servings: 1,
    userCalories: 310,
    userProteinGrams: 7,
    userCarbsGrams: 52,
    userFatGrams: 9,
    nutritionCoverage: NutritionCoverage.COMPLETE,
    tags: ['thực dưỡng', 'ngày rằm', 'gạo lứt muối mè'],
    ingredients: [
      { ingredientNormalizedName: 'gao lut', displayName: 'Cơm gạo lứt huyết rồng', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'me trang', displayName: 'Muối mè rang thơm', amount: 15, unit: 'g' },
    ],
  },

  // 3. Sinh Tố Bơ Đậu Hũ Non Cacao
  {
    id: '18000000-0000-4000-8000-000000000003',
    userEmail: 'member.weightloss@example.com',
    name: 'Sinh Tố Bơ Đậu Hũ Non Vị Cacao No Lâu',
    notes: 'Đậu hũ non tạo kết cấu mềm mượt như kem mousse socola, giàu đạm và không chứa đường sữa.',
    servings: 1,
    userCalories: 260,
    userProteinGrams: 12,
    userCarbsGrams: 24,
    userFatGrams: 14,
    nutritionCoverage: NutritionCoverage.PARTIAL,
    tags: ['sinh tố keto', 'giảm mỡ', 'đậu hũ non'],
    ingredients: [
      { ingredientNormalizedName: 'dau hu non', displayName: 'Đậu hũ non mát lạnh', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'bo sap', displayName: 'Bơ sáp chín', amount: 80, unit: 'g' },
    ],
  },
] as const;
