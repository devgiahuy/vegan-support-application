import type { PlanUserSummary } from '@/features/meal-plan/types/meal-plan.model';

export function groupConstraintDetails(items: PlanUserSummary['hardViolations']) {
  const groups = new Map<string, { name: string; details: string[]; locations: string[] }>();
  const mealLabels: Record<string, string> = { BREAKFAST: 'Sáng', LUNCH: 'Trưa', DINNER: 'Tối' };
  for (const item of items) {
    const details = item.reasons.map((reason) => reason.detail);
    const key = JSON.stringify([item.name, details]);
    const group = groups.get(key) ?? { name: item.name, details, locations: [] };
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.date);
    const date = match ? `${match[3]}/${match[2]}` : item.date;
    const location = [mealLabels[item.mealType] ?? item.mealType, date].filter(Boolean).join(' ');
    if (location && !group.locations.includes(location)) group.locations.push(location);
    groups.set(key, group);
  }
  return [...groups.values()];
}
