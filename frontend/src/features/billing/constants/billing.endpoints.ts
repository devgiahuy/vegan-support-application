export const BILLING_ENDPOINTS = {
  PRODUCTS: '/billing/products',
  ADMIN_PRODUCTS: '/admin/billing/products',
  ADMIN_PRODUCT: (id: string) => '/admin/billing/products/' + encodeURIComponent(id),
  ADMIN_PRODUCT_AVAILABILITY: (id: string) =>
    '/admin/billing/products/' + encodeURIComponent(id) + '/availability',
  ORDERS: '/billing/orders',
  ORDER: (id: string) => '/billing/orders/' + id,
  RECONCILE: (id: string) => '/billing/orders/' + id + '/reconcile',
  ENTITLEMENTS: '/entitlements/me',
} as const;
