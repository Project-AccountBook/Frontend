const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_EMAIL_KEY = 'userEmail';
const REMEMBER_ME_PENDING_KEY = 'authRememberMePending';

function getStorageWithToken(): Storage | null {
  if (localStorage.getItem(ACCESS_TOKEN_KEY)) return localStorage;
  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) return sessionStorage;
  return null;
}

function getActiveStorage(): Storage {
  return getStorageWithToken() ?? localStorage;
}

function clearFromStorage(storage: Storage) {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_EMAIL_KEY);
}

function setInStorage(
  storage: Storage,
  accessToken: string,
  refreshToken: string,
  email?: string,
) {
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (email !== undefined) {
    storage.setItem(USER_EMAIL_KEY, email);
  }
}

export const tokenStorage = {
  getAccessToken: () => getActiveStorage().getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => getActiveStorage().getItem(REFRESH_TOKEN_KEY),
  getUserEmail: () => getActiveStorage().getItem(USER_EMAIL_KEY),
  hasToken: () => getStorageWithToken() !== null,

  setTokens: (
    accessToken: string,
    refreshToken: string,
    email?: string,
    rememberMe?: boolean,
  ) => {
    const target =
      rememberMe === undefined
        ? getActiveStorage()
        : rememberMe
          ? localStorage
          : sessionStorage;

    const other = target === localStorage ? sessionStorage : localStorage;
    clearFromStorage(other);
    setInStorage(target, accessToken, refreshToken, email);
  },

  clear: () => {
    clearFromStorage(localStorage);
    clearFromStorage(sessionStorage);
  },

  setPendingRememberMe: (rememberMe: boolean) => {
    sessionStorage.setItem(REMEMBER_ME_PENDING_KEY, rememberMe ? '1' : '0');
  },

  consumePendingRememberMe: (): boolean | undefined => {
    const value = sessionStorage.getItem(REMEMBER_ME_PENDING_KEY);
    sessionStorage.removeItem(REMEMBER_ME_PENDING_KEY);
    if (value === null) return undefined;
    return value === '1';
  },
};
