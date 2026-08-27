import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jointliving.app',
  appName: 'MODI',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlaysWebView: true,
    },
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'localhost',
      '127.0.0.1',
      '10.0.2.2',
      'nid.naver.com',
      '*.naver.com',
      'kauth.kakao.com',
      'accounts.kakao.com',
      '*.kakao.com',
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com',
    ],
  },
};

export default config;
