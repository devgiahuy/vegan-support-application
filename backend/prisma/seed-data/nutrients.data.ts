import {
  EvidenceGrade,
  FoodRuleSeverity,
  InteractionDirection,
  InteractionScope,
  NutrientReferenceType,
  UnitDimension,
} from '@prisma/client';

export type NutrientCode =
  | 'ENERGY_KCAL'
  | 'PROTEIN'
  | 'FAT'
  | 'CARBS'
  | 'FIBER'
  | 'SUGAR'
  | 'SODIUM'
  | 'CALCIUM'
  | 'IRON'
  | 'POTASSIUM'
  | 'MAGNESIUM'
  | 'ZINC'
  | 'VITAMIN_A'
  | 'VITAMIN_C'
  | 'VITAMIN_D'
  | 'VITAMIN_E'
  | 'VITAMIN_B1'
  | 'VITAMIN_B2'
  | 'VITAMIN_B6'
  | 'FOLATE'
  | 'VITAMIN_B12'
  | 'OMEGA_3';

export interface NutrientDefinition {
  code: NutrientCode;
  name: string;
  defaultUnit: string;
  unitDimension: UnitDimension;
  description?: string;
  /** USDA FoodData Central nutrient id used when importing SR Legacy values. */
  usdaNutrientId: number;
}

// Units match the USDA FoodData Central nutrient table so imported values need no conversion.
export const nutrientDefinitions: readonly NutrientDefinition[] = [
  {
    code: 'ENERGY_KCAL',
    name: 'Năng lượng',
    defaultUnit: 'kcal',
    unitDimension: UnitDimension.ENERGY,
    usdaNutrientId: 1008,
    description: 'Năng lượng tính theo hệ số Atwater của USDA',
  },
  {
    code: 'PROTEIN',
    name: 'Protein (chất đạm)',
    defaultUnit: 'g',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1003,
  },
  {
    code: 'FAT',
    name: 'Chất béo tổng số',
    defaultUnit: 'g',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1004,
  },
  {
    code: 'CARBS',
    name: 'Carbohydrate (tính theo hiệu số)',
    defaultUnit: 'g',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1005,
  },
  {
    code: 'FIBER',
    name: 'Chất xơ tổng số',
    defaultUnit: 'g',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1079,
  },
  {
    code: 'SUGAR',
    name: 'Đường tổng số',
    defaultUnit: 'g',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 2000,
    description: 'Gồm cả đường tự nhiên và đường bổ sung',
  },
  {
    code: 'SODIUM',
    name: 'Natri',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1093,
  },
  {
    code: 'CALCIUM',
    name: 'Canxi',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1087,
  },
  {
    code: 'IRON',
    name: 'Sắt',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1089,
    description: 'Sắt trong thực phẩm thực vật là sắt non-heme',
  },
  {
    code: 'POTASSIUM',
    name: 'Kali',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1092,
  },
  {
    code: 'MAGNESIUM',
    name: 'Magiê',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1090,
  },
  {
    code: 'ZINC',
    name: 'Kẽm',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1095,
  },
  {
    code: 'VITAMIN_A',
    name: 'Vitamin A (RAE)',
    defaultUnit: 'mcg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1106,
    description: 'Đương lượng hoạt tính retinol',
  },
  {
    code: 'VITAMIN_C',
    name: 'Vitamin C',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1162,
  },
  {
    code: 'VITAMIN_D',
    name: 'Vitamin D (D2 + D3)',
    defaultUnit: 'mcg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1114,
  },
  {
    code: 'VITAMIN_E',
    name: 'Vitamin E (alpha-tocopherol)',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1109,
  },
  {
    code: 'VITAMIN_B1',
    name: 'Vitamin B1 (thiamin)',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1165,
  },
  {
    code: 'VITAMIN_B2',
    name: 'Vitamin B2 (riboflavin)',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1166,
  },
  {
    code: 'VITAMIN_B6',
    name: 'Vitamin B6',
    defaultUnit: 'mg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1175,
  },
  {
    code: 'FOLATE',
    name: 'Folate (DFE)',
    defaultUnit: 'mcg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1190,
    description: 'Đương lượng folate trong khẩu phần',
  },
  {
    code: 'VITAMIN_B12',
    name: 'Vitamin B12',
    defaultUnit: 'mcg',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1178,
    description: 'Thực phẩm thực vật không bổ sung gần như không chứa B12',
  },
  {
    code: 'OMEGA_3',
    name: 'Omega-3 (ALA, 18:3 n-3)',
    defaultUnit: 'g',
    unitDimension: UnitDimension.MASS,
    usdaNutrientId: 1404,
  },
] as const;

export const cookingMethodDefinitions = [
  { code: 'BOILING', name: 'Luộc / nấu canh', description: 'Nấu trong nước sôi khoảng 100°C' },
  { code: 'STEAMING', name: 'Hấp', description: 'Làm chín bằng hơi nước nóng' },
  { code: 'STIR_FRYING', name: 'Xào', description: 'Đảo nhanh trên chảo nóng với ít dầu' },
  {
    code: 'DEEP_FRYING',
    name: 'Chiên ngập dầu',
    description: 'Chiên trong lượng dầu đủ ngập thực phẩm',
  },
  {
    code: 'AIR_FRYING',
    name: 'Chiên không dầu',
    description: 'Làm chín bằng luồng khí nóng đối lưu',
  },
  { code: 'BAKING', name: 'Nướng', description: 'Làm chín bằng nhiệt khô trong lò hoặc trên than' },
  { code: 'RAW', name: 'Ăn sống / trộn gỏi', description: 'Không qua gia nhiệt' },
  {
    code: 'PRESSURE_COOKING',
    name: 'Hầm áp suất',
    description: 'Ninh trong nồi áp suất để rút ngắn thời gian',
  },
] as const;

/**
 * Dietary Reference Intakes of the U.S. National Academies of Sciences, Engineering, and Medicine
 * (NASEM; DRI reports 1997–2011, sodium/potassium update 2019) for healthy adults aged 19–50,
 * as summarised by the NIH Office of Dietary Supplements. Pregnancy, lactation, children and
 * adults over 50 are intentionally not seeded. Energy has no RDA (EER is individual), so it is
 * not seeded either; meal planning uses the user's TDEE instead.
 */
export const DRI_SOURCE = {
  code: 'NASEM_DRI',
  name: 'Dietary Reference Intakes (NASEM) — bảng tóm tắt NIH ODS',
  sourceUrl: 'https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx',
  licenseName: 'Số liệu tham chiếu công khai; trích dẫn NASEM/NIH ODS',
  licenseUrl:
    'https://www.nationalacademies.org/our-work/summary-report-of-the-dietary-reference-intakes',
  attribution:
    'National Academies of Sciences, Engineering, and Medicine. Dietary Reference Intakes summary tables; NIH Office of Dietary Supplements.',
  sourceVersion: 'NASEM DRI 1997-2019',
} as const;

type Sex = 'MALE' | 'FEMALE';
interface ReferenceIntakeItem {
  nutrientCode: NutrientCode;
  referenceType: NutrientReferenceType;
  populationCode: string;
  applicability: { minAge: number; maxAge: number; sex?: Sex };
  value: number;
  unit: string;
  warningEligible?: boolean;
  note?: string;
}

const adult = (sex?: Sex, minAge = 19, maxAge = 50) => ({
  populationCode: `ADULT${sex ? `_${sex}` : ''}_${minAge}_${maxAge}`,
  applicability: { minAge, maxAge, ...(sex ? { sex } : {}) },
});

export const nutrientReferenceIntakes: readonly ReferenceIntakeItem[] = [
  {
    nutrientCode: 'PROTEIN',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE'),
    value: 56,
    unit: 'g',
    note: '0,8 g/kg cân nặng tham chiếu',
  },
  {
    nutrientCode: 'PROTEIN',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE'),
    value: 46,
    unit: 'g',
    note: '0,8 g/kg cân nặng tham chiếu',
  },
  {
    nutrientCode: 'CARBS',
    referenceType: NutrientReferenceType.RDA,
    ...adult(),
    value: 130,
    unit: 'g',
  },
  {
    nutrientCode: 'FIBER',
    referenceType: NutrientReferenceType.AI,
    ...adult('MALE'),
    value: 38,
    unit: 'g',
  },
  {
    nutrientCode: 'FIBER',
    referenceType: NutrientReferenceType.AI,
    ...adult('FEMALE'),
    value: 25,
    unit: 'g',
  },
  {
    nutrientCode: 'OMEGA_3',
    referenceType: NutrientReferenceType.AI,
    ...adult('MALE'),
    value: 1.6,
    unit: 'g',
  },
  {
    nutrientCode: 'OMEGA_3',
    referenceType: NutrientReferenceType.AI,
    ...adult('FEMALE'),
    value: 1.1,
    unit: 'g',
  },
  {
    nutrientCode: 'CALCIUM',
    referenceType: NutrientReferenceType.RDA,
    ...adult(),
    value: 1000,
    unit: 'mg',
  },
  {
    nutrientCode: 'CALCIUM',
    referenceType: NutrientReferenceType.UL,
    ...adult(),
    value: 2500,
    unit: 'mg',
    warningEligible: true,
  },
  {
    nutrientCode: 'IRON',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE'),
    value: 8,
    unit: 'mg',
    note: 'NASEM lưu ý người ăn chay có thể cần gấp 1,8 lần do sắt non-heme hấp thu kém hơn',
  },
  {
    nutrientCode: 'IRON',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE'),
    value: 18,
    unit: 'mg',
    note: 'NASEM lưu ý người ăn chay có thể cần gấp 1,8 lần do sắt non-heme hấp thu kém hơn',
  },
  {
    nutrientCode: 'IRON',
    referenceType: NutrientReferenceType.UL,
    ...adult(),
    value: 45,
    unit: 'mg',
    warningEligible: true,
  },
  {
    nutrientCode: 'MAGNESIUM',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE', 19, 30),
    value: 400,
    unit: 'mg',
  },
  {
    nutrientCode: 'MAGNESIUM',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE', 31, 50),
    value: 420,
    unit: 'mg',
  },
  {
    nutrientCode: 'MAGNESIUM',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE', 19, 30),
    value: 310,
    unit: 'mg',
  },
  {
    nutrientCode: 'MAGNESIUM',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE', 31, 50),
    value: 320,
    unit: 'mg',
  },
  {
    nutrientCode: 'POTASSIUM',
    referenceType: NutrientReferenceType.AI,
    ...adult('MALE'),
    value: 3400,
    unit: 'mg',
  },
  {
    nutrientCode: 'POTASSIUM',
    referenceType: NutrientReferenceType.AI,
    ...adult('FEMALE'),
    value: 2600,
    unit: 'mg',
  },
  {
    nutrientCode: 'SODIUM',
    referenceType: NutrientReferenceType.AI,
    ...adult(),
    value: 1500,
    unit: 'mg',
  },
  {
    nutrientCode: 'SODIUM',
    referenceType: NutrientReferenceType.OTHER,
    ...adult(),
    value: 2300,
    unit: 'mg',
    warningEligible: true,
    note: 'Chronic Disease Risk Reduction Intake (CDRR, 2019): nên giảm nếu vượt mức này',
  },
  {
    nutrientCode: 'ZINC',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE'),
    value: 11,
    unit: 'mg',
  },
  {
    nutrientCode: 'ZINC',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE'),
    value: 8,
    unit: 'mg',
  },
  {
    nutrientCode: 'ZINC',
    referenceType: NutrientReferenceType.UL,
    ...adult(),
    value: 40,
    unit: 'mg',
    warningEligible: true,
  },
  {
    nutrientCode: 'VITAMIN_A',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE'),
    value: 900,
    unit: 'mcg',
  },
  {
    nutrientCode: 'VITAMIN_A',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE'),
    value: 700,
    unit: 'mcg',
  },
  {
    nutrientCode: 'VITAMIN_C',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE'),
    value: 90,
    unit: 'mg',
  },
  {
    nutrientCode: 'VITAMIN_C',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE'),
    value: 75,
    unit: 'mg',
  },
  {
    nutrientCode: 'VITAMIN_C',
    referenceType: NutrientReferenceType.UL,
    ...adult(),
    value: 2000,
    unit: 'mg',
    warningEligible: true,
  },
  {
    nutrientCode: 'VITAMIN_D',
    referenceType: NutrientReferenceType.RDA,
    ...adult(),
    value: 15,
    unit: 'mcg',
  },
  {
    nutrientCode: 'VITAMIN_E',
    referenceType: NutrientReferenceType.RDA,
    ...adult(),
    value: 15,
    unit: 'mg',
  },
  {
    nutrientCode: 'VITAMIN_B1',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE'),
    value: 1.2,
    unit: 'mg',
  },
  {
    nutrientCode: 'VITAMIN_B1',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE'),
    value: 1.1,
    unit: 'mg',
  },
  {
    nutrientCode: 'VITAMIN_B2',
    referenceType: NutrientReferenceType.RDA,
    ...adult('MALE'),
    value: 1.3,
    unit: 'mg',
  },
  {
    nutrientCode: 'VITAMIN_B2',
    referenceType: NutrientReferenceType.RDA,
    ...adult('FEMALE'),
    value: 1.1,
    unit: 'mg',
  },
  {
    nutrientCode: 'VITAMIN_B6',
    referenceType: NutrientReferenceType.RDA,
    ...adult(),
    value: 1.3,
    unit: 'mg',
  },
  {
    nutrientCode: 'FOLATE',
    referenceType: NutrientReferenceType.RDA,
    ...adult(),
    value: 400,
    unit: 'mcg',
  },
  {
    nutrientCode: 'VITAMIN_B12',
    referenceType: NutrientReferenceType.RDA,
    ...adult(),
    value: 2.4,
    unit: 'mcg',
  },
];

export interface InteractionRuleItem {
  ingredientANormalized: string;
  ingredientBNormalized: string;
  scope: InteractionScope;
  direction: InteractionDirection;
  severity: FoodRuleSeverity;
  evidenceGrade: EvidenceGrade;
  hardRule: boolean;
  explanation: string;
  suggestedAction: string;
  references: string[];
}

// Educational pairing notes. They are advisory (hardRule: false) and never filter recipes.
export const interactionRuleDefinitions: readonly InteractionRuleItem[] = [
  {
    ingredientANormalized: 'dau hu',
    ingredientBNormalized: 'bong cai xanh',
    scope: InteractionScope.SAME_MEAL,
    direction: InteractionDirection.BENEFICIAL,
    severity: FoodRuleSeverity.INFO,
    evidenceGrade: EvidenceGrade.HIGH,
    hardRule: false,
    explanation:
      'Vitamin C ăn cùng bữa giúp tăng hấp thu sắt non-heme từ đậu hũ; tác dụng phụ thuộc lượng vitamin C và lượng phytate trong bữa ăn.',
    suggestedAction:
      'Có thể dùng đậu hũ cùng rau quả giàu vitamin C (bông cải xanh, ớt chuông, cà chua) trong cùng bữa.',
    references: [
      'Hallberg L, Brune M, Rossander L. Iron absorption in man: ascorbic acid and dose-dependent inhibition by phytate. Am J Clin Nutr. 1989;49(1):140-144. doi:10.1093/ajcn/49.1.140',
    ],
  },
  {
    ingredientANormalized: 'gao lut',
    ingredientBNormalized: 'dau hu',
    scope: InteractionScope.SAME_DAY,
    direction: InteractionDirection.BENEFICIAL,
    severity: FoodRuleSeverity.INFO,
    evidenceGrade: EvidenceGrade.MODERATE,
    hardRule: false,
    explanation:
      'Ngũ cốc thường ít lysine còn đậu đỗ ít methionine; ăn đa dạng hai nhóm trong ngày giúp khẩu phần đủ axit amin thiết yếu. Không bắt buộc ăn chung một bữa.',
    suggestedAction: 'Phân bổ cả ngũ cốc nguyên hạt và các món từ đậu, đậu nành trong ngày.',
    references: [
      'Young VR, Pellett PL. Plant proteins in relation to human protein and amino acid nutrition. Am J Clin Nutr. 1994;59(5 Suppl):1203S-1212S. doi:10.1093/ajcn/59.5.1203S',
      'Melina V, Craig W, Levin S. Position of the Academy of Nutrition and Dietetics: Vegetarian Diets. J Acad Nutr Diet. 2016;116(12):1970-1980. doi:10.1016/j.jand.2016.09.025',
    ],
  },
] as const;
