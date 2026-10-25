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

// User-entered totals equal the sum of the listed ingredients' USDA SR Legacy values
// (raw weights), so the sample matches what the nutrition calculator would report.
export const customMealDefinitions: readonly SeedCustomMealDefinition[] = [
  {
    id: '18000000-0000-4000-8000-000000000001',
    userEmail: 'member@example.com',
    name: 'Yến Mạch Ngâm Hạt Chia Chuối Hạt Điều',
    notes:
      'Yến mạch ngâm qua đêm với nước, hạt chia và chuối; rắc hạt điều khi ăn. Không dùng đậu phộng vì dị ứng.',
    servings: 1,
    userCalories: 488,
    userProteinGrams: 14.4,
    userCarbsGrams: 78.4,
    userFatGrams: 15.5,
    nutritionCoverage: NutritionCoverage.COMPLETE,
    tags: ['bữa sáng', 'overnight oats', 'chuẩn bị trước', 'shopee'],
    ingredients: [
      { ingredientNormalizedName: 'yen mach', displayName: 'Yến mạch cán', amount: 60, unit: 'g' },
      { ingredientNormalizedName: 'hat chia', displayName: 'Hạt chia', amount: 15, unit: 'g' },
      { ingredientNormalizedName: 'chuoi', displayName: 'Chuối chín', amount: 118, unit: 'g' },
      { ingredientNormalizedName: 'hat dieu', displayName: 'Hạt điều', amount: 15, unit: 'g' },
    ],
  },
  {
    id: '18000000-0000-4000-8000-000000000002',
    userEmail: 'member.buddhist@example.com',
    name: 'Cơm Gạo Lứt Muối Mè',
    notes: 'Bữa cơm đơn giản ngày rằm: cơm gạo lứt chấm muối mè rang.',
    servings: 1,
    userCalories: 351,
    userProteinGrams: 7.8,
    userCarbsGrams: 63.3,
    userFatGrams: 7.5,
    nutritionCoverage: NutritionCoverage.COMPLETE,
    tags: ['ngày rằm', 'gạo lứt', 'muối mè'],
    ingredients: [
      { ingredientNormalizedName: 'gao lut', displayName: 'Gạo lứt', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'me trang', displayName: 'Mè trắng rang', amount: 10, unit: 'g' },
      { ingredientNormalizedName: 'muoi', displayName: 'Muối', amount: 1, unit: 'g' },
    ],
  },
  {
    id: '18000000-0000-4000-8000-000000000003',
    userEmail: 'member.weightloss@example.com',
    name: 'Sinh Tố Bơ Đậu Hũ Non Chuối',
    notes: 'Đậu hũ non xay cùng bơ và chuối cho sinh tố sánh mịn, không thêm đường.',
    servings: 1,
    userCalories: 241,
    userProteinGrams: 13.2,
    userCarbsGrams: 21.7,
    userFatGrams: 13.8,
    nutritionCoverage: NutritionCoverage.COMPLETE,
    tags: ['sinh tố', 'đậu hũ non', 'không đường'],
    ingredients: [
      { ingredientNormalizedName: 'dau hu non', displayName: 'Đậu hũ non', amount: 150, unit: 'g' },
      { ingredientNormalizedName: 'bo sap', displayName: 'Bơ chín', amount: 80, unit: 'g' },
      { ingredientNormalizedName: 'chuoi', displayName: 'Chuối chín', amount: 60, unit: 'g' },
    ],
  },
] as const;
