import {
  EvidenceGrade,
  FoodRuleSeverity,
  InteractionDirection,
  InteractionScope,
  NutrientReferenceType,
  UnitDimension,
} from '@prisma/client';

export interface NutrientDefinition {
  code: string;
  name: string;
  defaultUnit: string;
  unitDimension: UnitDimension;
  description?: string;
}

export const nutrientDefinitions: readonly NutrientDefinition[] = [
  { code: 'ENERGY_KCAL', name: 'Năng lượng', defaultUnit: 'kcal', unitDimension: UnitDimension.ENERGY, description: 'Tổng calo cung cấp từ thực phẩm' },
  { code: 'PROTEIN', name: 'Protein (Chất đạm)', defaultUnit: 'g', unitDimension: UnitDimension.MASS, description: 'Đạm thực vật xây dựng và phục hồi tế bào' },
  { code: 'FAT', name: 'Chất béo (Lipid)', defaultUnit: 'g', unitDimension: UnitDimension.MASS, description: 'Chất béo tổng số từ các loại hạt và dầu thực vật' },
  { code: 'CARBS', name: 'Carbohydrate (Đường bột)', defaultUnit: 'g', unitDimension: UnitDimension.MASS, description: 'Đường bột phức hợp cung cấp năng lượng dài hạn' },
  { code: 'FIBER', name: 'Chất xơ', defaultUnit: 'g', unitDimension: UnitDimension.MASS, description: 'Chất xơ hòa tan và không hòa tan hỗ trợ tiêu hóa' },
  { code: 'SUGAR', name: 'Đường tự nhiên', defaultUnit: 'g', unitDimension: UnitDimension.MASS, description: 'Đường tự nhiên từ trái cây và củ quả' },
  { code: 'SODIUM', name: 'Natri (Sodium)', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Khoáng chất cân bằng điện giải' },
  { code: 'CALCIUM', name: 'Canxi', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Khoáng chất cấu tạo xương và răng' },
  { code: 'IRON', name: 'Sắt (Non-Heme)', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Sắt nguồn gốc thực vật hỗ trợ tạo máu' },
  { code: 'POTASSIUM', name: 'Kali', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Hỗ trợ chức năng cơ bắp và huyết áp' },
  { code: 'MAGNESIUM', name: 'Magiê', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Khoáng chất hỗ trợ hệ thần kinh và giấc ngủ' },
  { code: 'ZINC', name: 'Kẽm', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Vi chất tăng cường miễn dịch và chuyển hóa đạm' },
  { code: 'VITAMIN_A', name: 'Vitamin A (Beta-carotene)', defaultUnit: 'mcg', unitDimension: UnitDimension.MASS, description: 'Tốt cho mắt, niêm mạc và làn da' },
  { code: 'VITAMIN_C', name: 'Vitamin C', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Chống oxy hóa và tăng cường hấp thu sắt thực vật' },
  { code: 'VITAMIN_D', name: 'Vitamin D', defaultUnit: 'mcg', unitDimension: UnitDimension.MASS, description: 'Hỗ trợ hấp thu canxi và miễn dịch' },
  { code: 'VITAMIN_E', name: 'Vitamin E', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Chống oxy hóa bảo vệ màng tế bào' },
  { code: 'VITAMIN_B1', name: 'Vitamin B1 (Thiamine)', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Chuyển hóa carbohydrate thành năng lượng' },
  { code: 'VITAMIN_B2', name: 'Vitamin B2 (Riboflavin)', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Hỗ trợ chuyển hóa năng lượng và thị giác' },
  { code: 'VITAMIN_B6', name: 'Vitamin B6 (Pyridoxine)', defaultUnit: 'mg', unitDimension: UnitDimension.MASS, description: 'Chuyển hóa protein và dẫn truyền thần kinh' },
  { code: 'FOLATE', name: 'Folate (Vitamin B9)', defaultUnit: 'mcg', unitDimension: UnitDimension.MASS, description: 'Tổng hợp DNA và tạo hồng cầu' },
  { code: 'VITAMIN_B12', name: 'Vitamin B12 (Cobalamin)', defaultUnit: 'mcg', unitDimension: UnitDimension.MASS, description: 'Vi chất tối quan trọng đối với người ăn thuần chay' },
  { code: 'OMEGA_3', name: 'Omega-3 (ALA)', defaultUnit: 'g', unitDimension: UnitDimension.MASS, description: 'Axit béo thiết yếu từ hạt chia, hạt lanh, hạt óc chó' },
] as const;

export const cookingMethodDefinitions = [
  { code: 'BOILING', name: 'Luộc / Nấu canh', description: 'Nấu trong nước sôi ở nhiệt độ khoảng 100°C' },
  { code: 'STEAMING', name: 'Hấp cách thủy', description: 'Làm chín bằng hơi nước nóng, giữ tối đa vi chất' },
  { code: 'STIR_FRYING', name: 'Xào nhanh', description: 'Đảo nhanh trên chảo nóng với ít dầu thực vật' },
  { code: 'DEEP_FRYING', name: 'Chiên ngập dầu', description: 'Chiên trong dầu nóng giòn bề mặt' },
  { code: 'AIR_FRYING', name: 'Chiên không dầu', description: 'Làm chín bằng luồng khí nóng đối lưu tuần hoàn' },
  { code: 'BAKING', name: 'Nướng lò', description: 'Làm chín bằng nhiệt khô trong lò nướng' },
  { code: 'RAW', name: 'Ăn sống / Trộn gỏi', description: 'Không qua gia nhiệt, giữ trọn vẹn enzyme tự nhiên' },
  { code: 'PRESSURE_COOKING', name: 'Hầm áp suất', description: 'Ninh mềm đậu và hạt trong nồi áp suất giữ dưỡng chất' },
] as const;

export const nutrientReferenceIntakes = [
  // RDA cho Người lớn nói chung (Adult Reference Intake)
  { nutrientCode: 'ENERGY_KCAL', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_MALE', value: 2200, unit: 'kcal' },
  { nutrientCode: 'ENERGY_KCAL', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_FEMALE', value: 1800, unit: 'kcal' },
  { nutrientCode: 'PROTEIN', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_MALE', value: 65, unit: 'g' },
  { nutrientCode: 'PROTEIN', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_FEMALE', value: 50, unit: 'g' },
  { nutrientCode: 'FIBER', referenceType: NutrientReferenceType.AI, populationCode: 'ADULT_GENERAL', value: 28, unit: 'g' },
  { nutrientCode: 'CALCIUM', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_GENERAL', value: 1000, unit: 'mg' },
  { nutrientCode: 'IRON', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_MALE', value: 14, unit: 'mg' },
  { nutrientCode: 'IRON', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_FEMALE', value: 20, unit: 'mg' },
  { nutrientCode: 'VITAMIN_C', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_GENERAL', value: 90, unit: 'mg' },
  { nutrientCode: 'VITAMIN_B12', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_GENERAL', value: 2.4, unit: 'mcg' },
  { nutrientCode: 'ZINC', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_GENERAL', value: 11, unit: 'mg' },
  { nutrientCode: 'FOLATE', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_GENERAL', value: 400, unit: 'mcg' },
  { nutrientCode: 'MAGNESIUM', referenceType: NutrientReferenceType.RDA, populationCode: 'ADULT_GENERAL', value: 350, unit: 'mg' },
  { nutrientCode: 'OMEGA_3', referenceType: NutrientReferenceType.AI, populationCode: 'ADULT_GENERAL', value: 1.6, unit: 'g' },
  // Giới hạn an toàn trên (Tolerable Upper Intake Level - UL)
  { nutrientCode: 'SODIUM', referenceType: NutrientReferenceType.UL, populationCode: 'ADULT_GENERAL', value: 2000, unit: 'mg', warningEligible: true },
  { nutrientCode: 'IRON', referenceType: NutrientReferenceType.UL, populationCode: 'ADULT_GENERAL', value: 45, unit: 'mg', warningEligible: true },
  { nutrientCode: 'CALCIUM', referenceType: NutrientReferenceType.UL, populationCode: 'ADULT_GENERAL', value: 2500, unit: 'mg', warningEligible: true },
] as const;

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
}

export const interactionRuleDefinitions: readonly InteractionRuleItem[] = [
  {
    ingredientANormalized: 'dau hu',
    ingredientBNormalized: 'bong cai xanh',
    scope: InteractionScope.SAME_DISH,
    direction: InteractionDirection.BENEFICIAL,
    severity: FoodRuleSeverity.INFO,
    evidenceGrade: EvidenceGrade.HIGH,
    hardRule: false,
    explanation: 'Vitamin C tự nhiên dồi dào trong bông cải xanh giúp chuyển hóa Sắt non-heme trong đậu hũ thành dạng dễ hấp thu hơn gấp 2-3 lần.',
    suggestedAction: 'Nên kết hợp đậu hũ cùng rau củ giàu vitamin C (bông cải, ớt chuông, cà chua) trong cùng một bữa ăn.',
  },
  {
    ingredientANormalized: 'gao lut',
    ingredientBNormalized: 'dau hu',
    scope: InteractionScope.SAME_MEAL,
    direction: InteractionDirection.BENEFICIAL,
    severity: FoodRuleSeverity.INFO,
    evidenceGrade: EvidenceGrade.HIGH,
    hardRule: false,
    explanation: 'Sự kết hợp giữa ngũ cốc nguyên cám (giàu Methionine, ít Lysine) và các loại đậu (giàu Lysine, ít Methionine) tạo nên chuỗi axit amin hoàn chỉnh có giá trị sinh học cao.',
    suggestedAction: 'Phối hợp gạo lứt cùng các món chế biến từ đậu nành để đạt hiệu quả tổng hợp protein tối đa.',
  },
  {
    ingredientANormalized: 'dau phong',
    ingredientBNormalized: 'chuoi',
    scope: InteractionScope.SAME_MEAL,
    direction: InteractionDirection.BENEFICIAL,
    severity: FoodRuleSeverity.INFO,
    evidenceGrade: EvidenceGrade.MODERATE,
    hardRule: false,
    explanation: 'Chất béo tốt từ đậu phộng làm chậm quá trình hấp thu đường từ chuối, giúp chỉ số đường huyết ổn định và cung cấp năng lượng kéo dài.',
    suggestedAction: 'Thích hợp dùng làm bữa phụ hoặc trước buổi tập luyện thể thao 30-45 phút.',
  },
] as const;
