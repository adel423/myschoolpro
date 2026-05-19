const CACHE_NAME = 'messenger-pro-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// استراتيجية Cache First للسرعة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Push Notifications - لاستقبال الإشعارات حتى في الخلفية
self.addEventListener('push', event => {
  let data = { title: 'رسالة جديدة', body: 'لديك إشعار جديد' };
  if (event.data) {
    try { data = event.data.json(); } catch(e) {}
  }
  
  const options = {
    body: data.body,
    icon: 'https://ui-avatars.com/api/?name=MP&background=0084ff&color=fff&size=192',
    badge: 'https://ui-avatars.com/api/?name=MP&background=0084ff&color=fff&size=72',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' }
    ],
    requireInteraction: true,
    tag: 'msg-' + Date.now()
  };
  
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// النقر على الإشعار
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// استقبال رسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const options = {
      body: event.data.body,
      icon: 'https://ui-avatars.com/api/?name=MP&background=0084ff&color=fff&size=192',
      vibrate: [200, 100, 200],
      requireInteraction: true
    };
    self.registration.showNotification(event.data.title, options);
  }
});
