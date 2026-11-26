const CACHE_NAME = 'trilha-pg-ibam-pwa-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalação: armazena o shell principal no cache offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Ativação: remove versões antigas de cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Interceptação de rede: Network-First para o app e bypass para APIs dinâmicas
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignora requisições POST ou chamadas diretas à Gemini API e Firebase Firestore
  if (
    event.request.method !== 'GET' ||
    url.includes('generativelanguage.googleapis.com') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});