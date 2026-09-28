import { describe, expect, it } from 'vitest';
import { MealProgramMapper } from './meal-program.mapper';
import type { MealProgramDto, MealProgramListItemDto } from '../types/meal-program.dto';

describe('MealProgramMapper', () => {
  const mapper = new MealProgramMapper();

  it('1. should handle null and undefined DTO gracefully with safe defaults', () => {
    const resultNull = mapper.toModel(null);
    expect(resultNull.id).toBe('');
    expect(resultNull.status).toBe('DRAFT');
    expect(resultNull.statusLabel).toBe('Bản nháp');
    expect(resultNull.statusBadgeVariant).toBe('warning');
    expect(resultNull.weeks).toEqual([]);
    expect(resultNull.cumulativeAnalysis).toBeNull();
    expect(resultNull.overallComplianceRate).toBe(0);

    const resultUndefined = mapper.toModel(undefined);
    expect(resultUndefined.id).toBe('');
    expect(resultUndefined.timezone).toBe('Asia/Ho_Chi_Minh');
  });

  it('2. should map full MealProgramDto in DRAFT status correctly', () => {
    const dto: MealProgramDto = {
      id: 'mp-1',
      user_id: 'user-1',
      title: 'Lộ trình thanh lọc 4 tuần',
      goal: 'Thanh lọc cơ thể và giải độc',
      start_date: '2026-10-01',
      end_date: '2026-10-28',
      timezone: 'Asia/Ho_Chi_Minh',
      horizon_weeks: 4,
      status: 'DRAFT',
      version: 1,
      template_id: 'tpl-1',
      weeks: [],
      cumulative_analysis: null,
      created_at: '2026-09-23T10:00:00Z',
      updated_at: '2026-09-23T10:00:00Z',
    };

    const model = mapper.toModel(dto);
    expect(model.id).toBe('mp-1');
    expect(model.userId).toBe('user-1');
    expect(model.title).toBe('Lộ trình thanh lọc 4 tuần');
    expect(model.status).toBe('DRAFT');
    expect(model.statusLabel).toBe('Bản nháp');
    expect(model.statusBadgeVariant).toBe('warning');
    expect(model.formattedDateRange).toBe('01/10/2026 – 28/10/2026');
    expect(model.version).toBe(1);
    expect(model.templateId).toBe('tpl-1');
  });

  it('3. should map status CONFIRMED and calculate overall compliance rate from weeks', () => {
    const dto: MealProgramDto = {
      id: 'mp-2',
      user_id: 'user-1',
      title: '21 ngày ăn chay',
      goal: 'Làm quen thuần chay',
      start_date: '2026-09-28',
      end_date: '2026-10-18',
      timezone: 'Asia/Ho_Chi_Minh',
      horizon_weeks: 3,
      status: 'CONFIRMED',
      version: 2,
      weeks: [
        {
          id: 'w-1',
          program_id: 'mp-2',
          week_number: 1,
          start_date: '2026-09-28',
          end_date: '2026-10-04',
          status: 'COMPLETED',
          compliance_rate: 100,
          is_downstream_invalidated: false,
        },
        {
          id: 'w-2',
          program_id: 'mp-2',
          week_number: 2,
          start_date: '2026-10-05',
          end_date: '2026-10-11',
          status: 'ACTIVE',
          compliance_rate: 50,
          is_downstream_invalidated: false,
        },
        {
          id: 'w-3',
          program_id: 'mp-2',
          week_number: 3,
          start_date: '2026-10-12',
          end_date: '2026-10-18',
          status: 'UPCOMING',
          compliance_rate: 0,
          is_downstream_invalidated: false,
        },
      ],
      created_at: '2026-09-23T10:00:00Z',
      updated_at: '2026-09-23T10:00:00Z',
    };

    const model = mapper.toModel(dto);
    expect(model.status).toBe('CONFIRMED');
    expect(model.statusLabel).toBe('Đang tham gia');
    expect(model.statusBadgeVariant).toBe('default');
    expect(model.weeks.length).toBe(3);
    expect(model.weeks[0].statusLabel).toBe('Đã hoàn thành');
    expect(model.weeks[1].statusLabel).toBe('Đang thực hiện');
    expect(model.weeks[2].statusLabel).toBe('Sắp tới');
    // Overall compliance = (100 + 50 + 0) / 3 = 50
    expect(model.overallComplianceRate).toBe(50);
  });

  it('4. should map WeeklyPlanSnapshot and calculate total day calories correctly', () => {
    const weekDto = {
      id: 'w-1',
      program_id: 'mp-1',
      week_number: 1,
      start_date: '2026-10-01',
      end_date: '2026-10-07',
      status: 'ACTIVE' as const,
      compliance_rate: 80,
      is_downstream_invalidated: false,
      snapshot: {
        captured_at: '2026-09-23T10:00:00Z',
        total_calories: 14000,
        macronutrients: {
          protein_g: 500,
          carbs_g: 1500,
          fat_g: 400,
          fiber_g: 200,
        },
        days: [
          {
            date: '2026-10-01',
            day_of_week: 4,
            meals: [
              {
                id: 'm-1',
                meal_type: 'BREAKFAST' as const,
                source_type: 'RECIPE' as const,
                name: 'Yến mạch sữa đậu',
                servings: 1,
                calories: 400,
                image_url: 'https://example.com/img.jpg',
              },
              {
                id: 'm-2',
                meal_type: 'LUNCH' as const,
                source_type: 'CUSTOM_MEAL' as const,
                name: 'Đậu hũ áp chảo',
                servings: 1,
                calories: 600,
              },
            ],
          },
        ],
      },
    };

    const weekModel = mapper.mapWeek(weekDto);
    expect(weekModel.snapshot).not.toBeNull();
    expect(weekModel.snapshot?.totalCalories).toBe(14000);
    expect(weekModel.snapshot?.macronutrients.protein).toBe(500);
    expect(weekModel.snapshot?.days.length).toBe(1);

    const day = weekModel.snapshot?.days[0];
    expect(day?.formattedDate).toBe('01/10');
    expect(day?.totalCalories).toBe(1000); // 400 + 600
    expect(day?.meals[0].mealTypeLabel).toBe('Bữa sáng');
    expect(day?.meals[0].sourceTypeLabel).toBe('Công thức');
    expect(day?.meals[1].mealTypeLabel).toBe('Bữa trưa');
    expect(day?.meals[1].sourceTypeLabel).toBe('Món cá nhân');
  });

  it('5. should map cumulative analysis with repeated pattern warnings', () => {
    const analysisDto = {
      average_daily_calories: 1950,
      average_macronutrients: {
        protein_g: 75,
        carbs_g: 270,
        fat_g: 50,
        fiber_g: 35,
      },
      repeated_pattern_warnings: [
        {
          meal_id: 'm-1',
          meal_name: 'Đậu hũ xốt cà chua',
          source_type: 'RECIPE' as const,
          occurrences: 4,
          dates: ['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05'],
          message: 'Món ăn lặp lại 4 lần trong tuần',
        },
      ],
      is_invalidated: false,
      analyzed_at: '2026-09-23T10:00:00Z',
    };

    const analysis = mapper.mapCumulativeAnalysis(analysisDto);
    expect(analysis).not.toBeNull();
    expect(analysis?.averageDailyCalories).toBe(1950);
    expect(analysis?.averageMacronutrients.protein).toBe(75);
    expect(analysis?.repeatedPatternWarnings.length).toBe(1);
    expect(analysis?.repeatedPatternWarnings[0].occurrences).toBe(4);
    expect(analysis?.repeatedPatternWarnings[0].mealName).toBe('Đậu hũ xốt cà chua');
    expect(analysis?.isInvalidated).toBe(false);
  });

  it('6. should map downstream invalidated flag when week is updated', () => {
    const weekDto = {
      id: 'w-2',
      program_id: 'mp-1',
      week_number: 2,
      start_date: '2026-10-08',
      end_date: '2026-10-14',
      status: 'UPCOMING' as const,
      compliance_rate: 0,
      is_downstream_invalidated: true,
    };

    const weekModel = mapper.mapWeek(weekDto);
    expect(weekModel.isDownstreamInvalidated).toBe(true);
  });

  it('7. should map list item DTOs with pagination', () => {
    const listDto: MealProgramListItemDto = {
      id: 'mp-list-1',
      user_id: 'user-1',
      title: 'Tăng cơ thuần chay',
      goal: 'Nạp đủ protein',
      start_date: '2026-10-01',
      end_date: '2026-10-28',
      timezone: 'Asia/Ho_Chi_Minh',
      horizon_weeks: 4,
      status: 'COMPLETED',
      version: 5,
      overall_compliance_rate: 92,
      current_week_number: 4,
      total_weeks: 4,
      cover_image_url: 'https://example.com/cover.jpg',
      created_at: '2026-09-23T10:00:00Z',
      updated_at: '2026-09-23T10:00:00Z',
    };

    const listItem = mapper.toListItem(listDto);
    expect(listItem.id).toBe('mp-list-1');
    expect(listItem.status).toBe('COMPLETED');
    expect(listItem.statusLabel).toBe('Đã hoàn thành');
    expect(listItem.statusBadgeVariant).toBe('success');
    expect(listItem.overallComplianceRate).toBe(92);
    expect(listItem.coverImageUrl).toBe('https://example.com/cover.jpg');

    const result = mapper.toListResult({
      items: [listDto],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });
    expect(result.items.length).toBe(1);
    expect(result.pagination.totalItems).toBe(1);
  });

  it('8. should map ARCHIVED status correctly', () => {
    const dto: MealProgramDto = {
      id: 'mp-archived',
      user_id: 'user-1',
      title: 'Lộ trình cũ',
      goal: 'Lưu trữ',
      start_date: '2026-01-01',
      end_date: '2026-01-28',
      timezone: 'Asia/Ho_Chi_Minh',
      horizon_weeks: 4,
      status: 'ARCHIVED',
      version: 3,
      weeks: [],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-28T00:00:00Z',
    };

    const model = mapper.toModel(dto);
    expect(model.status).toBe('ARCHIVED');
    expect(model.statusLabel).toBe('Đã lưu trữ');
    expect(model.statusBadgeVariant).toBe('secondary');
  });

  it('9. should safely handle empty and missing snapshot in week', () => {
    const weekDto = {
      id: 'w-empty',
      program_id: 'mp-1',
      week_number: 1,
      start_date: '2026-10-01',
      end_date: '2026-10-07',
      status: 'UPCOMING' as const,
      compliance_rate: 0,
      is_downstream_invalidated: false,
      snapshot: null,
    };

    const weekModel = mapper.mapWeek(weekDto);
    expect(weekModel.snapshot).toBeNull();
  });

  it('10. should safely handle empty meals array in a day', () => {
    const day = mapper.mapDay({
      date: '2026-10-01',
      day_of_week: 4,
      meals: [],
    });
    expect(day.meals).toEqual([]);
    expect(day.totalCalories).toBe(0);
  });

  it('11. should correctly group 21 slots by date and order by mealType into 7 days', () => {
    const dates = [
      '2026-09-28', // Monday
      '2026-09-29', // Tuesday
      '2026-09-30', // Wednesday
      '2026-10-01', // Thursday
      '2026-10-02', // Friday
      '2026-10-03', // Saturday
      '2026-10-04', // Sunday
    ];

    const mealTypes: Array<'BREAKFAST' | 'LUNCH' | 'DINNER'> = ['BREAKFAST', 'LUNCH', 'DINNER'];
    const items: unknown[] = [];

    // Create 21 items, intentionally shuffle mealType order in input
    dates.forEach((date, dayIdx) => {
      // Intentionally insert DINNER before BREAKFAST to test sorting
      items.push({
        id: `item-${dayIdx}-dinner`,
        date,
        mealType: 'DINNER',
        position: dayIdx * 3 + 2,
        calories: 600,
        recipe: { title: `Cơm tối ngày ${dayIdx + 1}` },
      });
      items.push({
        id: `item-${dayIdx}-breakfast`,
        date,
        mealType: 'BREAKFAST',
        position: dayIdx * 3,
        calories: 400,
        recipe: { title: `Bữa sáng ngày ${dayIdx + 1}` },
      });
      items.push({
        id: `item-${dayIdx}-lunch`,
        date,
        mealType: 'LUNCH',
        position: dayIdx * 3 + 1,
        calories: 500,
        customMeal: { name: `Bữa trưa ngày ${dayIdx + 1}` },
      });
    });

    const weekDto = {
      id: 'w-multi-days',
      weekNumber: 1,
      startDate: '2026-09-28',
      status: 'READY' as const,
      snapshot: {
        totalCalories: 10500,
        items,
      },
    };

    const weekModel = mapper.mapWeek(weekDto);
    expect(weekModel.snapshot).not.toBeNull();
    const days = weekModel.snapshot!.days;

    // Verify 7 distinct days are generated
    expect(days.length).toBe(7);

    // Verify each day corresponds to the correct date and day of week
    const expectedDayLabels = [
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
      'Chủ Nhật',
    ];
    days.forEach((day, index) => {
      expect(day.date).toBe(dates[index]);
      expect(day.dayOfWeek).toBe(index + 1);
      expect(day.dayOfWeekLabel).toBe(expectedDayLabels[index]);
      expect(day.meals.length).toBe(3);
      expect(day.totalCalories).toBe(1500); // 400 + 500 + 600

      // Verify meals are sorted in order: BREAKFAST -> LUNCH -> DINNER
      expect(day.meals[0].mealType).toBe('BREAKFAST');
      expect(day.meals[0].mealTypeLabel).toBe('Bữa sáng');
      expect(day.meals[0].sourceType).toBe('RECIPE');

      expect(day.meals[1].mealType).toBe('LUNCH');
      expect(day.meals[1].mealTypeLabel).toBe('Bữa trưa');
      expect(day.meals[1].sourceType).toBe('CUSTOM_MEAL');

      expect(day.meals[2].mealType).toBe('DINNER');
      expect(day.meals[2].mealTypeLabel).toBe('Bữa tối');
      expect(day.meals[2].sourceType).toBe('RECIPE');
    });
  });
});
