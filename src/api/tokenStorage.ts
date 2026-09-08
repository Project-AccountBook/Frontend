import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_EMAIL_KEY = 'userEmail';
const REMEMBER_ME_PENDING_KEY = 'authRememberMePending';

const isNative = Capacitor.isNativePlatform();

type Cache = {
  accessToken: string | null;
  userEmail: string | null;
};

const cache: Cache = { accessToken: null, userEmail: null };

function getWebStorageWithToken(): Storage | null {
  if (localStorage.getItem(ACCESS_TOKEN_KEY)) return localStorage;
  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) return sessionStorage;
  return null;
}

function getWebActiveStorage(): Storage {
  return getWebStorageWithToken() ?? localStorage;
}

function clearWebStorage(storage: Storage) {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(USER_EMAIL_KEY);
}

function setWebStorage(
  storage: Storage,
  accessToken: string,
  email?: string,
) {
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (email !== undefined) {
    storage.setItem(USER_EMAIL_KEY, email);
  }
}

async function persistNative(
  accessToken: string,
  email?: string,
) {
  const tasks: Promise<unknown>[] = [
    Preferences.set({ key: ACCESS_TOKEN_KEY, value: accessToken }),
  ];
  if (email !== undefined) {
    tasks.push(Preferences.set({ key: USER_EMAIL_KEY, value: email }));
  }
  await Promise.all(tasks);
}

async function clearNative() {
  await Promise.all([
    Preferences.remove({ key: ACCESS_TOKEN_KEY }),
    Preferences.remove({ key: USER_EMAIL_KEY }),
  ]);
}

/**
 * 앱 부팅 시 토큰을 스토리지에서 in-memory 캐시로 로드한다.
 * 캐시가 채워지기 전에 렌더링되면 로그인 상태가 초기화된 것처럼 보이므로
 * `main.tsx` 에서 이 함수를 await 한 뒤 앱을 렌더해야 한다.
 */
export async function initTokenStorage(): Promise<void> {
  if (isNative) {
    const [at, em] = await Promise.all([
      Preferences.get({ key: ACCESS_TOKEN_KEY }),
      Preferences.get({ key: USER_EMAIL_KEY }),
    ]);
    cache.accessToken = at.value;
    cache.userEmail = em.value;
    return;
  }

  const storage = getWebStorageWithToken();
  if (storage) {
    cache.accessToken = storage.getItem(ACCESS_TOKEN_KEY);
    cache.userEmail = storage.getItem(USER_EMAIL_KEY);
  }
}

export const tokenStorage = {
  getAccessToken: () => cache.accessToken,
  getUserEmail: () => cache.userEmail,
  hasToken: () => cache.accessToken !== null,

  setTokens: (
    accessToken: string,
    email?: string,
    rememberMe?: boolean,
  ) => {
    cache.accessToken = accessToken;
    if (email !== undefined) {
      cache.userEmail = email;
    }

    if (isNative) {
      void persistNative(accessToken, email);
      return;
    }

    const target =
      rememberMe === undefined
        ? getWebActiveStorage()
        : rememberMe
          ? localStorage
          : sessionStorage;

    const other = target === localStorage ? sessionStorage : localStorage;
    clearWebStorage(other);
    setWebStorage(target, accessToken, email);
  },

  clear: () => {
    cache.accessToken = null;
    cache.userEmail = null;

    if (isNative) {
      void clearNative();
      return;
    }

    clearWebStorage(localStorage);
    clearWebStorage(sessionStorage);
  },

  setPendingRememberMe: (rememberMe: boolean) => {
    // 네이티브 앱은 항상 영속 저장이므로 rememberMe 플래그가 무의미하다.
    if (isNative) return;
    sessionStorage.setItem(REMEMBER_ME_PENDING_KEY, rememberMe ? '1' : '0');
  },

  consumePendingRememberMe: (): boolean | undefined => {
    if (isNative) return true;
    const value = sessionStorage.getItem(REMEMBER_ME_PENDING_KEY);
    sessionStorage.removeItem(REMEMBER_ME_PENDING_KEY);
    if (value === null) return undefined;
    return value === '1';
  },
};
