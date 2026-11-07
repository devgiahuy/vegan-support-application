export const RECEIPT_JOBS_ENDPOINTS = {
  JOBS: '/receipt-jobs',
  JOB_DETAIL: (id: string) => `/receipt-jobs/${id}`,
  UPDATE_CANDIDATE: (id: string, candidateId: string) =>
    `/receipt-jobs/${id}/candidates/${candidateId}`,
  CONFIRM: (id: string) => `/receipt-jobs/${id}/confirm`,
  CANCEL: (id: string) => `/receipt-jobs/${id}/cancel`,
  RETRY: (id: string) => `/receipt-jobs/${id}/retry`,
  ADD_IMAGES: (id: string) => `/receipt-jobs/${id}/images`,
} as const;
