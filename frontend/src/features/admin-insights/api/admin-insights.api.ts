import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
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
        await api.get<AdminRevenueResponseDto>(API_ENDPOINTS.ADMIN_INSIGHTS.BILLING_REVENUE, {
          params,
        })
      ).data.data
    );
  },
  /** `GET /admin/ai/usage` — bảng truy vết sử dụng AI (không chứa nội dung prompt) */
  async usage(params: AdminAiUsageRequestDto) {
    return toAiUsagePage(
      (await api.get<AdminAiUsageResponseDto>(API_ENDPOINTS.ADMIN_INSIGHTS.AI_USAGE, { params }))
        .data
    );
  },
};
