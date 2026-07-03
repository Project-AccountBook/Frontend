export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface CategoryResponse {
  id: number;
  name: string;
  type: TransactionType;
  isCustom: boolean;
}

export interface CategoryRequest {
  name: string;
  type: TransactionType;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
});

/** GET /api/v1/categories */
export async function getCategories(): Promise<CategoryResponse[]> {
  const res = await fetch('/api/v1/categories', { headers: authHeader() });
  const data: ApiResponse<CategoryResponse[]> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '카테고리 목록을 불러오는 데 실패했습니다.');
  }
  return data.data;
}

/** POST /api/v1/categories */
export async function createCategory(request: CategoryRequest): Promise<CategoryResponse> {
  const res = await fetch('/api/v1/categories', {
    method: 'POST',
    headers: authHeader(),
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
  const res = await fetch(`/api/v1/categories/${id}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(request),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '카테고리 수정에 실패했습니다.');
  }
}

/** DELETE /api/v1/categories/{id} */
export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`/api/v1/categories/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '카테고리 삭제에 실패했습니다.');
  }
}
