# Capacitor 앱 패키징 가이드

기존 React + Vite 웹앱을 Capacitor 로 iOS/Android 앱으로 배포하기 위한 실전 순서.

## 진행 상태

- ✅ 1. Capacitor 설치 & 초기화
- ✅ 2. 네이티브 플랫폼 추가 (iOS/Android)
- ✅ 3. 개발 워크플로우 (스크립트 정리 완료)
- ✅ 4. `package.json` 스크립트
- ✅ 5. 필수 플러그인 설치 (9종) + `npx cap sync`
- ⏳ 5-1. 토큰 저장소 안전화 (Preferences 어댑터) — 미착수
- ⏳ 5-2. FCM 푸시 알림 — 미착수 (Firebase Console 설정 필요)
- ⏳ 5-3. 이미지 업로드 (Camera 플러그인 연동) — 미착수
- ⏳ 6. OAuth2 딥링크 — 미착수
- ✅ 7. CORS (백엔드) — `capacitor://localhost`, `http://localhost` 허용 추가
- ⏳ 8. 스플래시 & 아이콘 — 미착수 (소스 이미지 필요)
- ⏳ 9. 반응형·안전영역 — 미착수
- ⏳ 10. 배포 (TestFlight / Play Console) — 미착수
- ⏳ 11. 릴리즈 후 업데이트 전략 — 미착수


## 사전 준비물

- Node 20+, npm/pnpm
- **iOS 빌드**: macOS + Xcode 15+ + CocoaPods (`brew install cocoapods`)
- **Android 빌드**: Android Studio + JDK 17
- Apple Developer 계정 ($99/년, TestFlight 등록 필요), Google Play Console ($25 일회성)

## 1. Capacitor 설치 & 초기화

프론트 프로젝트 루트에서:

```bash
cd frontend
npm i @capacitor/core @capacitor/cli
npx cap init "JointLiving" "com.jointliving.app" --web-dir=dist
```

- `com.jointliving.app` = bundle ID. 나중에 못 바꾸니 신중히.
- `--web-dir=dist` = Vite 빌드 산출물 위치. `vite.config.ts` 의 `build.outDir` 이 다르면 맞춰야 함.

생성된 `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jointliving.app',
  appName: 'JointLiving',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 개발 중엔 아래 주석 풀어서 dev 서버 붙이기
    // url: 'http://192.168.0.10:5173',
    // cleartext: true,
  },
};
export default config;
```

## 2. 네이티브 플랫폼 추가

```bash
npm i @capacitor/ios @capacitor/android
npm run build              # dist/ 생성
npx cap add ios
npx cap add android
```

`ios/`, `android/` 폴더 생성 — **커밋 필요** (네이티브 프로젝트 파일).

`.gitignore` 추가 항목:
```gitignore
ios/Pods/
ios/App/Podfile.lock  # 팀 정책 따라
android/.gradle/
android/build/
android/app/build/
android/local.properties
```

## 3. 개발 워크플로우

빌드 → 네이티브 동기화 → 실행:

```bash
npm run build              # Vite 빌드
npx cap sync               # dist/ 를 네이티브 앱에 복사 + 플러그인 반영
npx cap open ios           # Xcode 열기 → ▶ 실행
npx cap open android       # Android Studio 열기 → ▶ 실행
```

**핫리로드 팁**: `capacitor.config.ts` 의 `server.url` 을 로컬 dev 서버 IP로 지정하면 웹처럼 저장 즉시 반영. 배포 빌드 전엔 반드시 주석 처리.

## 4. `package.json` 스크립트

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "app:sync": "npm run build && npx cap sync",
    "app:ios": "npm run app:sync && npx cap open ios",
    "app:android": "npm run app:sync && npx cap open android"
  }
}
```

## 5. 필수 플러그인

```bash
npm i @capacitor/preferences \
      @capacitor/push-notifications \
      @capacitor/camera \
      @capacitor/filesystem \
      @capacitor/app \
      @capacitor/status-bar \
      @capacitor/splash-screen \
      @capacitor/browser \
      @capacitor/keyboard
npx cap sync
```

### 5-1. 토큰 저장소 안전화

`localStorage` 는 웹뷰에서 앱 삭제 시 날아가고 백업에 노출됨. `Preferences` 로 어댑터:

```ts
// src/api/tokenStorage.ts
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

async function setItem(k: string, v: string) {
  if (isNative) await Preferences.set({ key: k, value: v });
  else localStorage.setItem(k, v);
}
// getItem/removeItem 동일 패턴
```

⚠️ 기존 동기 API(`localStorage.getItem`) → async 로딩 완료 후 앱 렌더 구조로 감싸야 함.

### 5-2. FCM 푸시 알림

백엔드 FCM 인프라 존재. 앱에서 토큰 등록만:

```ts
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export async function initPush() {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;
  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    await authFetch('/api/v1/users/me/devices', {
      method: 'POST',
      body: JSON.stringify({
        fcmToken: token.value,
        platform: Capacitor.getPlatform(),
      }),
    });
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const boardId = action.notification.data?.boardId;
    if (boardId) window.location.hash = `/qa?post=${boardId}`;
  });
}
```

**iOS Xcode 설정**:
- Signing & Capabilities → **Push Notifications**, **Background Modes → Remote notifications** 추가
- Firebase Console 에서 `GoogleService-Info.plist` 받아 프로젝트 추가
- APNs 인증서/키를 Firebase Console 에 업로드

**Android 설정**:
- `android/app/google-services.json` 배치
- `android/build.gradle`: `classpath 'com.google.gms:google-services:4.4.0'`
- `android/app/build.gradle` 하단: `apply plugin: 'com.google.gms.google-services'`

### 5-3. 이미지 업로드 (게시판)

```ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 80,
  resultType: CameraResultType.Uri,
  source: CameraSource.Prompt,  // 카메라/갤러리 선택
});
const blob = await fetch(photo.webPath!).then(r => r.blob());
const form = new FormData();
form.append('file', blob, 'image.jpg');
await authFetch('/api/files/upload', { method: 'POST', body: form });
```

## 6. OAuth2 로그인 (카카오/구글)

웹의 `/oauth2/redirect` → 앱에선 브라우저 열고 콜백을 앱이 가로채야 함.

### A. 커스텀 스킴 (추천)

`com.jointliving.app://oauth2/redirect` 를 redirect URI 로 등록

- iOS: `ios/App/App/Info.plist` 에 `CFBundleURLTypes` 추가
- Android: `android/app/src/main/AndroidManifest.xml` MainActivity 에 `<intent-filter>` 추가
- 카카오/구글 콘솔에도 이 URI 등록
- Spring Security redirect URI whitelist 에도 추가

### B. Universal Links / App Links

`https://jointliving.com/oauth2/redirect` 를 앱이 가로채기. 도메인 인증(`apple-app-site-association`, `assetlinks.json`) 필요. 더 깔끔하지만 셋업 복잡.

브라우저 열기:
```ts
import { Browser } from '@capacitor/browser';
await Browser.open({ url: 'https://api.jointliving.com/oauth2/authorization/kakao' });
```

콜백 처리:
```ts
import { App } from '@capacitor/app';
App.addListener('appUrlOpen', ({ url }) => {
  // com.jointliving.app://oauth2/redirect?accessToken=...&refreshToken=...
  const params = new URLSearchParams(new URL(url).search);
  tokenStorage.setTokens(params.get('accessToken')!, params.get('refreshToken')!, ...);
  Browser.close();
});
```

## 7. CORS 설정 (백엔드)

앱 fetch 의 origin:
- iOS: `capacitor://localhost`
- Android: `http://localhost`

백엔드 CORS 에 추가:

```java
config.setAllowedOrigins(List.of(
    "http://localhost:5173",
    "https://jointliving.vercel.app",
    "capacitor://localhost",     // iOS
    "http://localhost"           // Android
));
```

## 8. 스플래시 & 아이콘

```bash
npm i -D @capacitor/assets
# 소스: resources/icon.png (1024x1024), resources/splash.png (2732x2732)
npx capacitor-assets generate
```

## 9. 반응형·안전영역

- **노치/펀치홀**: CSS 에 `env(safe-area-inset-top)` 사용
  ```css
  .app-layout { padding-top: env(safe-area-inset-top); }
  ```
- **상태바 색**: `@capacitor/status-bar` 로 앱 부팅 시 스타일 지정
- **키보드**: `@capacitor/keyboard` 로 인풋 포커스 시 화면 안 가려지게

## 10. 배포

### iOS TestFlight
1. Xcode → Signing & Capabilities → 팀 선택, bundle ID 확인
2. Product → Archive → Distribute App → App Store Connect
3. App Store Connect → TestFlight → 내부/외부 테스터 초대

### Android Play Console
```bash
cd android && ./gradlew bundleRelease
# 산출물: android/app/build/outputs/bundle/release/app-release.aab
```
Play Console → 내부 테스트 트랙 업로드

**서명 키 잃어버리면 앱 업데이트 불가** — `android/app/keystore/` 백업 필수.

## 11. 릴리즈 후 업데이트

- **웹 코드만 바뀐 경우**: `npm run app:sync` 후 재빌드·재제출 필요 (기본 OTA 없음)
- **OTA 원하면**: `@capgo/capacitor-updater` 같은 커뮤니티 플러그인 (자체 CDN 필요)

## 12. 이 프로젝트에서 주의할 것

1. **인라인 `<a href>` / `window.location`**: `App.tsx` 의 hash 라우팅은 그대로 동작. 외부 링크는 `Browser.open()` 으로 열어야 앱 안에서 안 갇힘
2. **파일 다운로드**: 거래내역 export CSV 같은 건 웹뷰에서 동작 안 함 → `@capacitor/filesystem` + share sheet 로 우회
3. **`vercel.json` SPA 리라이트**: 앱에선 무의미 (파일 자체는 해 없음)
4. **Chart.js / recharts**: 대시보드 차트는 웹뷰에서 정상 렌더링

## 최소 실전 순서

```bash
# 1. 설치
cd frontend
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "JointLiving" "com.jointliving.app" --web-dir=dist

# 2. 빌드 + 플랫폼 추가
npm run build && npx cap add ios && npx cap add android

# 3. Xcode / Android Studio 로 열어서 실행 테스트
npx cap open ios

# 4. 플러그인 추가 → sync
npm i @capacitor/preferences @capacitor/push-notifications @capacitor/camera @capacitor/app
npx cap sync

# 5. 토큰 저장소 어댑터·푸시 초기화·OAuth 딥링크 코드 반영
# 6. 아이콘/스플래시 생성
# 7. 서명 → 스토어 업로드
```

**예상 기간**: 첫 실행까지 반나절, TestFlight/내부테스트 배포까지 2~3일.
