import { authFetch } from './client';
import type { AccountRole } from '../lib/accountGoalStorage';

export type { AccountRole };

export interface AccountResponse {
  id: number;
  accountName: string;
  initialBalance: number;
  currentBalance: number;
  role: AccountRole;
  goalAmount: number | null;
  goalDate: string | null;
  progressPercent: number | null;
}

export interface AccountRequest {
  accountName: string;
  initialBalance: number;
  role?: AccountRole;
}

export interface AccountGoalRequest {
  goalAmount: number;
  goalDate?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

/** GET /api/v1/account — 목록은 ApiResponse 래퍼 없이 배열로 반환 */
export async function getAccounts(): Promise<AccountResponse[]> {
  const res = await authFetch('/api/v1/account');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? '계좌 목록을 불러오는 데 실패했습니다.');
  }
  return res.json();
}

/** POST /api/v1/account */
export async function createAccount(request: AccountRequest): Promise<number> {
  const res = await authFetch('/api/v1/account', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(request),
  });
  const data: ApiResponse<number> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 생성에 실패했습니다.');
  }
  return data.data;
}

/** PATCH /api/v1/account/{accountId} */
export async function updateAccount(accountId: number, request: AccountRequest): Promise<void> {
  const res = await authFetch(`/api/v1/account/${accountId}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(request),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 수정에 실패했습니다.');
  }
}

/** PATCH /api/v1/account/{accountId}/goal */
export async function updateAccountGoal(accountId: number, request: AccountGoalRequest): Promise<void> {
  const res = await authFetch(`/api/v1/account/${accountId}/goal`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(request),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 목표 수정에 실패했습니다.');
  }
}

/** DELETE /api/v1/account/{accountId}/goal */
export async function clearAccountGoal(accountId: number): Promise<void> {
  const res = await authFetch(`/api/v1/account/${accountId}/goal`, {
    method: 'DELETE',
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 목표 삭제에 실패했습니다.');
  }
}

/** DELETE /api/v1/account/{accountId} */
export async function deleteAccount(accountId: number): Promise<void> {
  const res = await authFetch(`/api/v1/account/${accountId}`, {
    method: 'DELETE',
    headers: jsonHeaders,
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 삭제에 실패했습니다.');
  }
}
