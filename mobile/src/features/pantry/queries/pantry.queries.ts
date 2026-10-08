import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { pantryApi } from '../api/pantry.api';
import type {
  PantryItemFormValues,
  PantryListFilters,
  PantryObservationValues,
  PantryAdjustmentValues,
  PantryMergeValues,
} from '../types/pantry.model';

export const PANTRY_QUERY_KEYS = {
  all: ['pantry'] as const,
  list: (params?: PantryListFilters, expiring = false) =>
    [...PANTRY_QUERY_KEYS.all, 'list', expiring, params] as const,
  detail: (id: string) => [...PANTRY_QUERY_KEYS.all, 'detail', id] as const,
};

function invalidateInventory(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all }),
    client.invalidateQueries({ queryKey: ['shopping-preview'] }),
  ]);
}

export function usePantryItemsQuery(params?: PantryListFilters, enabled = true, expiring = false) {
  return useQuery({
    queryKey: PANTRY_QUERY_KEYS.list(params, expiring),
    queryFn: () => pantryApi.getItems(params, expiring),
    enabled,
  });
}

export function usePantryAdjustmentsQuery(id: string, page: number) {
  return useQuery({
    queryKey: [...PANTRY_QUERY_KEYS.all, 'history', id, page],
    queryFn: () => pantryApi.getAdjustments(id, page),
    enabled: Boolean(id),
  });
}

export function useUpdatePantryItemMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PantryObservationValues }) =>
      pantryApi.updateItem(id, values),
    onSuccess: () => invalidateInventory(client),
    onError: () => invalidateInventory(client),
  });
}

export function useAdjustPantryItemMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PantryAdjustmentValues }) =>
      pantryApi.adjustItem(id, values),
    onSuccess: () => invalidateInventory(client),
    onError: () => invalidateInventory(client),
  });
}

export function usePantryMergePreviewMutation() {
  return useMutation({
    mutationFn: (ids: string[]) => pantryApi.previewMerge(ids),
  });
}

export function useMergePantryItemsMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: PantryMergeValues) => pantryApi.mergeItems(values),
    onSuccess: () => invalidateInventory(client),
    onError: () => invalidateInventory(client),
  });
}

export function usePantryItemQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: PANTRY_QUERY_KEYS.detail(id),
    queryFn: () => pantryApi.getItemById(id),
    enabled: enabled && id.length > 0,
  });
}

export function useCreatePantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PantryItemFormValues) => pantryApi.createItem(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['shopping-preview'] });
    },
  });
}

export function useDeletePantryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; expectedVersion: number }) =>
      pantryApi.deleteItem(vars.id, vars.expectedVersion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PANTRY_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['shopping-preview'] });
    },
  });
}
