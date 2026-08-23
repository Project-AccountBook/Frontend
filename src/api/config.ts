import { Capacitor } from '@capacitor/core';

// `--mode app` 처럼 development 가 아니면 `.env.development` 가 안 읽힌다.
// 빈 값이면 소셜 로그인이 `/oauth2/...` 로 가서 Vite SPA 가 로그인 화면만 다시 그린다.
const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

/** Android 에뮬레이터에서 localhost 는 호스트 PC 가 아니라 에뮬레이터 자신을 가리킨다. */
function resolveNativeApiBaseUrl(base: string): string {
  if (!base || Capacitor.getPlatform() !== 'android') return base;
  return base
    .replace('://localhost', '://10.0.2.2')
    .replace('://127.0.0.1', '://10.0.2.2');
}

export const API_BASE_URL = resolveNativeApiBaseUrl(RAW_API_BASE_URL);

/**
 * 소셜 로그인 시작 URL. OAuth 제공자·Spring 에 localhost 콜백만 등록돼 있어
 * Android 에뮬레이터에선 adb reverse 후 localhost 를 쓴다 (API fetch 는 10.0.2.2 유지).
 */
export function getOAuthAuthorizationBaseUrl(): string {
  if (Capacitor.getPlatform() === 'android') {
    return RAW_API_BASE_URL.replace('://10.0.2.2', '://localhost');
  }
  return API_BASE_URL;
}

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}
