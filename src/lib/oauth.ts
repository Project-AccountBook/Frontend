import { Capacitor } from '@capacitor/core';

/**
 * 네이티브 앱의 OAuth2 콜백 딥링크 URI.
 * iOS Info.plist 의 CFBundleURLSchemes 와 Android AndroidManifest.xml 의 intent-filter,
 * 그리고 카카오/구글/네이버 개발자 콘솔에 동일한 값으로 등록되어야 한다.
 */
export const NATIVE_OAUTH_REDIRECT_URI = 'com.jointliving.app://oauth2/redirect';
export const NATIVE_OAUTH_SCHEME = 'com.jointliving.app';

/** Vite live-reload 를 WebView 가 직접 로드 중인 상태 (애뮬레이터 로컬 테스트). */
export function isNativeLiveReload(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const { protocol, hostname } = window.location;
  return (
    protocol === 'http:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '10.0.2.2'
  );
}

export function getOAuthRedirectUri(): string {
  if (!Capacitor.isNativePlatform() || isNativeLiveReload()) {
    return `${window.location.origin}/oauth2/redirect`;
  }
  return NATIVE_OAUTH_REDIRECT_URI;
}

/** 패키징된 앱에서만 Custom Tab / SFSafariView 를 쓴다. live-reload 에선 WebView 안에서 진행. */
export function shouldUseSystemBrowserForOAuth(): boolean {
  return Capacitor.isNativePlatform() && !isNativeLiveReload();
}
