# MODI

> **함께하면 즐겁고 가벼워지는 공동생활 가계부**  
> 가계부, 소비 비교, 동네 공동구매를 한곳에서 쓰는 웹/앱 프론트엔드입니다.

<img width="200" alt="modi_logo" src="https://github.com/user-attachments/assets/bf91b909-b35b-4b80-a44a-d865cf580afd" />

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com)

Live Demo: [https://moneydiary.cloud](https://moneydiary.cloud)

---

## 📝소개

MODI는 개인 가계 관리만 하는 앱이 아니라, **내 지출을 다른 사용자와 비교하고, 같은 동네에서 공동구매까지 이어지게** 만든 서비스입니다.

웹은 React + Vite SPA로 배포하고, 같은 빌드 산출물을 Capacitor로 iOS/Android 앱에 올립니다. 데스크톱은 사이드바, 모바일/앱은 드로어 + 하단 탭으로 레이아웃을 나눕니다.

<p align="center">
  <img width="800" alt="image" src="https://github.com/user-attachments/assets/13cd4386-b709-4367-8fa9-10826eb4357d" />
  <img width="170" alt="Screenshot_20260907_152924" src="https://github.com/user-attachments/assets/9a5c93f8-2697-4859-9ca6-8c27d01683d7" />
</p>

---

## 📚주요 기능

### 가계부
- 계좌별 잔고, 수입/지출/이체 내역
- 고정 수입·지출, 커스텀 카테고리
- 월 예산과 실지출 비교
- 목표 금액 진행률
- 거래 내역 CSV 내보내기

### 비교
- 예산 / 지출 / 수입 / 포트폴리오 비교
- 나이대, 금액, 카테고리 필터
- 위치 기반 근처 사용자 평균 비교

### 공동구매
- 동네 공동구매 모집·참여, 거리 필터
- 목표 인원·마감 기한, 최신순 / 마감임박 / 달성률 정렬
- 관심 카테고리 알림
- 참여 시 1인 금액 고지, 예산과 연동

### 커뮤니티
- Q&A, 노하우 게시판 (작성·수정·삭제·댓글·검색)

### 계정
- 이메일 인증 회원가입, 로그인 유지, 비밀번호 재설정
- 카카오 / 네이버 / 구글 소셜 로그인
- 웹푸시(FCM), 마이페이지 프로필·알림 설정

---

## 🔧기술 스택

| 구분 | 사용 |
|---|---|
| UI | React 19, TypeScript, Vite 8, lucide-react |
| 상태·라우팅 | 화면 단위 View 컴포넌트 + hash 탭 라우팅 |
| API | `src/api` 모듈, JWT Bearer, refresh reissue, CSRF |
| 인증 저장 | 웹: localStorage / sessionStorage · 앱: Capacitor Preferences |
| 소셜 로그인 | Kakao, Naver, Google OAuth2 + 앱 딥링크 |
| 푸시 | Firebase Cloud Messaging (웹) |
| 네이티브 | Capacitor 8 (iOS / Android), Camera, Filesystem, Keyboard, StatusBar, Browser |
| 배포 | Vercel (SPA rewrite), Capacitor native build |

백엔드(별도 리포): Spring Boot, Spring Security, JWT, Redis, FCM, Elasticsearch, OCI + Docker + GitHub Actions

---

## 📱웹 · 반응형 · 앱

하나의 React 코드베이스로 웹과 iOS/Android를 같이 갑니다.

| 환경 | 레이아웃 | 기준 |
|---|---|---|
| 데스크톱 웹 (≥1101px) | 고정 사이드바 + 넓은 대시보드 | 뷰포트 너비 |
| 태블릿 / 모바일 웹 (≤1100px) | 헤더 드로어 + 하단 탭 (홈/내역/예산/커뮤니티/마이) | 미디어쿼리 |
| iOS / Android 앱 | 웹과 같은 화면, 노치·제스처 영역·네이티브 뒤로가기 | `Capacitor.isNativePlatform()` |

반응형은 창 크기로 맞추고, 앱 전용 UI는 창 크기와 무관하게 `document.body`의 `is-native` / `is-web` 클래스로 나눕니다. 그래서 큰 태블릿 웹뷰에서도 사이드바가 PC처럼 고정되지 않고, 앱 드로어로 유지됩니다.

앱에서는 추가로 이런 차이를 둡니다.

- 토큰: 웹은 `localStorage` / `sessionStorage`, 앱은 Capacitor Preferences
- 소셜 로그인: 시스템 브라우저 + `com.jointliving.app://oauth2/redirect` 딥링크
- 안전영역: `viewport-fit=cover`, `env(safe-area-inset-*)`, StatusBar / Keyboard 플러그인

---

## 🚀아키텍처

```text
[ Web (Vercel) ]                  [ iOS / Android (Capacitor) ]
        \                                /
         \                              /
          +-------- Vite dist ----------+
                       |
                       v
              Spring Boot API (OCI)
                       |
          Redis / RDB / Elasticsearch / FCM
