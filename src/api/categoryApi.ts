import { authRequest } from './client';
import type { CategoryRequest, CategoryResponse } from './types';

/** CategoryController (/api/v1/categories) */
export const categoryApi = {
  getAll: () => authRequest<CategoryResponse[]>('/api/v1/categories'),

  create: (request: CategoryRequest) =>
    authRequest<CategoryResponse>('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  update: (id: number, request: CategoryRequest) =>
    authRequest<void>(`/api/v1/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    }),

  delete: (id: number) =>
    authRequest<void>(`/api/v1/categories/${id}`, {
      method: 'DELETE',
    }),
};
