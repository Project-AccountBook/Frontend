import { useEffect } from 'react';
import { isPushEnabledInApp, PUSH_PREFERENCE_CHANGED_EVENT, resetFcmSession, setupFcm } from '../lib/fcm';

const POLL_INTERVAL_PUSH_ON_MS = 45_000;
const POLL_INTERVAL_PUSH_OFF_MS = 15_000;

/**
 * Keeps unread notification badge in sync via:
 * - FCM foreground messages (push enabled)
 * - Tab visibility / window focus
 * - Periodic polling (especially when push is off — no FCM delivery)
 */
export function useNotificationSync(
  isLoggedIn: boolean,
  refreshUnreadCount: () => void | Promise<void>
): void {
  useEffect(() => {
    if (!isLoggedIn) {
      resetFcmSession();
      return;
    }

    let fcmCleanup: (() => void) | undefined;
    let pollTimer: number | null = null;

    setupFcm(refreshUnreadCount).then((cleanup) => {
      fcmCleanup = cleanup;
    });

    const clearPoll = () => {
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const schedulePoll = () => {
      clearPoll();
      const delay = isPushEnabledInApp() ? POLL_INTERVAL_PUSH_ON_MS : POLL_INTERVAL_PUSH_OFF_MS;
      pollTimer = window.setTimeout(() => {
        void refreshUnreadCount();
        schedulePoll();
      }, delay);
    };

    schedulePoll();

    const handlePushPreferenceChange = () => {
      void refreshUnreadCount();
      schedulePoll();
    };

    window.addEventListener(PUSH_PREFERENCE_CHANGED_EVENT, handlePushPreferenceChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshUnreadCount();
      }
    };

    const handleFocus = () => {
      void refreshUnreadCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      fcmCleanup?.();
      clearPoll();
      window.removeEventListener(PUSH_PREFERENCE_CHANGED_EVENT, handlePushPreferenceChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoggedIn, refreshUnreadCount]);
}
