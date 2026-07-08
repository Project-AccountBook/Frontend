export interface GeoCoords {
  latitude: number;
  longitude: number;
}

interface KakaoGeocodeResult {
  address_name: string;
  x: string; // longitude
  y: string; // latitude
}

type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

interface KakaoGeocoder {
  addressSearch: (
    query: string,
    callback: (result: KakaoGeocodeResult[], status: KakaoStatus) => void
  ) => void;
}

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (cb: () => void) => void;
        services: {
          Geocoder: new () => KakaoGeocoder;
          Status: { OK: 'OK'; ZERO_RESULT: 'ZERO_RESULT'; ERROR: 'ERROR' };
        };
      };
    };
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
let sdkLoadPromise: Promise<void> | null = null;

function loadKakaoMapsSdk(): Promise<void> {
  if (window.kakao?.maps?.services?.Geocoder) return Promise.resolve();
  if (!KAKAO_JS_KEY) {
    return Promise.reject(
      new Error('VITE_KAKAO_JS_KEY 환경변수가 설정되어 있지 않습니다.')
    );
  }
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao!.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error('Kakao Maps SDK를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/** 주소 문자열을 위경도로 변환. Daum Postcode 포맷의 `[우편번호] 주소` 접두어는 자동 제거. */
export async function geocodeAddress(address: string): Promise<GeoCoords | null> {
  const cleaned = address.replace(/^\[\d+\]\s*/, '').trim();
  if (!cleaned) return null;

  await loadKakaoMapsSdk();
  const geocoder = new window.kakao!.maps.services.Geocoder();

  return new Promise<GeoCoords | null>((resolve) => {
    geocoder.addressSearch(cleaned, (result, status) => {
      if (status !== window.kakao!.maps.services.Status.OK || result.length === 0) {
        resolve(null);
        return;
      }
      const top = result[0];
      resolve({ latitude: Number(top.y), longitude: Number(top.x) });
    });
  });
}
