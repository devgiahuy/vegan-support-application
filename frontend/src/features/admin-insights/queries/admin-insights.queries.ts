'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminInsightsApi } from '@/features/admin-insights/api/admin-insights.api';
import {
  toAiUsageRequest,
  toRevenueRequest,
} from '@/features/admin-insights/mappers/admin-insights.mapper';
import type {
  AiUsageFilters,
  RevenueQuery,
} from '@/features/admin-insights/types/admin-insights.model';

export const ADMIN_INSIGHTS_KEYS = {
  all: ['admin-insights'] as const,
  revenue: (query: RevenueQuery) => [...ADMIN_INSIGHTS_KEYS.all, 'revenue', query] as const,
  usage: (filters: AiUsageFilters, page: number) =>
    [...ADMIN_INSIGHTS_KEYS.all, 'usage', filters, page] as const,
};

export function useAdminRevenueQuery(query: RevenueQuery) {
  return useQuery({
    queryKey: ADMIN_INSIGHTS_KEYS.revenue(query),
    queryFn: () => adminInsightsApi.revenue(toRevenueRequest(query)),
    staleTime: 60_000,
  });
}

export function useAdminAiUsageQuery(filters: AiUsageFilters, page: number) {
  return useQuery({
    queryKey: ADMIN_INSIGHTS_KEYS.usage(filters, page),
    queryFn: () => adminInsightsApi.usage(toAiUsageRequest(filters, page)),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
