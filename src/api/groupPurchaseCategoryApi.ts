import { authRequest } from './client';
import type { GroupPurchaseCategoryResponse } from './types';

/** GroupPurchaseCategoryController (/api/v1/group-purchase-categories) */
export const groupPurchaseCategoryApi = {
  getAll: () =>
    authRequest<GroupPurchaseCategoryResponse[]>('/api/v1/group-purchase-categories'),
};
