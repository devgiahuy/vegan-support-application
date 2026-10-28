export type RevenueGranularityDto = 'day' | 'week' | 'month';
export type AiUsageFeatureDto = 'CHAT' | 'FRIDGE' | 'RECEIPT';
export type AiUsageOutcomeDto = 'HELD' | 'SPENT' | 'RELEASED';

export interface AdminRevenueRequestDto {
  from?: string;
  to?: string;
  granularity: RevenueGranularityDto;
}
export interface AdminRevenueDto {
  window?: { from?: string; to?: string; granularity?: string; timezone?: string };
  currency?: string;
  overview?: {
    revenueVnd?: number | string;
    paidOrders?: number | string;
    buyers?: number | string;
    averageOrderVnd?: number | string | null;
  };
  series?: { bucketStart?: string; revenueVnd?: number | string; paidOrders?: number | string }[];
  statuses?: {
    total?: number | string;
    counts?: { status?: string; count?: number | string }[];
    successRate?: number | string | null;
  };
}
export interface AdminRevenueResponseDto {
  success: boolean;
  data: AdminRevenueDto;
}

export interface AdminAiUsageRequestDto {
  page: number;
  limit: number;
  feature?: AiUsageFeatureDto;
  outcome?: AiUsageOutcomeDto;
  user?: string;
  from?: string;
  to?: string;
}
export interface AdminAiUsageItemDto {
  id?: string;
  feature?: string;
  occurredAt?: string;
  user?: { id?: string; displayName?: string; email?: string } | null;
  quotaSource?: string;
  quotaCharged?: number | string;
  outcome?: string;
  aiStatus?: string | null;
  provider?: string | null;
  modelId?: string | null;
  inputTokens?: number | string | null;
  outputTokens?: number | string | null;
  latencyMs?: number | string | null;
  errorCode?: string | null;
}
export interface AdminAiUsageResponseDto {
  success: boolean;
  data: AdminAiUsageItemDto[];
  meta?: {
    page?: number | string;
    limit?: number | string;
    total?: number | string;
    totalPages?: number | string;
  };
}
