export interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  apartment: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => { open: () => void };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadDaumPostcodeScript(): Promise<void> {
  if (window.daum?.Postcode) {
    return Promise.resolve();
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('주소 검색 서비스를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export async function openAddressSearch(
  onComplete: (address: string) => void,
): Promise<void> {
  await loadDaumPostcodeScript();

  new window.daum!.Postcode({
    oncomplete: (data) => {
      let fullAddress = data.roadAddress || data.jibunAddress;
      if (data.buildingName) {
        fullAddress += fullAddress ? ` (${data.buildingName})` : data.buildingName;
      }
      const formatted = data.zonecode ? `[${data.zonecode}] ${fullAddress}` : fullAddress;
      onComplete(formatted);
    },
  }).open();
}
