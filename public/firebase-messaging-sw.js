/* eslint-disable no-undef */
importScripts('/firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

if (self.FIREBASE_CONFIG?.apiKey) {
  firebase.initializeApp(self.FIREBASE_CONFIG);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? '새 알림';
    const body = payload.notification?.body ?? '';
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      data: payload.data ?? {},
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const redirectUrl = event.notification.data?.redirectUrl;
  const tab = redirectUrl ? String(redirectUrl).replace(/^#\/?/, '').replace(/^\//, '') : '';
  const targetUrl = tab ? `${self.location.origin}/#${tab}` : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
