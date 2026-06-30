import { resolveApiUrl } from './config';
import type { ApiResponse, RequestResult, TokenResponse } from './types';
import { tokenStorage } from './tokenStorage';

async function parseResponse<T>(res: Response): Promise<RequestResult<T>> {
  let body: ApiResponse<T> | null = null;

  try {
    body = await res.json();
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: res.ok
        ? '서버 응답을 처리할 수 없습니다.'
        : `요청에 실패했습니다. (${res.status})`,
    };
  }

  const success = body.success === true;

  return {
    ok: res.ok && success,
    status: res.status,
    data: success ? body.data : null,
    error: body.error,
  };
}

let reissuePromise: Promise<boolean> | null = null;

async function tryReissue(): Promise<boolean> {
  if (reissuePromise) return reissuePromise;

  reissuePromise = (async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(resolveApiUrl('/api/v1/auth/reissue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const body: ApiResponse<TokenResponse> = await res.json();
      if (res.ok && body.success) {
        tokenStorage.setTokens(body.data.accessToken, body.data.refreshToken);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  })();

  try {
    return await reissuePromise;
  } finally {
    reissuePromise = null;
  }
}

export async function publicRequest<T>(
  url: string,
  init: RequestInit = {}
): Promise<RequestResult<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(resolveApiUrl(url), { ...init, headers });
  return parseResponse<T>(res);
}

export async function authRequest<T>(
  url: string,
  init: RequestInit = {}
): Promise<RequestResult<T>> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const requestUrl = resolveApiUrl(url);
  let res = await fetch(requestUrl, { ...init, headers });

  if (res.status === 401) {
    const renewed = await tryReissue();
    if (renewed) {
      headers.set('Authorization', `Bearer ${tokenStorage.getAccessToken()}`);
      res = await fetch(requestUrl, { ...init, headers });
    }
  }

  return parseResponse<T>(res);
}
