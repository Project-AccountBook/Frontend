import type { TransactionType } from './categoryApi';

export interface TransactionResponse {
  id: number;
  accountId: number;
  accountName: string;
  categoryId: number;
  categoryName: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  description: string;
}

export interface TransactionRequest {
  accountId: number;
  targetAccountId?: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

import { tokenStorage } from './tokenStorage';

const authHeader = (json = true) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ''}`,
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
};

/** GET /api/v1/transactions */
export async function getTransactions(params: {
  accountId: number;
  startDate: string;
  endDate: string;
  page?: number;
  size?: number;
}): Promise<SpringPage<TransactionResponse>> {
  const search = new URLSearchParams({
    accountId: String(params.accountId),
    startDate: params.startDate,
    endDate: params.endDate,
    page: String(params.page ?? 0),
    size: String(params.size ?? 500),
    sort: 'transactionDate,desc',
  });

  const res = await fetch(`/api/v1/transactions?${search}`, { headers: authHeader() });
  const data: ApiResponse<SpringPage<TransactionResponse>> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역을 불러오는 데 실패했습니다.');
  }
  return data.data;
}

/** POST /api/v1/transactions */
export async function createTransaction(request: TransactionRequest): Promise<number> {
  const res = await fetch('/api/v1/transactions', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(request),
  });
  const data: ApiResponse<number> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역 등록에 실패했습니다.');
  }
  return data.data;
}

/** PATCH /api/v1/transactions/{id} */
export async function updateTransaction(id: number, request: TransactionRequest): Promise<void> {
  const res = await fetch(`/api/v1/transactions/${id}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(request),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역 수정에 실패했습니다.');
  }
}

/** DELETE /api/v1/transactions/{id} */
export async function deleteTransaction(id: number): Promise<void> {
  const res = await fetch(`/api/v1/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역 삭제에 실패했습니다.');
  }
}

/** GET /api/v1/transactions/export — 엑셀 파일 다운로드 */
export async function exportTransactions(startDate: string, endDate: string): Promise<void> {
  const search = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`/api/v1/transactions/export?${search}`, {
    headers: authHeader(false),
  });
  if (!res.ok) {
    throw new Error('거래 내역 내보내기에 실패했습니다.');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const fileNameMatch = disposition?.match(/filename="?([^"]+)"?/);
  const fileName = fileNameMatch?.[1] ?? `account_book_${startDate}_to_${endDate}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** 여러 계좌의 거래 내역을 병합 조회 */
export async function getTransactionsForAccounts(
  accountIds: number[],
  startDate: string,
  endDate: string
): Promise<TransactionResponse[]> {
  if (accountIds.length === 0) return [];

  const pages = await Promise.all(
    accountIds.map((accountId) => getTransactions({ accountId, startDate, endDate }))
  );

  return pages
    .flatMap((page) => page.content.map(normalizeTransaction))
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id);
}

function normalizeTransaction(tx: TransactionResponse): TransactionResponse {
  return {
    ...tx,
    amount: Number(tx.amount),
    description: tx.description ?? '',
  };
}
