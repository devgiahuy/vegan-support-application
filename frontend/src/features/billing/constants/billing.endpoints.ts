export const BILLING_ENDPOINTS = {
  PRODUCTS: '/billing/products',
  ORDERS: '/billing/orders',
  ORDER: (id: string) => '/billing/orders/' + id,
  RECONCILE: (id: string) => '/billing/orders/' + id + '/reconcile',
  ENTITLEMENTS: '/entitlements/me',
} as const;
