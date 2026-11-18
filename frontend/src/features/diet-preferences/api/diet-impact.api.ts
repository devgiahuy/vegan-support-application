import api from '@/lib/axios';
import { DIET_IMPACT_ENDPOINTS } from '../constants/diet-impact.endpoints';
import { dietImpactMapper } from '../mappers/diet-impact.mapper';
import { dietMapper } from '../mappers/diet.mapper';
import type {
  DietaryImpactResponseDto,
  RepairPreviewResponseDto,
  RepairApplyResponseDto,
} from '../types/diet-impact.dto';
import type { DietPreferenceDraft } from '../types/diet.model';
import type {
  DietRepairPreviewInput,
  DietRepairApplyInput,
  DietProgramRevisionInput,
} from '../types/diet-impact.model';
import type { MealProgramResponseDto } from '@/features/meal-program/types/meal-program.dto';
import { mealProgramMapper } from '@/features/meal-program/mappers/meal-program.mapper';

export const dietImpactApi = {
  async preview(input: DietPreferenceDraft) {
    const { data } = await api.post<DietaryImpactResponseDto>(
      DIET_IMPACT_ENDPOINTS.PREVIEW,
      dietMapper.toSaveDto(input),
      { silent: true }
    );
    if (
      !data.data ||
      !Array.isArray(data.data.plans) ||
      typeof data.data.affectedMealCount !== 'number'
    ) {
      throw new Error('Chưa kiểm tra được ảnh hưởng lên thực đơn. Vui lòng thử lại trước khi lưu.');
    }
    return dietImpactMapper.impact(data.data);
  },
  async previewRepair(input: DietRepairPreviewInput) {
    const { data } = await api.post<RepairPreviewResponseDto>(
      DIET_IMPACT_ENDPOINTS.REPAIR_PREVIEW,
      {
        planIds: [...new Set(input.planIds)],
        expectedDietaryRevision: input.expectedDietaryRevision,
      },
      { silent: true }
    );
    if (!data.data?.proposalId || !Array.isArray(data.data.plans))
      throw new Error('Không đọc được phương án thay món. Vui lòng thử lại.');
    return dietImpactMapper.proposal(data);
  },
  async applyRepair(input: DietRepairApplyInput) {
    const { data } = await api.post<RepairApplyResponseDto>(
      DIET_IMPACT_ENDPOINTS.REPAIR_APPLY,
      {
        proposalId: input.proposalId,
        idempotencyKey: input.idempotencyKey,
      },
      { silent: true }
    );
    if (!data.data || !Array.isArray(data.data.results))
      throw new Error('Chưa đọc được kết quả điều chỉnh. Hãy tải lại thực đơn trước khi thử lại.');
    return dietImpactMapper.result(data);
  },
  async revise(id: string, input: Omit<DietProgramRevisionInput, 'id'>) {
    const { data } = await api.post<MealProgramResponseDto>(
      DIET_IMPACT_ENDPOINTS.PROGRAM_REVISION(id),
      input,
      { silent: true }
    );
    if (!data.data?.id)
      throw new Error(
        'Chưa đọc được bản điều chỉnh. Hãy kiểm tra danh sách lộ trình trước khi thử lại.'
      );
    return mealProgramMapper.toModel(data.data);
  },
};
