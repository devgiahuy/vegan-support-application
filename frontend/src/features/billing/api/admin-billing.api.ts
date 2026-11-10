import api from '@/lib/axios';
import { BILLING_ENDPOINTS } from '@/features/billing/constants/billing.endpoints';
import { adminBillingMapper } from '@/features/billing/mappers/admin-billing.mapper';
import type { AdminBillingProductDto } from '@/features/billing/types/admin-billing.dto';
import type { AdminBillingForm } from '@/features/billing/types/admin-billing.model';
import type { APIResponse } from '@/types/api';

export const adminBillingApi = {
  async list() {
    const response = await api.get<APIResponse<AdminBillingProductDto[]>>(
      BILLING_ENDPOINTS.ADMIN_PRODUCTS,
      { silent: true }
    );
    return (response.data.data ?? []).map(adminBillingMapper.toModel);
  },
  async detail(id: string) {
    const response = await api.get<APIResponse<AdminBillingProductDto>>(
      BILLING_ENDPOINTS.ADMIN_PRODUCT(id),
      { silent: true }
    );
    if (!response.data.data) throw new Error('Không nhận được thông tin gói.');
    return adminBillingMapper.toModel(response.data.data);
  },
  async create(form: AdminBillingForm) {
    const response = await api.post<APIResponse<AdminBillingProductDto>>(
      BILLING_ENDPOINTS.ADMIN_PRODUCTS,
      adminBillingMapper.toCreateDto(form),
      { silent: true }
    );
    if (!response.data.data) throw new Error('Không nhận được thông tin gói.');
    return adminBillingMapper.toModel(response.data.data);
  },
  async update(id: string, form: AdminBillingForm, version: number) {
    const response = await api.patch<APIResponse<AdminBillingProductDto>>(
      BILLING_ENDPOINTS.ADMIN_PRODUCT(id),
      adminBillingMapper.toUpdateDto(form, version),
      { silent: true }
    );
    if (!response.data.data) throw new Error('Không nhận được thông tin gói.');
    return adminBillingMapper.toModel(response.data.data);
  },
  async setAvailability(id: string, active: boolean, version: number, reason: string) {
    const response = await api.post<APIResponse<AdminBillingProductDto>>(
      BILLING_ENDPOINTS.ADMIN_PRODUCT_AVAILABILITY(id),
      adminBillingMapper.toAvailabilityDto(active, version, reason),
      { silent: true }
    );
    if (!response.data.data) throw new Error('Không nhận được thông tin gói.');
    return adminBillingMapper.toModel(response.data.data);
  },
};
