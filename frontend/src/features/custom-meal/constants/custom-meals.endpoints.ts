export const CUSTOM_MEALS_ENDPOINTS = {
  LIST: '/custom-meals',
  CREATE: '/custom-meals',
  DETAIL: (id: string) => `/custom-meals/${id}`,
  UPDATE: (id: string) => `/custom-meals/${id}`,
  DELETE: (id: string) => `/custom-meals/${id}`,
  ATTACH_PHOTO: (id: string) => `/custom-meals/${id}/photos`,
  REMOVE_PHOTO: (id: string, assetId: string) => `/custom-meals/${id}/photos/${assetId}`,
  REORDER_PHOTOS: (id: string) => `/custom-meals/${id}/photos/order`,
  // Backward compatibility
  ATTACH_MEDIA: (id: string) => `/custom-meals/${id}/photos`,
  DELETE_MEDIA: (id: string, photoId: string) => `/custom-meals/${id}/photos/${photoId}`,
} as const;
