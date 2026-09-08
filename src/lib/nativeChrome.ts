import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { consumeBack } from './nativeBack';

function scrollFocusedInputIntoView() {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return;
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT') return;
  window.setTimeout(() => {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 50);
}

export async function initNativeChrome() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  } catch (err) {
    console.warn('StatusBar 초기화 실패:', err);
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    await Keyboard.setScroll({ isDisabled: false });
  } catch (err) {
    console.warn('Keyboard 초기화 실패:', err);
  }

  void Keyboard.addListener('keyboardDidShow', scrollFocusedInputIntoView);

  void CapacitorApp.addListener('backButton', () => {
    if (consumeBack()) return;
    void CapacitorApp.exitApp();
  });
}
