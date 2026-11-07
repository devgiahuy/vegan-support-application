import api from '@/lib/axios';
import { ADMIN_INSIGHTS_ENDPOINTS } from '@/features/admin-insights/constants/admin-insights.endpoints';
import type {
  AdminAiUsageRequestDto,
  AdminAiUsageResponseDto,
  AdminRevenueRequestDto,
  AdminRevenueResponseDto,
} from '@/features/admin-insights/types/admin-insights.dto';
import {
  toAiUsagePage,
  toRevenueStats,
} from '@/features/admin-insights/mappers/admin-insights.mapper';

export const adminInsightsApi = {
  /** `GET /admin/billing/revenue` — doanh thu mua quota AI */
  async revenue(params: AdminRevenueRequestDto) {
    return toRevenueStats(
      (
        await api.get<AdminRevenueResponseDto>(ADMIN_INSIGHTS_ENDPOINTS.BILLING_REVENUE, {
          params,
        })
      ).data.data
    );
  },
  /** `GET /admin/ai/usage` — bảng truy vết sử dụng AI (không chứa nội dung prompt) */
  async usage(params: AdminAiUsageRequestDto) {
    const response = await api.get<AdminAiUsageResponseDto>(ADMIN_INSIGHTS_ENDPOINTS.AI_USAGE, {
      params,
    });
    return toAiUsagePage(response.data?.data, response.data?.meta);
  },
};
