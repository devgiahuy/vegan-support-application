'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminBillingApi } from '@/features/billing/api/admin-billing.api';
import type { AdminBillingForm } from '@/features/billing/types/admin-billing.model';
import { useAuthStore } from '@/store/useAuthStore';

export const ADMIN_BILLING_KEYS = {
  owner: (id: string) => ['admin-billing', id] as const,
  list: (id: string) => ['admin-billing', id, 'list'] as const,
  detail: (id: string, productId: string) => ['admin-billing', id, 'detail', productId] as const,
};
function useAdminId() {
  return useAuthStore((s) => (s.isAuthenticated && s.user?.role === 'ADMIN' ? s.user.id : ''));
}
export function useAdminBillingList() {
  const id = useAdminId();
  return useQuery({
    queryKey: ADMIN_BILLING_KEYS.list(id),
    queryFn: adminBillingApi.list,
    enabled: Boolean(id),
  });
}
export function useAdminBillingDetail(productId: string) {
  const id = useAdminId();
  return useQuery({
    queryKey: ADMIN_BILLING_KEYS.detail(id, productId),
    queryFn: () => adminBillingApi.detail(productId),
    enabled: Boolean(id && productId),
  });
}
export function useAdminBillingSave() {
  const id = useAdminId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId?: string; version?: number; form: AdminBillingForm }) =>
      input.productId && input.version !== undefined
        ? adminBillingApi.update(input.productId, input.form, input.version)
        : adminBillingApi.create(input.form),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ADMIN_BILLING_KEYS.owner(id) });
    },
  });
}
export function useAdminBillingAvailability() {
  const id = useAdminId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; active: boolean; version: number; reason: string }) =>
      adminBillingApi.setAvailability(input.productId, input.active, input.version, input.reason),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ADMIN_BILLING_KEYS.owner(id) });
    },
  });
}
