/**
 * 네이티브 앱의 OAuth2 콜백 딥링크 URI.
 * iOS Info.plist 의 CFBundleURLSchemes 와 Android AndroidManifest.xml 의 intent-filter,
 * 그리고 카카오/구글/네이버 개발자 콘솔에 동일한 값으로 등록되어야 한다.
 */
export const NATIVE_OAUTH_REDIRECT_URI = 'com.jointliving.app://oauth2/redirect';
export const NATIVE_OAUTH_SCHEME = 'com.jointliving.app';
