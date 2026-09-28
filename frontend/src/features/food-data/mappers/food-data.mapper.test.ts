import { describe, expect, it } from 'vitest';
import { FoodDataMapper, foodDataMapper, mapPageMeta } from './food-data.mapper';
import type {
  AdminFoodDataRecordDto,
  CookingMethodDto,
  FoodDataImportResultDto,
  IngredientIntakeGuidelineDto,
  IngredientInteractionRuleDto,
  IngredientNutrientsDataDto,
  NutrientReferenceIntakeDto,
} from '../types/food-data.dto';

describe('FoodDataMapper', () => {
  it('1. maps full ingredient nutrition fact with macros, vitamins, minerals and energy', () => {
    const dto: IngredientNutrientsDataDto = {
      id: 'ing-1',
      canonicalName: 'Đậu hũ non',
      normalizedName: 'dau hu non',
      foodGroup: 'LEGUMES',
      aliases: [{ id: 'a1', alias: 'Tàu hũ' }],
      foodProfiles: [
        {
          id: 'p1',
          preparation: 'raw',
          ediblePortionPercent: '100',
          servingGrams: '150',
          quality: 'REVIEWED',
          source: {
            id: 's1',
            code: 'USDA',
            name: 'USDA FoodData Central',
            provider: 'USDA',
            licenseName: 'CC0',
            attribution: 'USDA FDC 2024',
          },
          householdConversions: [
            {
              id: 'c1',
              unitName: 'miếng',
              quantity: '1',
              grams: '150',
            },
          ],
          nutrientValues: [
            {
              id: 'nv1',
              valuePer100g: '76',
              unit: 'kcal',
              nutrient: { code: 'ENERGY', name: 'Năng lượng' },
            },
            {
              id: 'nv2',
              valuePer100g: '8.1',
              unit: 'g',
              nutrient: { code: 'PROTEIN', name: 'Chất đạm' },
            },
            {
              id: 'nv3',
              valuePer100g: '350',
              unit: 'mg',
              nutrient: { code: 'CALCIUM', name: 'Canxi' },
            },
            {
              id: 'nv4',
              valuePer100g: '0.1',
              unit: 'mg',
              nutrient: { code: 'VITAMIN_B1', name: 'Vitamin B1' },
            },
          ],
        },
      ],
    };

    const model = foodDataMapper.toModel(dto);

    expect(model.ingredientId).toBe('ing-1');
    expect(model.canonicalName).toBe('Đậu hũ non');
    expect(model.foodGroup).toBe('LEGUMES');
    expect(model.servingGrams).toBe(150);
    expect(model.energyKcal).toBe(76);
    expect(model.macronutrients).toHaveLength(1);
    expect(model.macronutrients[0].code).toBe('PROTEIN');
    expect(model.macronutrients[0].amount).toBe(8.1);
    expect(model.minerals).toHaveLength(1);
    expect(model.minerals[0].code).toBe('CALCIUM');
    expect(model.vitamins).toHaveLength(1);
    expect(model.vitamins[0].code).toBe('VITAMIN_B1');
  });

  it('2. verifies "Missing is NOT zero": missing nutrient value is null and isMissing=true', () => {
    const dto: IngredientNutrientsDataDto = {
      id: 'ing-2',
      canonicalName: 'Rau bina',
      foodProfiles: [
        {
          id: 'p2',
          nutrientValues: [
            {
              id: 'nv-null',
              valuePer100g: null as unknown as string,
              nutrient: { code: 'VITAMIN_B12', name: 'Vitamin B12' },
            },
            {
              id: 'nv-undefined',
              valuePer100g: undefined,
              nutrient: { code: 'ZINC', name: 'Kẽm' },
            },
            {
              id: 'nv-empty',
              valuePer100g: '',
              nutrient: { code: 'IRON', name: 'Sắt' },
            },
          ],
        },
      ],
    };

    const model = foodDataMapper.toModel(dto);
    const b12 = model.vitamins.find((v) => v.code === 'VITAMIN_B12');
    const zinc = model.minerals.find((m) => m.code === 'ZINC');
    const iron = model.minerals.find((m) => m.code === 'IRON');

    expect(b12).toBeDefined();
    expect(b12?.amount).toBeNull();
    expect(b12?.isMissing).toBe(true);

    expect(zinc).toBeDefined();
    expect(zinc?.amount).toBeNull();
    expect(zinc?.isMissing).toBe(true);

    expect(iron).toBeDefined();
    expect(iron?.amount).toBeNull();
    expect(iron?.isMissing).toBe(true);
  });

  it('3. handles null or undefined DTO gracefully with safe defaults', () => {
    const modelFromNull = foodDataMapper.toModel(null);
    expect(modelFromNull.ingredientId).toBe('');
    expect(modelFromNull.canonicalName).toBe('Nguyên liệu');
    expect(modelFromNull.macronutrients).toEqual([]);
    expect(modelFromNull.vitamins).toEqual([]);
    expect(modelFromNull.minerals).toEqual([]);
    expect(modelFromNull.energyKcal).toBeNull();
    expect(modelFromNull.provenance.sourceName).toBe('Nguồn chưa xác định');
  });

  it('4. maps household conversions correctly', () => {
    const dto: IngredientNutrientsDataDto = {
      id: 'ing-3',
      foodProfiles: [
        {
          householdConversions: [
            {
              id: 'conv-1',
              unitName: 'chén',
              quantity: '1',
              unitDimension: 'VOLUME',
              grams: '200',
            },
            {
              id: 'conv-2',
              unitName: 'muỗng canh',
              quantity: 2,
              grams: 30,
            },
          ],
        },
      ],
    };

    const model = foodDataMapper.toModel(dto);
    expect(model.householdConversions).toHaveLength(2);
    expect(model.householdConversions[0].unitName).toBe('chén');
    expect(model.householdConversions[0].grams).toBe(200);
    expect(model.householdConversions[1].quantity).toBe(2);
  });

  it('5. maps provenance information including attribution and license', () => {
    const dto: IngredientNutrientsDataDto = {
      id: 'ing-4',
      foodProfiles: [
        {
          sourceRecordId: 'REC-123',
          sourceVersion: 'v2024.2',
          effectiveFrom: '2024-06-01',
          source: {
            id: 'src-1',
            code: 'NIN_VN',
            name: 'Viện Dinh Dưỡng Quốc Gia 2017',
            provider: 'NIN_VN',
            licenseName: 'Public Curation',
            attribution: 'Bảng thành phần thực phẩm VN 2017',
            defaultLocale: 'vi-VN',
          },
        },
      ],
    };

    const model = foodDataMapper.toModel(dto);
    expect(model.provenance.sourceCode).toBe('NIN_VN');
    expect(model.provenance.sourceName).toBe('Viện Dinh Dưỡng Quốc Gia 2017');
    expect(model.provenance.licenseName).toBe('Public Curation');
    expect(model.provenance.sourceRecordId).toBe('REC-123');
    expect(model.provenance.effectiveFrom).toBe('2024-06-01');
  });

  it('6. maps reference intake item correctly with RDA/AI/UL and population', () => {
    const dto: NutrientReferenceIntakeDto = {
      id: 'ri-1',
      referenceType: 'RDA',
      populationCode: 'ADULT_FEMALE',
      value: '18',
      unit: 'mg',
      warningEligible: true,
      nutrient: { code: 'IRON', name: 'Sắt' },
      source: { name: 'NIH' },
    };

    const model = foodDataMapper.toReferenceIntakeModel(dto);
    expect(model.id).toBe('ri-1');
    expect(model.nutrientCode).toBe('IRON');
    expect(model.populationCode).toBe('ADULT_FEMALE');
    expect(model.populationName).toBe('Nữ giới trưởng thành');
    expect(model.referenceType).toBe('RDA');
    expect(model.value).toBe(18);
    expect(model.unit).toBe('mg');
    expect(model.warningEligible).toBe(true);
  });

  it('7. maps reference intake list', () => {
    const listDto: NutrientReferenceIntakeDto[] = [
      { id: 'ri-1', value: '10', nutrient: { code: 'ZINC' } },
      { id: 'ri-2', value: '1000', nutrient: { code: 'CALCIUM' } },
    ];

    const list = foodDataMapper.toReferenceIntakeList(listDto);
    expect(list).toHaveLength(2);
    expect(list[0].nutrientCode).toBe('ZINC');
    expect(list[1].value).toBe(1000);
  });

  it('8. maps ingredient guideline with amount, frequency and period', () => {
    const dto: IngredientIntakeGuidelineDto = {
      id: 'ig-1',
      ingredientId: 'ing-5',
      amount: '50',
      unit: 'g',
      frequency: 1,
      period: 'DAY',
      severity: 'WARNING',
      evidenceGrade: 'STRONG',
      explanation: 'Không nên dùng quá nhiều trong một ngày.',
      ingredient: { canonicalName: 'Hạt chia' },
    };

    const model = foodDataMapper.toGuidelineModel(dto);
    expect(model.id).toBe('ig-1');
    expect(model.ingredientName).toBe('Hạt chia');
    expect(model.amount).toBe(50);
    expect(model.period).toBe('DAY');
    expect(model.periodLabel).toBe('mỗi ngày');
    expect(model.severity).toBe('WARNING');
    expect(model.severityLabel).toBe('Cảnh báo');
  });

  it('9. maps cooking method with retention factors and yield factors', () => {
    const dto: CookingMethodDto = {
      id: 'cm-1',
      code: 'STEAMING',
      name: 'Hấp',
      description: 'Hấp hơi nước',
      active: true,
      retentionFactors: [
        {
          factor: '0.9',
          nutrient: { code: 'VITAMIN_C', name: 'Vitamin C' },
        },
      ],
      yieldFactors: [
        {
          factor: '0.95',
          ingredientId: null,
        },
      ],
    };

    const model = foodDataMapper.toCookingMethodModel(dto);
    expect(model.code).toBe('STEAMING');
    expect(model.name).toBe('Hấp');
    expect(model.retentionFactors).toHaveLength(1);
    expect(model.retentionFactors[0].factor).toBe(0.9);
    expect(model.retentionFactors[0].retentionPercent).toBe(90);
    expect(model.yieldFactors).toHaveLength(1);
    expect(model.yieldFactors[0].yieldPercent).toBe(95);
  });

  it('10. maps interaction rule with scope, severity and mechanism', () => {
    const dto: IngredientInteractionRuleDto = {
      id: 'ir-1',
      ingredientA: { id: 'a1', canonicalName: 'Cải bó xôi' },
      ingredientB: { id: 'b1', canonicalName: 'Đậu hũ' },
      scope: 'SAME_DISH',
      direction: 'BIDIRECTIONAL',
      severity: 'WARNING',
      evidenceGrade: 'MODERATE',
      explanation: 'Axit oxalic kết tủa canxi.',
      suggestedAction: 'Chần sơ rau bina.',
      hardRule: false,
    };

    const model = foodDataMapper.toInteractionRuleModel(dto);
    expect(model.ingredientA.name).toBe('Cải bó xôi');
    expect(model.ingredientB.name).toBe('Đậu hũ');
    expect(model.scope).toBe('SAME_DISH');
    expect(model.scopeLabel).toBe('Cùng món');
    expect(model.severity).toBe('WARNING');
    expect(model.severityLabel).toBe('Cảnh báo');
    expect(model.suggestedAction).toBe('Chần sơ rau bina.');
  });

  it('11. maps admin record with polymorphic kind and display name', () => {
    const dto: AdminFoodDataRecordDto = {
      id: 'rec-1',
      kind: 'NUTRIENT',
      name: 'Vitamin B12',
      code: 'VITAMIN_B12',
      status: 'ACTIVE',
      effectiveFrom: '2024-01-01',
      updatedAt: '2024-01-02',
      data: { defaultUnit: 'mcg' },
    };

    const model = foodDataMapper.toAdminRecordModel(dto);
    expect(model.id).toBe('rec-1');
    expect(model.kind).toBe('NUTRIENT');
    expect(model.displayName).toBe('Vitamin B12');
    expect(model.codeOrId).toBe('VITAMIN_B12');
    expect(model.status).toBe('ACTIVE');
  });

  it('12. maps import preview result and checks idempotentReplay', () => {
    const dto: FoodDataImportResultDto = {
      importId: 'imp-1',
      status: 'COMMITTED',
      idempotentReplay: true,
      summary: {
        totalRecords: 10,
        validRecords: 10,
        errorCount: 0,
        newIngredientsCount: 5,
        mappedNutrientsCount: 40,
      },
    };

    const model = foodDataMapper.toImportPreviewResult(dto);
    expect(model.importId).toBe('imp-1');
    expect(model.status).toBe('COMMITTED');
    expect(model.idempotentReplay).toBe(true);
    expect(model.summary.totalRecords).toBe(10);
    expect(model.summary.newIngredientsCount).toBe(5);
  });

  it('13. mapPageMeta calculates pagination metadata properly', () => {
    const meta = mapPageMeta({ page: 2, limit: 10, total: 35, totalPages: 4 });
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(10);
    expect(meta.totalItems).toBe(35);
    expect(meta.totalPages).toBe(4);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });
});
