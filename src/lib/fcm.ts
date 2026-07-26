import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from 'firebase/messaging';
import { notificationApi } from '../api/notificationApi';
import {
  getFirebaseVapidKey,
  getFirebaseWebConfig,
  isFirebaseConfigured,
} from '../config/firebase';

const SW_SCRIPT = '/firebase-messaging-sw.js';
const SW_SCOPE = '/';
const PUSH_ENABLED_KEY = 'jointliving_push_enabled';
export const PUSH_PREFERENCE_CHANGED_EVENT = 'jointliving:push-preference-changed';

let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;
let registeredToken: string | null = null;

export type PushPermissionStatus = NotificationPermission | 'unsupported' | 'not-configured';

export function isPushEnabledInApp(): boolean {
  return localStorage.getItem(PUSH_ENABLED_KEY) !== 'false';
}

export function setPushEnabledInApp(enabled: boolean): void {
  localStorage.setItem(PUSH_ENABLED_KEY, String(enabled));
  window.dispatchEvent(new Event(PUSH_PREFERENCE_CHANGED_EVENT));
}

export function resetPushSettingsInApp(): void {
  localStorage.removeItem(PUSH_ENABLED_KEY);
  window.dispatchEvent(new Event(PUSH_PREFERENCE_CHANGED_EVENT));
}

export function getPushPermissionStatus(): PushPermissionStatus {
  if (!isFirebaseConfigured()) return 'not-configured';
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = initializeApp(getFirebaseWebConfig());
  }
  return firebaseApp;
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!(await isSupported())) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(getFirebaseApp());
  }
  return messagingInstance;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('이 브라우저는 Service Worker를 지원하지 않습니다.');
  }

  const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existing?.active?.scriptURL.includes('firebase-messaging-sw.js')) {
    return existing;
  }

  return navigator.serviceWorker.register(SW_SCRIPT, { scope: SW_SCOPE });
}

async function registerTokenWithBackend(token: string): Promise<boolean> {
  if (registeredToken === token) return true;

  const result = await notificationApi.registerDeviceToken(token);
  if (result.ok) {
    registeredToken = token;
    return true;
  }

  console.warn('[FCM] device token registration failed:', result.error);
  return false;
}

function showForegroundNotification(payload: MessagePayload): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const title = payload.notification?.title ?? '새 알림';
  const body = payload.notification?.body ?? '';
  const redirectUrl = payload.data?.redirectUrl;

  new Notification(title, {
    body,
    icon: '/favicon.svg',
    data: {
      redirectUrl: redirectUrl ?? '',
      referenceId: payload.data?.referenceId ?? '',
    },
  });
}

export async function requestPushNotifications(): Promise<{ ok: boolean; error?: string }> {
  if (!isFirebaseConfigured()) {
    return { ok: false, error: 'Firebase 설정이 없습니다. 환경 변수를 확인해 주세요.' };
  }

  if (!(await isSupported())) {
    return { ok: false, error: '이 브라우저에서는 웹 푸시 알림을 지원하지 않습니다.' };
  }

  if (typeof Notification === 'undefined') {
    return { ok: false, error: '이 브라우저에서는 알림 API를 사용할 수 없습니다.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, error: '브라우저 알림 권한이 거부되었습니다.' };
  }

  try {
    setPushEnabledInApp(true);
    await enablePushNotifications();
    return { ok: true };
  } catch (err) {
    setPushEnabledInApp(false);
    return {
      ok: false,
      error: err instanceof Error ? err.message : '푸시 알림 설정에 실패했습니다.',
    };
  }
}

export async function enablePushNotifications(): Promise<string | null> {
  if (!isFirebaseConfigured() || !isPushEnabledInApp()) return null;
  if (Notification.permission !== 'granted') return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey: getFirebaseVapidKey(),
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error('FCM 토큰을 발급받지 못했습니다.');
  }

  const registered = await registerTokenWithBackend(token);
  if (!registered) {
    throw new Error('서버에 FCM 토큰을 등록하지 못했습니다.');
  }

  return token;
}

export async function disablePushNotifications(): Promise<void> {
  setPushEnabledInApp(false);
  registeredToken = null;

  try {
    await notificationApi.unregisterDeviceToken();
  } catch (err) {
    console.warn('[FCM] device token unregister failed:', err);
  }

  try {
    const messaging = await getMessagingInstance();
    if (messaging) {
      await deleteToken(messaging);
    }
  } catch (err) {
    console.warn('[FCM] local token delete failed:', err);
  }
}

export async function setupFcm(onForegroundMessage: () => void): Promise<(() => void) | undefined> {
  if (!isFirebaseConfigured()) {
    console.info('[FCM] Firebase env vars not set — push notifications disabled.');
    return undefined;
  }

  if (!(await isSupported())) {
    console.info('[FCM] Firebase Messaging is not supported in this browser.');
    return undefined;
  }

  let unsubscribe: (() => void) | undefined;

  if (Notification.permission === 'granted' && isPushEnabledInApp()) {
    try {
      await enablePushNotifications();
    } catch (err) {
      console.warn('[FCM] Failed to enable push notifications:', err);
    }
  }

  const messaging = await getMessagingInstance();
  if (messaging) {
    unsubscribe = onMessage(messaging, (payload) => {
      if (!isPushEnabledInApp()) return;
      showForegroundNotification(payload);
      onForegroundMessage();
      window.setTimeout(onForegroundMessage, 500);
    });
  }

  return unsubscribe;
}

export function resetFcmSession(): void {
  registeredToken = null;
}
