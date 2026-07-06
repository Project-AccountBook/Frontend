import { resolveApiUrl } from './config';
import type { ApiResponse, RequestResult, TokenResponse } from './types';
import { tokenStorage } from './tokenStorage';

async function parseResponse<T>(res: Response): Promise<RequestResult<T>> {
  let body: ApiResponse<T> | null = null;

  try {
    const text = await res.text();
    if (!text) {
      if (res.ok) {
        return { ok: true, status: res.status, data: null, error: null };
      }
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `요청에 실패했습니다. (${res.status})`,
      };
    }
    body = JSON.parse(text) as ApiResponse<T>;
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

  if (!body) {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: '올바르지 않은 서버 응답입니다.',
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
let authExpiredHandler: (() => void) | null = null;

export function setAuthExpiredHandler(handler: (() => void) | null) {
  authExpiredHandler = handler;
}

function handleAuthExpired() {
  if (!tokenStorage.hasToken()) return;
  tokenStorage.clear();
  authExpiredHandler?.();
}

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
      const text = await res.text();
      if (!text) return false;
      const body = JSON.parse(text) as ApiResponse<TokenResponse>;
      if (res.ok && body.success && body.data?.accessToken && body.data?.refreshToken) {
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

async function executeWithReissue(
  requestUrl: string,
  init: RequestInit,
  headers: Headers,
): Promise<Response> {
  let res = await fetch(requestUrl, { ...init, headers });

  if ((res.status === 401 || res.status === 403) && tokenStorage.getRefreshToken()) {
    const renewed = await tryReissue();
    if (renewed) {
      headers.set('Authorization', `Bearer ${tokenStorage.getAccessToken()}`);
      res = await fetch(requestUrl, { ...init, headers });
      if (res.status === 401) {
        handleAuthExpired();
      }
    } else {
      handleAuthExpired();
    }
  }

  return res;
}

/** ApiResponse 래퍼 없이 raw Response가 필요한 API용 */
export async function authFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return executeWithReissue(resolveApiUrl(url), init, headers);
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
  const res = await executeWithReissue(requestUrl, init, headers);

  return parseResponse<T>(res);
}
