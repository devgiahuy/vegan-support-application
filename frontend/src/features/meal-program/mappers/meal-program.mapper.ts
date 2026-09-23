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
        goal: '',
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

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      userId: safeString(pickField(dto, ['user_id', 'userId'], ''), ''),
      title: safeString(pickField(dto, ['title'], ''), ''),
      goal: safeString(pickField(dto, ['goal'], ''), ''),
      startDate: safeString(pickField(dto, ['start_date', 'startDate'], ''), ''),
      endDate: safeString(pickField(dto, ['end_date', 'endDate'], ''), ''),
      formattedDateRange: this.formatDateRange(
        safeString(pickField(dto, ['start_date', 'startDate'], ''), ''),
        safeString(pickField(dto, ['end_date', 'endDate'], ''), '')
      ),
      timezone: safeString(pickField(dto, ['timezone'], 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh'),
      horizonWeeks: safeNumber(pickField(dto, ['horizon_weeks', 'horizonWeeks'], 0), 0),
      status,
      statusLabel: this.mapStatusLabel(status),
      statusBadgeVariant: this.mapStatusBadgeVariant(status),
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      templateId: dto.template_id
        ? safeString(dto.template_id)
        : dto.template_id === null
          ? null
          : undefined,
      weeks,
      cumulativeAnalysis: this.mapCumulativeAnalysis(dto.cumulative_analysis),
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
        goal: '',
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
      pickField(dto, ['total_weeks', 'totalWeeks'], horizonWeeks),
      horizonWeeks
    );

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      userId: safeString(pickField(dto, ['user_id', 'userId'], ''), ''),
      title: safeString(pickField(dto, ['title'], ''), ''),
      goal: safeString(pickField(dto, ['goal'], ''), ''),
      startDate: safeString(pickField(dto, ['start_date', 'startDate'], ''), ''),
      endDate: safeString(pickField(dto, ['end_date', 'endDate'], ''), ''),
      formattedDateRange: this.formatDateRange(
        safeString(pickField(dto, ['start_date', 'startDate'], ''), ''),
        safeString(pickField(dto, ['end_date', 'endDate'], ''), '')
      ),
      timezone: safeString(pickField(dto, ['timezone'], 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh'),
      horizonWeeks,
      status,
      statusLabel: this.mapStatusLabel(status),
      statusBadgeVariant: this.mapStatusBadgeVariant(status),
      version: safeNumber(pickField(dto, ['version'], 1), 1),
      templateId: dto.template_id ? safeString(dto.template_id) : null,
      overallComplianceRate: safeNumber(
        pickField(dto, ['overall_compliance_rate', 'overallComplianceRate'], 0),
        0
      ),
      currentWeekNumber: safeNumber(
        pickField(dto, ['current_week_number', 'currentWeekNumber'], 1),
        1
      ),
      totalWeeks,
      coverImageUrl: dto.cover_image_url ? safeString(dto.cover_image_url) : null,
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

    return {
      items: safeArray<MealProgramListItemDto, MealProgramListItem>(response.items, (item) =>
        this.toListItem(item)
      ),
      pagination: {
        page: safeNumber(response.pagination?.page, 1),
        limit: safeNumber(response.pagination?.limit, 10),
        totalItems: safeNumber(response.pagination?.totalItems, 0),
        totalPages: safeNumber(response.pagination?.totalPages, 0),
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

    const status = this.mapWeekStatus(dto.status);

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      programId: safeString(pickField(dto, ['program_id', 'programId'], ''), ''),
      weekNumber: safeNumber(pickField(dto, ['week_number', 'weekNumber'], 1), 1),
      startDate: safeString(pickField(dto, ['start_date', 'startDate'], ''), ''),
      endDate: safeString(pickField(dto, ['end_date', 'endDate'], ''), ''),
      formattedDateRange: this.formatDateRange(
        safeString(pickField(dto, ['start_date', 'startDate'], ''), ''),
        safeString(pickField(dto, ['end_date', 'endDate'], ''), '')
      ),
      status,
      statusLabel: this.mapWeekStatusLabel(status),
      complianceRate: safeNumber(pickField(dto, ['compliance_rate', 'complianceRate'], 0), 0),
      isDownstreamInvalidated: safeBoolean(
        pickField(dto, ['is_downstream_invalidated', 'isDownstreamInvalidated'], false),
        false
      ),
      snapshot: this.mapSnapshot(dto.snapshot),
    };
  }

  public mapSnapshot(dto: WeeklyPlanSnapshotDto | null | undefined): WeeklyPlanSnapshot | null {
    if (!dto) return null;

    return {
      capturedAt: safeString(pickField(dto, ['captured_at', 'capturedAt'], ''), ''),
      totalCalories: safeNumber(pickField(dto, ['total_calories', 'totalCalories'], 0), 0),
      macronutrients: {
        protein: safeNumber(pickField(dto.macronutrients, ['protein_g', 'protein'], 0), 0),
        carbs: safeNumber(pickField(dto.macronutrients, ['carbs_g', 'carbs'], 0), 0),
        fat: safeNumber(pickField(dto.macronutrients, ['fat_g', 'fat'], 0), 0),
        fiber: safeNumber(pickField(dto.macronutrients, ['fiber_g', 'fiber'], 0), 0),
      },
      days: safeArray<WeeklyPlanDayDto, ProgramDaySummary>(dto.days, (dayDto) =>
        this.mapDay(dayDto)
      ),
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

    const mealType = dto.meal_type ?? 'BREAKFAST';
    const sourceType = dto.source_type ?? 'RECIPE';

    return {
      id: safeString(pickField(dto, ['id'], ''), ''),
      name: safeString(pickField(dto, ['name'], ''), ''),
      mealType,
      mealTypeLabel: this.mapMealTypeLabel(mealType),
      sourceType,
      sourceTypeLabel: sourceType === 'RECIPE' ? 'Công thức' : 'Món cá nhân',
      servings: safeNumber(pickField(dto, ['servings'], 1), 1),
      calories: safeNumber(pickField(dto, ['calories'], 0), 0),
      imageUrl: dto.image_url ? safeString(dto.image_url) : undefined,
    };
  }

  public mapCumulativeAnalysis(
    dto: CumulativeAnalysisDto | null | undefined
  ): CumulativeAnalysis | null {
    if (!dto) return null;

    return {
      averageDailyCalories: safeNumber(
        pickField(dto, ['average_daily_calories', 'averageDailyCalories'], 0),
        0
      ),
      averageMacronutrients: {
        protein: safeNumber(pickField(dto.average_macronutrients, ['protein_g', 'protein'], 0), 0),
        carbs: safeNumber(pickField(dto.average_macronutrients, ['carbs_g', 'carbs'], 0), 0),
        fat: safeNumber(pickField(dto.average_macronutrients, ['fat_g', 'fat'], 0), 0),
        fiber: safeNumber(pickField(dto.average_macronutrients, ['fiber_g', 'fiber'], 0), 0),
      },
      repeatedPatternWarnings: safeArray<RepeatedPatternWarningDto, RepeatedPatternWarning>(
        dto.repeated_pattern_warnings,
        (w) => this.mapWarning(w)
      ),
      isInvalidated: safeBoolean(pickField(dto, ['is_invalidated', 'isInvalidated'], false), false),
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

    return {
      mealId: safeString(pickField(dto, ['meal_id', 'mealId'], ''), ''),
      mealName: safeString(pickField(dto, ['meal_name', 'mealName'], ''), ''),
      sourceType: dto.source_type ?? 'RECIPE',
      occurrences: safeNumber(pickField(dto, ['occurrences'], 0), 0),
      dates: safeArray(dto.dates, (d) => safeString(d)),
      message: safeString(pickField(dto, ['message'], ''), ''),
    };
  }

  private mapStatus(dtoStatus?: MealProgramStatusDto): MealProgramStatus {
    switch (dtoStatus) {
      case 'CONFIRMED':
        return 'CONFIRMED';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'ARCHIVED':
        return 'ARCHIVED';
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
      case 'DRAFT':
      default:
        return 'Bản nháp';
    }
  }

  private mapStatusBadgeVariant(
    status: MealProgramStatus
  ): 'warning' | 'default' | 'success' | 'secondary' {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'COMPLETED':
        return 'success';
      case 'ARCHIVED':
        return 'secondary';
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
}

export const mealProgramMapper = new MealProgramMapper();
