import { authFetch, authRequest } from './client';
import type {
  CategoryRequest,
  CategoryResponse,
  TransactionType
} from './types';

export type { CategoryRequest, CategoryResponse, TransactionType };

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

/** CategoryController (/api/v1/categories) — BudgetView 등 */
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

/** GET /api/v1/categories — AssetView 등 */
export async function getCategories(): Promise<CategoryResponse[]> {
  const res = await authFetch('/api/v1/categories');
  const data: ApiResponse<CategoryResponse[]> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '카테고리 목록을 불러오는 데 실패했습니다.');
  }
  return data.data;
}

/** POST /api/v1/categories */
export async function createCategory(request: CategoryRequest): Promise<CategoryResponse> {
  const res = await authFetch('/api/v1/categories', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(request),
  });
  const data: ApiResponse<CategoryResponse> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '카테고리 생성에 실패했습니다.');
  }
  return data.data;
}

/** PATCH /api/v1/categories/{id} */
export async function updateCategory(id: number, request: CategoryRequest): Promise<void> {
  const res = await authFetch(`/api/v1/categories/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(request),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '카테고리 수정에 실패했습니다.');
  }
}

/** DELETE /api/v1/categories/{id} */
export async function deleteCategory(id: number): Promise<void> {
  const res = await authFetch(`/api/v1/categories/${id}`, {
    method: 'DELETE',
    headers: jsonHeaders,
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '카테고리 삭제에 실패했습니다.');
  }
}
