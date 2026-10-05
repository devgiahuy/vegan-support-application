import { FoodRuleSeverity, InteractionScope, MealType } from '@prisma/client';

interface WarningLocationItem {
  date: string;
  mealType: MealType;
  name: string;
}
export type MacroWarningDirection = 'ABOVE' | 'BELOW';
export type MacroWarningCode = 'PROTEIN' | 'FIBER' | 'FAT' | 'CARBS';

const WEEKDAY_LABELS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const;
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Bữa sáng',
  [MealType.LUNCH]: 'Bữa trưa',
  [MealType.DINNER]: 'Bữa tối',
};
const MACRO_LABELS: Record<MacroWarningCode, string> = {
  PROTEIN: 'Chất đạm',
  FIBER: 'Chất xơ',
  FAT: 'Chất béo',
  CARBS: 'Tinh bột',
};

function vietnameseDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  return `${WEEKDAY_LABELS[parsed.getUTCDay()]} (${day}/${month})`;
}

export function mealLocation(items: WarningLocationItem[], scope: InteractionScope): string {
  const first = items[0];
  if (!first) return 'trong thực đơn tuần này';
  const date = vietnameseDate(first.date);
  if (scope === InteractionScope.SAME_DISH)
    return `Món ${first.name} trong ${MEAL_TYPE_LABELS[first.mealType].toLowerCase()} ${date}`;
  if (scope === InteractionScope.SAME_MEAL) return `${MEAL_TYPE_LABELS[first.mealType]} ${date}`;
  return `Cả ngày ${date}`;
}

export function severityLabel(severity: FoodRuleSeverity): 'Thông tin' | 'Nên lưu ý' {
  return severity === FoodRuleSeverity.INFO ? 'Thông tin' : 'Nên lưu ý';
}

export function scopeLabel(scope: InteractionScope): string {
  return {
    [InteractionScope.SAME_DISH]: 'Trong cùng món',
    [InteractionScope.SAME_MEAL]: 'Trong cùng bữa',
    [InteractionScope.SAME_DAY]: 'Trong cùng ngày',
  }[scope];
}

export function macroWarningCopy(
  code: MacroWarningCode,
  direction: MacroWarningDirection,
  date: string,
): { title: string; detail: string; suggestion: string } {
  const label = MACRO_LABELS[code];
  const location = `Cả ngày ${vietnameseDate(date)}`;
  const comparison = direction === 'ABOVE' ? 'cao hơn' : 'thấp hơn';
  const title = `${label} ước tính ${direction === 'ABOVE' ? 'đang cao hơn mục tiêu' : 'còn thấp'}`;
  const suggestions: Record<MacroWarningCode, Record<MacroWarningDirection, string>> = {
    PROTEIN: {
      ABOVE: 'Bạn có thể giảm khẩu phần món giàu đạm hoặc cân đối lại các bữa còn lại trong ngày.',
      BELOW: 'Bạn có thể thêm đậu hũ, các loại đậu, hạt hoặc một món chay giàu đạm.',
    },
    FIBER: {
      ABOVE: 'Bạn có thể điều chỉnh khẩu phần và tăng lượng chất xơ từ từ nếu cơ thể chưa quen.',
      BELOW: 'Bạn có thể thêm rau xanh, các loại đậu hoặc ngũ cốc nguyên hạt.',
    },
    FAT: {
      ABOVE: 'Bạn có thể giảm khẩu phần hoặc đổi sang món ít dầu hơn.',
      BELOW: 'Bạn có thể thêm một lượng vừa phải các loại hạt, bơ quả hoặc dầu thực vật.',
    },
    CARBS: {
      ABOVE: 'Bạn có thể giảm khẩu phần cơm, bún, mì hoặc đổi sang món có ít tinh bột hơn.',
      BELOW: 'Bạn có thể thêm một khẩu phần vừa phải từ cơm, khoai hoặc ngũ cốc nguyên hạt.',
    },
  };
  return {
    title,
    detail: `${location} có lượng ${label.toLowerCase()} ước tính ${comparison} khoảng mục tiêu của bạn. Đây là số liệu tham khảo và có thể thay đổi theo nguyên liệu, cách nấu và khẩu phần thực tế.`,
    suggestion: suggestions[code][direction],
  };
}

export function incompleteNutritionMessage(name: string): string {
  return `${name}: chưa có đủ dữ liệu để ước tính đầy đủ chất đạm, chất xơ, chất béo và tinh bột. Các chỉ số của món này chỉ mang tính tham khảo; bạn có thể bổ sung thông tin hoặc chọn món khác có dữ liệu đầy đủ hơn.`;
}

export function incompleteIngredientMessage(mealName: string, ingredientName: string): string {
  return `${mealName}: nguyên liệu “${ingredientName}” chưa có đủ thông tin để tính vào kết quả. Số liệu dinh dưỡng của món có thể thấp hơn thực tế; bạn có thể kiểm tra lại nguyên liệu hoặc đơn vị đã nhập.`;
}
