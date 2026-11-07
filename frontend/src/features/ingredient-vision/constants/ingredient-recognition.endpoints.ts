export const INGREDIENT_RECOGNITION_ENDPOINTS = {
  JOBS: '/ingredient-recognition/jobs',
  JOB_DETAIL: (id: string) => `/ingredient-recognition/jobs/${id}`,
  UPDATE_CANDIDATE: (id: string, candidateId: string) =>
    `/ingredient-recognition/jobs/${id}/candidates/${candidateId}`,
  CONFIRM: (id: string) => `/ingredient-recognition/jobs/${id}/confirm`,
  CANCEL: (id: string) => `/ingredient-recognition/jobs/${id}/cancel`,
  RETRY: (id: string) => `/ingredient-recognition/jobs/${id}/retry`,
  ADD_IMAGES: (id: string) => `/ingredient-recognition/jobs/${id}/images`,
} as const;
