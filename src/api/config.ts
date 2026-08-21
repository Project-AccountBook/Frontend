// `--mode app` 처럼 development 가 아니면 `.env.development` 가 안 읽힌다.
// 빈 값이면 소셜 로그인이 `/oauth2/...` 로 가서 Vite SPA 가 로그인 화면만 다시 그린다.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}
