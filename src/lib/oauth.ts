import { Capacitor } from '@capacitor/core';

export const NATIVE_OAUTH_REDIRECT_URI = 'com.jointliving.app://oauth2/redirect';
export const NATIVE_OAUTH_SCHEME = 'com.jointliving.app';

function isCapacitorApp(): boolean {
  if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
    return true;
  }
  return window.location.origin === 'https://localhost';
}

export function getOAuthRedirectUri(): string {
  if (isCapacitorApp()) {
    return NATIVE_OAUTH_REDIRECT_URI;
  }
  return `${window.location.origin}/oauth2/redirect`;
}

export function shouldUseSystemBrowserForOAuth(): boolean {
  return isCapacitorApp();
}
