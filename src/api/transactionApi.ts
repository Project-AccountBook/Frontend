import { authFetch } from './client';
import type { TransactionType } from './categoryApi';

export interface TransactionResponse {
  id: number;
  accountId: number;
  accountName: string;
  accountArchived?: boolean;
  targetAccountId?: number | null;
  targetAccountName?: string | null;
  targetAccountArchived?: boolean;
  categoryId: number;
  categoryName: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  description: string;
  fixedTransactionGenerated?: boolean;
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

const jsonHeaders = { 'Content-Type': 'application/json' };

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

  const res = await authFetch(`/api/v1/transactions?${search}`);
  const data: ApiResponse<SpringPage<TransactionResponse>> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역을 불러오는 데 실패했습니다.');
  }
  return data.data;
}

/** POST /api/v1/transactions */
export async function createTransaction(request: TransactionRequest): Promise<number> {
  const res = await authFetch('/api/v1/transactions', {
    method: 'POST',
    headers: jsonHeaders,
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
  const res = await authFetch(`/api/v1/transactions/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(request),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역 수정에 실패했습니다.');
  }
}

/** DELETE /api/v1/transactions/{id} */
export async function deleteTransaction(id: number): Promise<void> {
  const res = await authFetch(`/api/v1/transactions/${id}`, {
    method: 'DELETE',
    headers: jsonHeaders,
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역 삭제에 실패했습니다.');
  }
}

/** GET /api/v1/transactions/export — 엑셀 파일 다운로드 */
export async function exportTransactions(startDate: string, endDate: string): Promise<void> {
  const search = new URLSearchParams({ startDate, endDate });
  const res = await authFetch(`/api/v1/transactions/export?${search}`);
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

/** GET /api/v1/transactions/all — 삭제된 계좌 거래 포함 전체 조회 */
export async function getAllUserTransactions(
  startDate: string,
  endDate: string,
  page = 0,
  size = 500
): Promise<SpringPage<TransactionResponse>> {
  const search = new URLSearchParams({
    startDate,
    endDate,
    page: String(page),
    size: String(size),
    sort: 'transactionDate,desc',
  });

  const res = await authFetch(`/api/v1/transactions/all?${search}`);
  const data: ApiResponse<SpringPage<TransactionResponse>> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '거래 내역을 불러오는 데 실패했습니다.');
  }
  return data.data;
}

/** 여러 계좌의 거래 내역을 병합 조회 */
export async function getTransactionsForAccounts(
  accountIds: number[],
  startDate: string,
  endDate: string
): Promise<TransactionResponse[]> {
  if (accountIds.length === 0) return [];

  const page = await getAllUserTransactions(startDate, endDate);
  const accountIdSet = new Set(accountIds);

  return page.content
    .map(normalizeTransaction)
    .filter((tx) => accountIdSet.has(tx.accountId))
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id);
}

function normalizeTransaction(tx: TransactionResponse): TransactionResponse {
  return {
    ...tx,
    amount: Number(tx.amount),
    description: tx.description ?? '',
    fixedTransactionGenerated: tx.fixedTransactionGenerated ?? false,
  };
}
