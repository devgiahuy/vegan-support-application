import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type {
  BillingCatalogResponseDto,
  BillingOrderResponseDto,
  BillingOrdersResponseDto,
  BillingOrdersRequestDto,
  CreateBillingOrderRequestDto,
  EntitlementResponseDto,
} from '@/features/billing/types/billing.dto';
import {
  catalogMapper,
  entitlementMapper,
  orderMapper,
} from '@/features/billing/mappers/billing.mapper';

export const billingApi = {
  async catalog() {
    return catalogMapper.toModel(
      (await api.get<BillingCatalogResponseDto>(API_ENDPOINTS.BILLING.PRODUCTS, { silent: true }))
        .data.data
    );
  },
  async entitlements() {
    return entitlementMapper.toModel(
      (await api.get<EntitlementResponseDto>(API_ENDPOINTS.BILLING.ENTITLEMENTS, { silent: true }))
        .data.data
    );
  },
  async orders(params: BillingOrdersRequestDto) {
    return orderMapper.toOrders(
      (
        await api.get<BillingOrdersResponseDto>(API_ENDPOINTS.BILLING.ORDERS, {
          params,
          silent: true,
        })
      ).data.data
    );
  },
  async order(id: string) {
    return orderMapper.toModel(
      (await api.get<BillingOrderResponseDto>(API_ENDPOINTS.BILLING.ORDER(id), { silent: true }))
        .data.data
    );
  },
  async create(input: CreateBillingOrderRequestDto) {
    return orderMapper.toModel(
      (
        await api.post<BillingOrderResponseDto>(API_ENDPOINTS.BILLING.ORDERS, input, {
          silent: true,
        })
      ).data.data
    );
  },
  async reconcile(id: string) {
    return orderMapper.toModel(
      (
        await api.post<BillingOrderResponseDto>(API_ENDPOINTS.BILLING.RECONCILE(id), undefined, {
          silent: true,
        })
      ).data.data
    );
  },
};
