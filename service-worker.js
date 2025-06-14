// service-worker.js

// Nombre de la caché para los archivos estáticos. Incrementa la versión si cambias los archivos cacheados.
const CACHE_NAME = 'radio-pwa-cache-v1'; 

// Lista de URLs para cachear durante la instalación del Service Worker.
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

// Evento 'install': Se activa cuando el Service Worker se instala.
// Aquí se cachean los archivos estáticos y se fuerza la activación.
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando y cacheando archivos estáticos.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Forzar la activación del nuevo Service Worker
            .catch(error => {
                console.error('Service Worker: Falló la instalación o el cacheo.', error);
            })
    );
});

// Evento 'activate': Se activa cuando el Service Worker toma el control.
// Aquí se eliminan cachés antiguas y se reclama el control de los clientes.
self.addEventListener('activate', event => {
    console.log('Service Worker: Activado y limpiando cachés antiguas.');
    event.waitUntil(
        clients.claim() // Tomar control de las páginas existentes
            .then(() => {
                return caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => {
                            if (cacheName !== CACHE_NAME) {
                                console.log('Service Worker: Borrando caché antigua:', cacheName);
                                return caches.delete(cacheName);
                            }
                        })
                    );
                });
            })
            .catch(error => {
                console.error('Service Worker: Falló la activación o la limpieza de caché.', error);
            })
    );
});

// Evento 'fetch': Se activa cada vez que la PWA intenta cargar un recurso.
// Aquí se implementa la estrategia de cache-first para los recursos estáticos.
self.addEventListener('fetch', event => {
    // Ignorar las solicitudes de streaming de la radio para evitar cachear la transmisión en vivo.
    if (event.request.url.includes('streaming2.locucionar.com')) {
        return; // No cachear ni interceptar el stream.
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el recurso está en la caché, lo devolvemos.
                if (response) {
                    return response;
                }
                // Si no está en caché, lo solicitamos a la red.
                return fetch(event.request).catch(() => {
                    // Si la red falla y el recurso es una página, podemos devolver una página offline (opcional).
                    // return caches.match('offline.html'); // Requiere crear un offline.html
                    console.warn('Service Worker: Falló la solicitud de red para:', event.request.url);
                });
            })
    );
});

// Listener para el evento 'push' (cuando el servidor envía una notificación).
self.addEventListener('push', (event) => {
    console.log('Service Worker: Evento push recibido', event);
    // Se asume que el servidor envía un JSON en el payload de la notificación.
    const data = event.data.json(); 
    console.log('Datos de la notificación push:', data);

    const title = data.title || 'Nueva Notificación';
    const options = {
        body: data.body || 'Contenido de la notificación.',
        icon: data.icon || 'assets/icons/icon-192x192.png', // Usa un icono de tu PWA
        badge: 'assets/icons/icon-96x96.png', // Un icono más pequeño para la barra de estado (Android)
        image: data.image || undefined, // Opcional: una imagen grande en la notificación
        data: data.data || { url: '/' }, // Datos adicionales, como la URL a abrir al hacer clic
        actions: data.actions || [] // Opcional: botones de acción en la notificación
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Listener para el evento 'notificationclick' (cuando el usuario hace clic en la notificación).
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Clic en notificación', event);
    event.notification.close(); // Cerrar la notificación al hacer clic.

    // Obtener la URL a la que se debe navegar.
    const targetUrl = event.notification.data?.url || '/'; 

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                // Si la PWA ya está abierta en la URL deseada, la enfocamos.
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus(); 
                }
            }
            // Si la PWA no está abierta o no está en la URL deseada, abrir una nueva ventana/pestaña.
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

