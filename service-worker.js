const CACHE_NAME = 'radio-pwa-cache-v1'; // Incrementa la versión si cambias los archivos cacheados
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'assets/images/logo.png',
  'assets/images/fondo.jpg',
  // Añade aquí todas las rutas de tus iconos de PWA
  'assets/icons/face.png',
  'assets/icons/ig.png',
  'assets/icons/whatsapp.png',
  'assets/icons/icon-72x72.png',
  'assets/icons/icon-96x96.png',
  'assets/icons/icon-128x128.png',
  'assets/icons/icon-144x144.png',
  'assets/icons/icon-152x152.png',
  'assets/icons/icon-192x192.png',
  'assets/icons/icon-384x384.png',
  'assets/icons/icon-512x512.png'
];

// Evento 'install': Se activa cuando el Service Worker se instala
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos estáticos');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': Se activa cada vez que la PWA intenta cargar un recurso
self.addEventListener('fetch', event => {
  // Ignorar las solicitudes de streaming de la radio para evitar cachear la transmisión en vivo
  if (event.request.url.includes('streaming2.locucionar.com')) {
    return; // No cachear ni interceptar el stream
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, lo devolvemos
        if (response) {
          return response;
        }
        // Si no está en caché, lo solicitamos a la red
        return fetch(event.request).catch(() => {
            // Si la red falla y el recurso es una página, podemos devolver una página offline (opcional)
            // return caches.match('offline.html'); // Requiere crear un offline.html
        });
      })
  );
});

// Evento 'activate': Se activa cuando el Service Worker se activa y toma el control
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});