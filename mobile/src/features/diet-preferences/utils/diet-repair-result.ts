import type { DietaryRepairResult } from '@/features/diet-preferences/types/diet-impact.model';

/** Một batch có thể thành công ở vài tuần và thất bại ở tuần khác. */
export function summarizeDietRepair(result: DietaryRepairResult) {
  const updatedPlans = result.results.filter((plan) => plan.status === 'UPDATED').length;
  const remainingMeals = result.results.reduce((sum, plan) => sum + Math.max(0, plan.remainingAffectedMeals), 0);
  const unresolvedPlans = result.results.filter(
    (plan) => plan.status === 'FAILED' || plan.status === 'PROGRAM_REVISION_REQUIRED' || plan.remainingAffectedMeals > 0,
  ).length;
  const complete = result.results.length > 0 && unresolvedPlans === 0;

  return {
    complete,
    updatedPlans,
    remainingMeals,
    unresolvedPlans,
    title: complete ? 'Đã kiểm tra và cập nhật thực đơn' : 'Thực đơn vẫn cần được xem lại',
    detail: result.results.length === 0
      ? 'Không có thay đổi nào được áp dụng. Thiết lập ăn uống đã lưu vẫn được giữ nguyên.'
      : complete
        ? `Đã thay món trong ${updatedPlans} thực đơn. Những món còn lại được giữ nguyên.`
        : `Đã cập nhật ${updatedPlans} thực đơn; còn ${unresolvedPlans} thực đơn cần xử lý${remainingMeals > 0 ? ` với ${remainingMeals} bữa bị ảnh hưởng` : ''}.`,
  };
}
