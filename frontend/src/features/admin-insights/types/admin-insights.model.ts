export type RevenueGranularity = 'day' | 'week' | 'month';
export type RevenueRangePreset = '7d' | '30d' | '12m';
export type AiUsageFeature = 'CHAT' | 'FRIDGE' | 'RECEIPT';
export type AiUsageOutcome = 'HELD' | 'SPENT' | 'RELEASED';
export type AiUsageQuotaSource = 'FREE_DAILY' | 'SUBSCRIPTION' | 'CREDITS' | 'NONE' | 'UNKNOWN';

export interface RevenueQuery {
  preset: RevenueRangePreset;
  granularity: RevenueGranularity;
}
export interface RevenueBucket {
  key: string;
  label: string;
  revenueVnd: number;
  revenueLabel: string;
  paidOrders: number;
}
export interface RevenueStatusCount {
  status: string;
  label: string;
  count: number;
  shareLabel: string;
}
export interface AdminRevenueStats {
  windowLabel: string;
  revenueLabel: string;
  paidOrders: number;
  buyers: number;
  averageOrderLabel: string;
  series: RevenueBucket[];
  maxBucketRevenue: number;
  totalOrders: number;
  successRateLabel: string;
  statuses: RevenueStatusCount[];
}

export interface AiUsageFilters {
  feature: AiUsageFeature | 'ALL';
  outcome: AiUsageOutcome | 'ALL';
  user: string;
  from: string;
  to: string;
}
export interface AiUsageRow {
  id: string;
  feature: AiUsageFeature | 'UNKNOWN';
  featureLabel: string;
  occurredAtLabel: string;
  userName: string;
  userEmail: string;
  quotaSource: AiUsageQuotaSource;
  quotaSourceLabel: string;
  quotaCharged: number;
  outcome: AiUsageOutcome | 'UNKNOWN';
  outcomeLabel: string;
  aiStatusLabel: string;
  providerLabel: string;
  tokensLabel: string;
  latencyLabel: string;
  errorCode: string | null;
}
export interface AiUsagePage {
  items: AiUsageRow[];
  page: number;
  totalPages: number;
  total: number;
}
