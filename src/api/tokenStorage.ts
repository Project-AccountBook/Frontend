const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_EMAIL_KEY = 'userEmail';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUserEmail: () => localStorage.getItem(USER_EMAIL_KEY),
  hasToken: () => !!localStorage.getItem(ACCESS_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string, email?: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (email !== undefined) {
      localStorage.setItem(USER_EMAIL_KEY, email);
    }
  },

  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
  },
};
