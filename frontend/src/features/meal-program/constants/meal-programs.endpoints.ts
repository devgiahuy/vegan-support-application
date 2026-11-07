export const MEAL_PROGRAMS_ENDPOINTS = {
  LIST: '/meal-programs',
  CREATE: '/meal-programs',
  DETAIL: (id: string) => `/meal-programs/${id}`,
  UPDATE: (id: string) => `/meal-programs/${id}`,
  REGENERATE_WEEK: (id: string, weekNumber: number) =>
    `/meal-programs/${id}/weeks/${weekNumber}/regenerate`,
  REANALYZE: (id: string) => `/meal-programs/${id}/reanalyze`,
  UPDATE_PROGRESS: (id: string, weekNumber: number) =>
    `/meal-programs/${id}/weeks/${weekNumber}/progress`,
} as const;
