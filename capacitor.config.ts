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
