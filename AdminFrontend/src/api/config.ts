export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}
