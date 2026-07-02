export interface AccountResponse {
  id: number;
  accountName: string;
  currentBalance: number;
}

export interface AccountRequest {
  accountName: string;
  initialBalance: number;
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

/** GET /api/v1/account — 목록은 ApiResponse 래퍼 없이 배열로 반환 */
export async function getAccounts(): Promise<AccountResponse[]> {
  const res = await fetch('/api/v1/account', { headers: authHeader() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? '계좌 목록을 불러오는 데 실패했습니다.');
  }
  return res.json();
}

/** POST /api/v1/account */
export async function createAccount(request: AccountRequest): Promise<number> {
  const res = await fetch('/api/v1/account', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(request),
  });
  const data: ApiResponse<number> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 생성에 실패했습니다.');
  }
  return data.data;
}

/** PATCH /api/v1/account/{accountId} — 서버는 accountName만 반영 */
export async function updateAccount(accountId: number, accountName: string): Promise<void> {
  const res = await fetch(`/api/v1/account/${accountId}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ accountName, initialBalance: 0 }),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 수정에 실패했습니다.');
  }
}

/** DELETE /api/v1/account/{accountId} */
export async function deleteAccount(accountId: number): Promise<void> {
  const res = await fetch(`/api/v1/account/${accountId}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  const data: ApiResponse<null> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? '계좌 삭제에 실패했습니다.');
  }
}
