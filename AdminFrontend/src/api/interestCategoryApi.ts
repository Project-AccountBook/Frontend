import { authRequest } from './client';
import type { InterestCategoryResponse } from './types';

/** InterestCategoryController (/api/v1/interest-categories) */
export const interestCategoryApi = {
  register: (categoryId: number) =>
    authRequest<InterestCategoryResponse>(`/api/v1/interest-categories/${categoryId}`, {
      method: 'POST',
    }),

  getMyCategories: () =>
    authRequest<InterestCategoryResponse[]>('/api/v1/interest-categories'),

  updateAlarm: (id: number, isAlarmEnabled: boolean) =>
    authRequest<void>(`/api/v1/interest-categories/${id}/alarm?isAlarmEnabled=${isAlarmEnabled}`, {
      method: 'PATCH',
    }),

  delete: (id: number) =>
    authRequest<void>(`/api/v1/interest-categories/${id}`, {
      method: 'DELETE',
    }),
};
