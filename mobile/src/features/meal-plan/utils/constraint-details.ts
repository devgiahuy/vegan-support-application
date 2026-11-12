import type { PlanUserSummary } from '../types/meal-plan.model';

export interface ConstraintGroup {
  name: string;
  details: string[];
  /** Ví dụ `Trưa 16/11` — các bữa có cùng món và cùng lý do được gộp thành một dòng. */
  locations: string[];
}

const MEAL_LABELS: Record<string, string> = { BREAKFAST: 'Sáng', LUNCH: 'Trưa', DINNER: 'Tối' };

/** Gộp các bữa vi phạm cùng món + cùng lý do — đồng bộ `groupConstraintDetails` của web. */
export function groupConstraintDetails(items: PlanUserSummary['hardViolations']): ConstraintGroup[] {
  const groups = new Map<string, ConstraintGroup>();
  for (const item of items) {
    const details = item.reasons.map((reason) => reason.detail);
    const key = JSON.stringify([item.name, details]);
    const group = groups.get(key) ?? { name: item.name, details, locations: [] };
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.date);
    const date = match ? `${match[3]}/${match[2]}` : item.date;
    const location = [MEAL_LABELS[item.mealType] ?? item.mealType, date].filter(Boolean).join(' ');
    if (location && !group.locations.includes(location)) group.locations.push(location);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Tách phần chi tiết của tóm tắt thành từng dòng (BE ngăn cách bằng `;` hoặc xuống dòng) — đồng bộ `detailLines` của web. */
export function detailLinesOf(detail: string): string[] {
  return detail
    .split(/;|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
