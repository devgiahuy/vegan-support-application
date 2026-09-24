import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type {
  CumulativeAnalysisDto,
  MealProgramDto,
  MealProgramListItemDto,
  MealProgramListResponseDto,
  MealProgramStatusDto,
  ProgramWeekDto,
  ProgramWeekStatusDto,
  RepeatedPatternWarningDto,
  WeeklyPlanDayDto,
  WeeklyPlanMealItemDto,
  WeeklyPlanSnapshotDto,
} from '../types/meal-program.dto';
import type {
  CumulativeAnalysis,
  MealItemSummary,
  MealProgram,
  MealProgramListItem,
  MealProgramListResult,
  MealProgramStatus,
  ProgramDaySummary,
  ProgramWeek,
  ProgramWeekStatus,
  RepeatedPatternWarning,
  WeeklyPlanSnapshot,
} from '../types/meal-program.model';

export class MealProgramMapper extends BaseMapper<MealProgramDto, MealProgram> {
  public toModel(dto: MealProgramDto | null | undefined): MealProgram {
    if (!dto) {
      return {
        id: '',
        userId: '',
        title: '',
        goal: 'MAINTAIN',
        goalLabel: 'Duy trì vóc dáng',
        startDate: '',
        endDate: '',
        formattedDateRange: '',
        timezone: 'Asia/Ho_Chi_Minh',
        horizonWeeks: 0,
        status: 'DRAFT',
        statusLabel: 'Bản nháp',
        statusBadgeVariant: 'warning',
        version: 1,
        templateId: null,
        weeks: [],
        cumulativeAnalysis: null,
        overallComplianceRate: 0,
        createdAt: '',
        updatedAt: '',
      };
    }

    const status = this.mapStatus(dto.status);
    const weeks = safeArray<ProgramWeekDto, ProgramWeek>(dto.weeks, (weekDto) =>
      this.mapWeek(weekDto)
    );
    const overallComplianceRate = this.calculateOverallCompliance(weeks);
    const goal = safeString(pickField(dto, ['goal'], 'MAINTAIN'), 'MAINTAIN');

    const startDate = safeString(pickField(dto, ['start_date', 'startDate'], ''), '');
    let endDate = safeString(pickField(dto, ['end_date', 'endDate'], ''), '');
    const horizonWeeks = safeNumber(pickField(dto, ['horizon_weeks', 'horizonWeeks'], 0), 0);

    if (!endDate && startDate && horizonWeeks > 0) {
      endDate = this.calculateEndDate(startDate, horizonWeeks);
    }

    const rawAnalysis = dto.analysis ?? dto.cumulative_analysis ?? dto.cumulativeAnalysis;

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      userId: safeString(pickField(dto, ['user_id', 'userId'], ''), ''),
      title: safeString(pickField(dto, ['title'], ''), ''),
      goal,
      goalLabel: this.mapGoalLabel(goal),
      startDate,
      endDate,
      formattedDateRange: this.formatDateRange(startDate, endDate),
      timezone: safeString(pickField(dto, ['timezone'], 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh'),
      horizonWeeks,
      status,
      statusLabel: this.mapStatusLabel(status),
      statusBadgeVariant: this.mapStatusBadgeVariant(status),
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      templateId: dto.template_id
        ? safeString(dto.template_id)
        : dto.template_id === null
          ? null
          : (dto.templateId ?? undefined),
      weeks,
      cumulativeAnalysis: this.mapCumulativeAnalysis(rawAnalysis),
      overallComplianceRate,
      createdAt: safeString(pickField(dto, ['created_at', 'createdAt'], ''), ''),
      updatedAt: safeString(pickField(dto, ['updated_at', 'updatedAt'], ''), ''),
    };
  }

  public toListItem(dto: MealProgramListItemDto | null | undefined): MealProgramListItem {
    if (!dto) {
      return {
        id: '',
        userId: '',
        title: '',
        goal: 'MAINTAIN',
        goalLabel: 'Duy trì vóc dáng',
        startDate: '',
        endDate: '',
        formattedDateRange: '',
        timezone: 'Asia/Ho_Chi_Minh',
        horizonWeeks: 0,
        status: 'DRAFT',
        statusLabel: 'Bản nháp',
        statusBadgeVariant: 'warning',
        version: 1,
        templateId: null,
        overallComplianceRate: 0,
        currentWeekNumber: 1,
        totalWeeks: 0,
        coverImageUrl: null,
        createdAt: '',
        updatedAt: '',
      };
    }

    const status = this.mapStatus(dto.status);
    const horizonWeeks = safeNumber(pickField(dto, ['horizon_weeks', 'horizonWeeks'], 0), 0);
    const totalWeeks = safeNumber(
      pickField(dto, ['total_weeks', 'totalWeeks', 'readyWeeks', 'ready_weeks'], horizonWeeks),
      horizonWeeks
    );
    const goal = safeString(pickField(dto, ['goal'], 'MAINTAIN'), 'MAINTAIN');

    const startDate = safeString(pickField(dto, ['start_date', 'startDate'], ''), '');
    let endDate = safeString(pickField(dto, ['end_date', 'endDate'], ''), '');
    if (!endDate && startDate && horizonWeeks > 0) {
      endDate = this.calculateEndDate(startDate, horizonWeeks);
    }

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      userId: safeString(pickField(dto, ['user_id', 'userId'], ''), ''),
      title: safeString(pickField(dto, ['title'], ''), ''),
      goal,
      goalLabel: this.mapGoalLabel(goal),
      startDate,
      endDate,
      formattedDateRange: this.formatDateRange(startDate, endDate),
      timezone: safeString(pickField(dto, ['timezone'], 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh'),
      horizonWeeks,
      status,
      statusLabel: this.mapStatusLabel(status),
      statusBadgeVariant: this.mapStatusBadgeVariant(status),
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      templateId: dto.template_id ? safeString(dto.template_id) : (dto.templateId ?? null),
      overallComplianceRate: safeNumber(
        pickField(dto, ['overall_compliance_rate', 'overallComplianceRate'], 0),
        0
      ),
      currentWeekNumber: safeNumber(
        pickField(dto, ['current_week_number', 'currentWeekNumber'], 1),
        1
      ),
      totalWeeks,
      coverImageUrl: dto.cover_image_url
        ? safeString(dto.cover_image_url)
        : (dto.coverImageUrl ?? null),
      createdAt: safeString(pickField(dto, ['created_at', 'createdAt'], ''), ''),
      updatedAt: safeString(pickField(dto, ['updated_at', 'updatedAt'], ''), ''),
    };
  }

  public toListResult(
    response: MealProgramListResponseDto | null | undefined
  ): MealProgramListResult {
    if (!response) {
      return {
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    const rawItems = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.items)
        ? response.items
        : [];

    const meta = response.meta ?? response.pagination;

    return {
      items: safeArray<MealProgramListItemDto, MealProgramListItem>(rawItems, (item) =>
        this.toListItem(item)
      ),
      pagination: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 10),
        totalItems: safeNumber(pickField(meta, ['total', 'totalItems'], 0), 0),
        totalPages: safeNumber(meta?.totalPages, 0),
      },
    };
  }

  public mapWeek(dto: ProgramWeekDto | null | undefined): ProgramWeek {
    if (!dto) {
      return {
        id: '',
        programId: '',
        weekNumber: 1,
        startDate: '',
        endDate: '',
        formattedDateRange: '',
        status: 'UPCOMING',
        statusLabel: 'Sắp tới',
        complianceRate: 0,
        isDownstreamInvalidated: false,
        snapshot: null,
      };
    }

    const weekIndex = safeNumber(pickField(dto, ['week_index', 'weekIndex'], 0), 0);
    const weekNumber = safeNumber(
      pickField(dto, ['week_number', 'weekNumber'], weekIndex + 1),
      weekIndex + 1
    );

    const startDate = safeString(
      pickField(dto, ['start_date', 'startDate', 'week_start', 'weekStart'], ''),
      ''
    );

    let endDate = safeString(pickField(dto, ['end_date', 'endDate'], ''), '');
    if (!endDate && startDate) {
      endDate = this.calculateEndDate(startDate, 1);
    }

    const projectionStatus = safeString(
      pickField(dto, ['projection_status', 'projectionStatus'], 'CURRENT'),
      'CURRENT'
    );
    const isDownstreamInvalidated =
      projectionStatus === 'STALE' ||
      safeBoolean(
        pickField(dto, ['is_downstream_invalidated', 'isDownstreamInvalidated'], false),
        false
      );

    const status = this.mapWeekStatus(dto.status);

    // Extract snapshot from direct field or selected alternative
    const alternatives = Array.isArray(dto.alternatives) ? dto.alternatives : [];
    const selectedAlternative =
      alternatives.find(
        (a) =>
          a.selected ||
          (dto.selectedAlternativeRank !== undefined && a.rank === dto.selectedAlternativeRank)
      ) ?? alternatives[0];

    const rawSnapshot =
      (dto.snapshot as WeeklyPlanSnapshotDto | undefined) ??
      (selectedAlternative?.snapshot as WeeklyPlanSnapshotDto | undefined);

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      programId: safeString(pickField(dto, ['program_id', 'programId'], ''), ''),
      weekNumber,
      startDate,
      endDate,
      formattedDateRange: this.formatDateRange(startDate, endDate),
      status,
      statusLabel: this.mapWeekStatusLabel(status),
      complianceRate: safeNumber(pickField(dto, ['compliance_rate', 'complianceRate'], 0), 0),
      isDownstreamInvalidated,
      snapshot: this.mapSnapshot(rawSnapshot, startDate),
    };
  }

  public mapSnapshot(
    dto: WeeklyPlanSnapshotDto | null | undefined,
    weekStartDate?: string
  ): WeeklyPlanSnapshot | null {
    if (!dto) return null;

    let days: ProgramDaySummary[] = [];

    // Case 1: Snapshot has direct `days` array
    if (Array.isArray(dto.days) && dto.days.length > 0) {
      days = safeArray<WeeklyPlanDayDto, ProgramDaySummary>(dto.days, (dayDto) =>
        this.mapDay(dayDto)
      );
    }
    // Case 2: Snapshot is a MealPlan from Phase 10 with `items` (MealSlots)
    else if (Array.isArray(dto.items) && dto.items.length > 0) {
      days = this.groupSlotsIntoDays(dto.items, weekStartDate);
    } else if (Array.isArray(dto.slots) && dto.slots.length > 0) {
      days = this.groupSlotsIntoDays(dto.slots, weekStartDate);
    }

    const macronutrients = dto.macronutrients ?? {};

    return {
      capturedAt: safeString(pickField(dto, ['captured_at', 'capturedAt'], ''), ''),
      totalCalories: safeNumber(
        pickField(dto, ['total_calories', 'totalCalories', 'targetCalories', 'target_calories'], 0),
        0
      ),
      macronutrients: {
        protein: safeNumber(pickField(macronutrients, ['protein_g', 'protein'], 0), 0),
        carbs: safeNumber(pickField(macronutrients, ['carbs_g', 'carbs'], 0), 0),
        fat: safeNumber(pickField(macronutrients, ['fat_g', 'fat'], 0), 0),
        fiber: safeNumber(pickField(macronutrients, ['fiber_g', 'fiber'], 0), 0),
      },
      days,
    };
  }

  public mapDay(dto: WeeklyPlanDayDto | null | undefined): ProgramDaySummary {
    if (!dto) {
      return {
        date: '',
        formattedDate: '',
        dayOfWeek: 1,
        meals: [],
        totalCalories: 0,
      };
    }

    const meals = safeArray<WeeklyPlanMealItemDto, MealItemSummary>(dto.meals, (mealDto) =>
      this.mapMealItem(mealDto)
    );
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

    return {
      date: safeString(pickField(dto, ['date'], ''), ''),
      formattedDate: this.formatDayDate(safeString(pickField(dto, ['date'], ''), '')),
      dayOfWeek: safeNumber(pickField(dto, ['day_of_week', 'dayOfWeek'], 1), 1),
      meals,
      totalCalories,
    };
  }

  public mapMealItem(dto: WeeklyPlanMealItemDto | null | undefined): MealItemSummary {
    if (!dto) {
      return {
        id: '',
        name: '',
        mealType: 'BREAKFAST',
        mealTypeLabel: 'Bữa sáng',
        sourceType: 'RECIPE',
        sourceTypeLabel: 'Công thức',
        servings: 1,
        calories: 0,
        imageUrl: undefined,
      };
    }

    const mealType = dto.meal_type ?? dto.mealType ?? 'BREAKFAST';
    const sourceType = dto.source_type ?? dto.sourceType ?? 'RECIPE';

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      name: safeString(pickField(dto, ['name'], ''), ''),
      mealType,
      mealTypeLabel: this.mapMealTypeLabel(mealType),
      sourceType,
      sourceTypeLabel: sourceType === 'RECIPE' ? 'Công thức' : 'Món cá nhân',
      servings: safeNumber(pickField(dto, ['servings'], 1), 1),
      calories: safeNumber(pickField(dto, ['calories'], 0), 0),
      imageUrl: dto.image_url
        ? safeString(dto.image_url)
        : dto.imageUrl
          ? safeString(dto.imageUrl)
          : undefined,
    };
  }

  public mapCumulativeAnalysis(
    dto: CumulativeAnalysisDto | null | undefined
  ): CumulativeAnalysis | null {
    if (!dto) return null;

    const nutritionSummary = dto.nutritionSummary ?? {};
    const averageDailyCalories = safeNumber(
      pickField(
        dto,
        ['average_daily_calories', 'averageDailyCalories'],
        nutritionSummary.averageDailyCalories ?? 0
      ),
      0
    );

    const averageMacronutrients = dto.average_macronutrients ?? {};

    const rawWarnings =
      dto.warnings ?? dto.repeated_pattern_warnings ?? dto.repeatedPatternWarnings ?? [];

    return {
      averageDailyCalories,
      averageMacronutrients: {
        protein: safeNumber(pickField(averageMacronutrients, ['protein_g', 'protein'], 0), 0),
        carbs: safeNumber(pickField(averageMacronutrients, ['carbs_g', 'carbs'], 0), 0),
        fat: safeNumber(pickField(averageMacronutrients, ['fat_g', 'fat'], 0), 0),
        fiber: safeNumber(pickField(averageMacronutrients, ['fiber_g', 'fiber'], 0), 0),
      },
      repeatedPatternWarnings: safeArray<RepeatedPatternWarningDto, RepeatedPatternWarning>(
        rawWarnings,
        (w) => this.mapWarning(w)
      ),
      isInvalidated:
        dto.status === 'STALE' ||
        safeBoolean(pickField(dto, ['is_invalidated', 'isInvalidated'], false), false),
      analyzedAt: safeString(pickField(dto, ['analyzed_at', 'analyzedAt'], ''), ''),
      analyzedAtFormatted: this.formatDateTime(
        safeString(pickField(dto, ['analyzed_at', 'analyzedAt'], ''), '')
      ),
    };
  }

  public mapWarning(dto: RepeatedPatternWarningDto | null | undefined): RepeatedPatternWarning {
    if (!dto) {
      return {
        mealId: '',
        mealName: '',
        sourceType: 'RECIPE',
        occurrences: 0,
        dates: [],
        message: '',
      };
    }

    const mealId = safeString(
      pickField(dto, ['meal_id', 'mealId', 'recipe_id', 'recipeId'], ''),
      ''
    );
    const mealName = safeString(
      pickField(dto, ['meal_name', 'mealName', 'recipe_title', 'recipeTitle'], 'Món ăn'),
      'Món ăn'
    );
    const dates = safeArray(dto.dates, (d) => safeString(d));

    return {
      mealId,
      mealName,
      sourceType: dto.source_type ?? dto.sourceType ?? 'RECIPE',
      occurrences: safeNumber(pickField(dto, ['occurrences', 'count'], 0), 0),
      dates,
      formattedDates: dates.map((d) => this.formatDayDate(d)),
      message: safeString(
        pickField(dto, ['message'], `${mealName} lặp lại nhiều lần trong chương trình`),
        `${mealName} lặp lại nhiều lần trong chương trình`
      ),
    };
  }

  public mapGoalLabel(goal: string): string {
    switch (goal) {
      case 'LOSE':
        return 'Giảm cân & Thanh lọc';
      case 'MAINTAIN':
        return 'Duy trì vóc dáng';
      case 'GAIN':
        return 'Tăng cân & Tăng cơ';
      default:
        return goal || 'Cân bằng dinh dưỡng';
    }
  }

  private mapStatus(dtoStatus?: MealProgramStatusDto): MealProgramStatus {
    switch (dtoStatus) {
      case 'CONFIRMED':
        return 'CONFIRMED';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'ARCHIVED':
        return 'ARCHIVED';
      case 'FAILED':
        return 'FAILED';
      case 'DRAFT':
      default:
        return 'DRAFT';
    }
  }

  private mapStatusLabel(status: MealProgramStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Đang tham gia';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'ARCHIVED':
        return 'Đã lưu trữ';
      case 'FAILED':
        return 'Khởi tạo lỗi';
      case 'DRAFT':
      default:
        return 'Bản nháp';
    }
  }

  private mapStatusBadgeVariant(
    status: MealProgramStatus
  ): 'warning' | 'default' | 'success' | 'secondary' | 'destructive' {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'COMPLETED':
        return 'success';
      case 'ARCHIVED':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      case 'DRAFT':
      default:
        return 'warning';
    }
  }

  private mapWeekStatus(dtoStatus?: ProgramWeekStatusDto): ProgramWeekStatus {
    switch (dtoStatus) {
      case 'ACTIVE':
        return 'ACTIVE';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'READY':
      case 'GENERATING':
      case 'PENDING':
      case 'FAILED':
      case 'UPCOMING':
      default:
        return 'UPCOMING';
    }
  }

  private mapWeekStatusLabel(status: ProgramWeekStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Đang thực hiện';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'UPCOMING':
      default:
        return 'Sắp tới';
    }
  }

  private mapMealTypeLabel(mealType: string): string {
    switch (mealType) {
      case 'BREAKFAST':
        return 'Bữa sáng';
      case 'LUNCH':
        return 'Bữa trưa';
      case 'DINNER':
        return 'Bữa tối';
      case 'SNACK':
        return 'Bữa phụ';
      default:
        return 'Bữa ăn';
    }
  }

  private formatDateRange(startDateStr: string, endDateStr: string): string {
    if (!startDateStr && !endDateStr) return '';
    const formatPart = (dateStr: string) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    };
    return `${formatPart(startDateStr)} – ${formatPart(endDateStr)}`;
  }

  private formatDayDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  }

  private formatDateTime(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return dateTimeStr;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeStr;
    }
  }

  private calculateOverallCompliance(weeks: ProgramWeek[]): number {
    if (!weeks.length) return 0;
    const total = weeks.reduce((sum, w) => sum + w.complianceRate, 0);
    return Math.round(total / weeks.length);
  }

  private calculateEndDate(startDateStr: string, weeks: number): string {
    try {
      const d = new Date(startDateStr);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + weeks * 7 - 1);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  private groupSlotsIntoDays(rawSlots: unknown[], weekStartDate?: string): ProgramDaySummary[] {
    const dayMap = new Map<number, MealItemSummary[]>();

    for (const raw of rawSlots) {
      if (!raw || typeof raw !== 'object') continue;
      const slot = raw as Record<string, unknown>;
      const dayOfWeek = safeNumber(pickField(slot, ['dayOfWeek', 'day_of_week'], 1), 1);
      const recipe = (slot.recipe as Record<string, unknown> | null) ?? null;
      const customMeal = (slot.customMeal as Record<string, unknown> | null) ?? null;

      const name = safeString(recipe?.title ?? customMeal?.name ?? slot.name, 'Món ăn dinh dưỡng');
      const calories = safeNumber(slot.calories ?? recipe?.calories ?? customMeal?.calories, 0);
      const mealType = safeString(
        pickField(slot, ['mealType', 'meal_type'], 'BREAKFAST'),
        'BREAKFAST'
      ) as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
      const sourceType = recipe ? 'RECIPE' : customMeal ? 'CUSTOM_MEAL' : 'RECIPE';
      const imageUrl = (recipe?.coverImageUrl ?? customMeal?.photoUrl ?? slot.imageUrl) as
        string | undefined;

      const item: MealItemSummary = {
        id: safeString(slot.id, ''),
        name,
        mealType,
        mealTypeLabel: this.mapMealTypeLabel(mealType),
        sourceType,
        sourceTypeLabel: sourceType === 'RECIPE' ? 'Công thức' : 'Món cá nhân',
        servings: safeNumber(slot.servings, 1),
        calories,
        imageUrl: imageUrl ? safeString(imageUrl) : undefined,
      };

      if (!dayMap.has(dayOfWeek)) {
        dayMap.set(dayOfWeek, []);
      }
      dayMap.get(dayOfWeek)!.push(item);
    }

    const days: ProgramDaySummary[] = [];
    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      let date = '';
      if (weekStartDate) {
        try {
          const d = new Date(weekStartDate);
          d.setDate(d.getDate() + (dayOfWeek - 1));
          date = d.toISOString().split('T')[0];
        } catch {
          date = '';
        }
      }
      const meals = dayMap.get(dayOfWeek) ?? [];
      const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

      days.push({
        date,
        formattedDate: this.formatDayDate(date),
        dayOfWeek,
        meals,
        totalCalories,
      });
    }

    return days;
  }
}

export const mealProgramMapper = new MealProgramMapper();
