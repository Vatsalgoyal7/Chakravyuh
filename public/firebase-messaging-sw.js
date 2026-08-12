/* ── Chakravyuh 2K26 — Firebase Messaging Service Worker ───────────────── */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Config is injected at runtime via the main app's self.__FIREBASE_CONFIG
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    try {
      firebase.initializeApp(event.data.config);
      const messaging = firebase.messaging();

      // Handle background push messages (when tab is hidden/closed)
      messaging.onBackgroundMessage((payload) => {
        const title  = payload.notification?.title  || 'Chakravyuh 2K26';
        const body   = payload.notification?.body   || 'New message received';
        const icon   = payload.notification?.icon   || '/vite.svg';
        const badge  = '/vite.svg';

        self.registration.showNotification(title, {
          body,
          icon,
          badge,
          tag: 'chakravyuh-chat',
          renotify: true,
          data: payload.data || {},
        });
      });
    } catch (e) {
      // Config may already be initialized
    }
  }
});

// Notification click — focus the app tab or open it
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/admin/desk');
      }
    })
  );
});
