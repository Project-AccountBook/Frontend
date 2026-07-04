import type { TransactionType } from './categoryApi';

export type FrequencyType = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface FixedTransactionResponse {
  id: number;
  accountName: string;
  categoryName: string;
  type: TransactionType;
  amount: number;
  frequency: FrequencyType;
  repeatDay: number;
  startDate: string;
  endDate?: string | null;
  description: string;
  isActive: boolean;
}

export interface FixedTransactionRequest {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  frequency: FrequencyType;
  repeatDay: number;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

import { tokenStorage } from './tokenStorage';

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ''}`,
});

/** GET /api/v1/fixed-transactions */
export async function getFixedTransactions(): Promise<FixedTransactionResponse[]> {
  const res = await fetch('/api/v1/fixed-transactions', { headers: authHeader() });
  const data: ApiResponse<FixedTransactionResponse[]> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '고정 수입/지출 목록을 불러오는 데 실패했습니다.');
  }
  return data.data.map(normalizeFixedTransaction);
}

function normalizeFixedTransaction(fx: FixedTransactionResponse): FixedTransactionResponse {
  return {
    ...fx,
    amount: Number(fx.amount),
    description: fx.description ?? '',
  };
}

/** POST /api/v1/fixed-transactions */
export async function createFixedTransaction(request: FixedTransactionRequest): Promise<number> {
  const res = await fetch('/api/v1/fixed-transactions', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(request),
  });
  const data: ApiResponse<number> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '고정 수입/지출 등록에 실패했습니다.');
  }
  return data.data;
}

/** PUT /api/v1/fixed-transactions/{id} */
export async function updateFixedTransaction(id: number, request: FixedTransactionRequest): Promise<void> {
  const res = await fetch(`/api/v1/fixed-transactions/${id}`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(request),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '고정 수입/지출 수정에 실패했습니다.');
  }
}

/** PATCH /api/v1/fixed-transactions/{id}/toggle-active */
export async function toggleFixedTransactionActive(id: number): Promise<void> {
  const res = await fetch(`/api/v1/fixed-transactions/${id}/toggle-active`, {
    method: 'PATCH',
    headers: authHeader(),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '활성 상태 변경에 실패했습니다.');
  }
}

/** DELETE /api/v1/fixed-transactions/{id} */
export async function deleteFixedTransaction(id: number): Promise<void> {
  const res = await fetch(`/api/v1/fixed-transactions/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '고정 수입/지출 삭제에 실패했습니다.');
  }
}
