export const UPLOADS_ENDPOINTS = {
  RESERVATIONS: '/uploads/reservations',
  COMMIT: (id: string) => `/uploads/reservations/${id}/commit`,
  RELEASE: (id: string) => `/uploads/reservations/${id}`,
} as const;
