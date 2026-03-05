// فُصحى - Service Worker
// يتيح عمل التطبيق بدون إنترنت

const CACHE_NAME = 'fusha-v1.0';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Google Fonts — cached on first load
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Amiri+Quran&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap'
];

// ═══ تثبيت: تخزين الملفات الأساسية ═══
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ═══ تفعيل: حذف الكاش القديم ═══
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ═══ جلب: Cache First ثم Network ═══
self.addEventListener('fetch', event => {
  // تجاهل طلبات غير HTTP
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // لا نخزن ردوداً غير صحيحة
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          // نسخة للكاش ونسخة للمتصفح
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // إذا فشل الاتصال وكان طلب صفحة، أعد الصفحة الرئيسية
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// ═══ إشعارات الدفع (اختياري مستقبلاً) ═══
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || 'فُصحى', {
    body: data.body || 'كلمة جديدة في انتظارك!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    dir: 'rtl',
    lang: 'ar'
  });
});
