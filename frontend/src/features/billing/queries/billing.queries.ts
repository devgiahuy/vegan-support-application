'use client';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { billingApi } from '@/features/billing/api/billing.api';
import type { CreateBillingOrderRequestDto } from '@/features/billing/types/billing.dto';

export const BILLING_QUERY_KEYS = {
  all: ['billing'] as const,
  owner: (owner: string) => ['billing', owner] as const,
  catalog: (owner: string) => ['billing', owner, 'catalog'] as const,
  entitlements: (owner: string) => ['billing', owner, 'entitlements'] as const,
  orders: (owner: string, page: number) => ['billing', owner, 'orders', page] as const,
  order: (owner: string, id: string) => ['billing', owner, 'order', id] as const,
};
function useOwner() {
  return useAuthStore((s) => (s.isAuthenticated ? (s.user?.id ?? '') : ''));
}
export function useBillingCatalogQuery() {
  const owner = useOwner();
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.catalog(owner),
    queryFn: billingApi.catalog,
    enabled: Boolean(owner),
    staleTime: 30000,
  });
}
export function useEntitlementsQuery() {
  const owner = useOwner();
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.entitlements(owner),
    queryFn: billingApi.entitlements,
    enabled: Boolean(owner),
    staleTime: 10000,
  });
}
export function useBillingOrdersQuery(page = 1) {
  const owner = useOwner();
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.orders(owner, page),
    queryFn: () => billingApi.orders({ page }),
    enabled: Boolean(owner),
    refetchInterval: (query) =>
      query.state.data?.items.some((order) => order.pending) ? 5000 : false,
    refetchIntervalInBackground: false,
  });
}
export function useBillingOrderQuery(id: string) {
  const owner = useOwner();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: BILLING_QUERY_KEYS.order(owner, id),
    queryFn: () => billingApi.order(id),
    enabled: Boolean(owner && id),
    refetchInterval: (q) => (q.state.data?.pending ? 3000 : false),
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (query.data?.status === 'PAID')
      void client.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.entitlements(owner) });
  }, [query.data?.status, client, owner]);
  return query;
}
export function useCreateBillingOrderMutation() {
  const owner = useOwner();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBillingOrderRequestDto) => billingApi.create(input),
    onSuccess: (order) => {
      client.setQueryData(BILLING_QUERY_KEYS.order(owner, order.id), order);
      void client.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.owner(owner) });
    },
  });
}
export function useReconcileBillingOrderMutation() {
  const owner = useOwner();
  const client = useQueryClient();
  return useMutation({
    mutationFn: billingApi.reconcile,
    onSuccess: (order) => {
      client.setQueryData(BILLING_QUERY_KEYS.order(owner, order.id), order);
      void client.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.owner(owner) });
    },
  });
}
