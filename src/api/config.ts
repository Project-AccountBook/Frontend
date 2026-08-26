import { Capacitor } from '@capacitor/core';

/**
 * API base URL.
 * - 브라우저 dev / 로컬 앱 빌드: .env 의 VITE_API_BASE_URL (기본 localhost:8000)
 * - Play Store: .env.production 의 HTTPS API URL
 */
function getRawApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (Capacitor.isNativePlatform()) {
    return 'http://localhost:8000';
  }
  return 'http://localhost:8000';
}

const RAW_API_BASE_URL = getRawApiBaseUrl();

/** Android 에뮬레이터: localhost → 10.0.2.2 */
function resolveNativeApiBaseUrl(base: string): string {
  if (!base || Capacitor.getPlatform() !== 'android') return base;
  return base
    .replace('://localhost', '://10.0.2.2')
    .replace('://127.0.0.1', '://10.0.2.2');
}

export const API_BASE_URL = resolveNativeApiBaseUrl(RAW_API_BASE_URL);

/** OAuth 시작 URL. Android Custom Tab → localhost (adb reverse 필요, 네이버 콜백 URL 과 일치). */
export function getOAuthAuthorizationBaseUrl(): string {
  if (Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform()) {
    return 'http://localhost:8000';
  }
  return API_BASE_URL;
}

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}
