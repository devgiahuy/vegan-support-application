import api from '@/lib/axios';
import { BILLING_ENDPOINTS } from '@/features/billing/constants/billing.endpoints';
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
      (await api.get<BillingCatalogResponseDto>(BILLING_ENDPOINTS.PRODUCTS, { silent: true })).data
        .data
    );
  },
  async entitlements() {
    return entitlementMapper.toModel(
      (await api.get<EntitlementResponseDto>(BILLING_ENDPOINTS.ENTITLEMENTS, { silent: true })).data
        .data
    );
  },
  async orders(params: BillingOrdersRequestDto) {
    return orderMapper.toOrders(
      (
        await api.get<BillingOrdersResponseDto>(BILLING_ENDPOINTS.ORDERS, {
          params,
          silent: true,
        })
      ).data.data
    );
  },
  async order(id: string) {
    return orderMapper.toModel(
      (await api.get<BillingOrderResponseDto>(BILLING_ENDPOINTS.ORDER(id), { silent: true })).data
        .data
    );
  },
  async create(input: CreateBillingOrderRequestDto) {
    return orderMapper.toModel(
      (
        await api.post<BillingOrderResponseDto>(BILLING_ENDPOINTS.ORDERS, input, {
          silent: true,
        })
      ).data.data
    );
  },
  async reconcile(id: string) {
    return orderMapper.toModel(
      (
        await api.post<BillingOrderResponseDto>(BILLING_ENDPOINTS.RECONCILE(id), undefined, {
          silent: true,
        })
      ).data.data
    );
  },
};
