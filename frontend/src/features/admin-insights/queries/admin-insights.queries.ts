'use client';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { UserRole } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
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
  audit: (owner: string) => [...ADMIN_INSIGHTS_KEYS.all, 'audit', owner] as const,
  revenue: (query: RevenueQuery) => [...ADMIN_INSIGHTS_KEYS.all, 'revenue', query] as const,
  usage: (filters: AiUsageFilters, page: number) =>
    [...ADMIN_INSIGHTS_KEYS.all, 'usage', filters, page] as const,
};

export function useAdminAuditQuery() {
  const owner = useAuthStore((state) =>
    state.isAuthenticated && state.user?.role === UserRole.ADMIN ? state.user.id : ''
  );
  return useInfiniteQuery({
    queryKey: ADMIN_INSIGHTS_KEYS.audit(owner),
    enabled: Boolean(owner),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => adminInsightsApi.audit({ cursor: pageParam }, signal),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

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
