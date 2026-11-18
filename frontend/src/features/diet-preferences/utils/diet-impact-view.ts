import type {
  DietaryCompatibility,
  DietaryImpact,
  DietRepairProposal,
  DietRepairResult,
} from '../types/diet-impact.model';

export function impactMealViews(impact: DietaryImpact) {
  const seen = new Set<string>();
  return impact.plans.flatMap((plan) =>
    plan.items.flatMap((item) => {
      const id = `${plan.planId}:${item.itemId}`;
      if (seen.has(id)) return [];
      seen.add(id);
      return [
        {
          id,
          name: item.name,
          location: `${item.dateLabel} · ${item.mealTypeLabel} · tuần ${plan.weekLabel}`,
          reasons: item.reasonLabels,
          unverified: item.unverified,
        },
      ];
    })
  );
}

export function compatibilityCounts(compatibility: DietaryCompatibility | null | undefined) {
  if (!compatibility || compatibility.status !== 'NEEDS_REVIEW') {
    return { affectedCount: 0, unverifiedCount: 0 };
  }
  const unique = new Map(compatibility.items.map((item) => [item.itemId, item]));
  const unverifiedCount = [...unique.values()].filter((item) => item.unverified).length;
  return {
    affectedCount: Math.max(0, compatibility.affectedMealCount - unverifiedCount),
    unverifiedCount,
  };
}

export function repairPlanViews(proposal: DietRepairProposal | null) {
  return (proposal?.plans ?? []).map((plan) => ({
    id: plan.planId,
    title: `Thực đơn tuần ${plan.weekLabel}`,
    ready: plan.status === 'READY',
    message: plan.message,
    programs:
      plan.status === 'PROGRAM_REVISION_REQUIRED'
        ? plan.programs.filter((program) => program.status === 'CONFIRMED')
        : [],
    replacements: plan.replacements.map((item) => ({
      id: item.itemId,
      location: item.location,
      beforeName: item.beforeName,
      afterName: item.afterName,
    })),
    beforeNutrition: plan.beforeNutrition.summary,
    afterNutrition: plan.afterNutrition.summary,
    shoppingChange: plan.shoppingSummary,
    shoppingBeforeLines: plan.shoppingBefore.map(
      (item) =>
        `${item.amount.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${item.unit} ${item.name}`
    ),
    shoppingAfterLines: plan.shoppingAfter.map(
      (item) =>
        `${item.amount.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${item.unit} ${item.name}`
    ),
  }));
}

export function repairOutcome(result: DietRepairResult): { success: boolean; message: string } {
  const updated = result.results.filter((item) => item.status === 'UPDATED').length;
  const failed = result.results.filter(
    (item) =>
      item.status === 'FAILED' ||
      item.status === 'PROGRAM_REVISION_REQUIRED' ||
      item.status === 'UNKNOWN'
  ).length;
  const remaining = result.results.reduce((sum, item) => sum + item.remainingAffectedMeals, 0);
  if (failed > 0 || remaining > 0) {
    return {
      success: false,
      message: `Đã điều chỉnh ${updated} thực đơn. ${remaining > 0 ? `Còn ${remaining} bữa cần xử lý. ` : ''}${failed > 0 ? `${failed} thực đơn chưa điều chỉnh được. ` : ''}Thiết lập ăn uống đã được lưu.`,
    };
  }
  return {
    success: true,
    message:
      updated > 0
        ? `Đã điều chỉnh ${updated} thực đơn theo thiết lập hiện tại.`
        : 'Thực đơn không còn bữa nào cần thay.',
  };
}
