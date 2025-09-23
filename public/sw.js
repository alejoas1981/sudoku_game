const CACHE_NAME = 'sudoku-journal-v1';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/src/main.tsx',
    '/src/index.css',
    '/manifest.json',
    '/lang/ru.json',
    '/lang/en.json',
    '/lang/de.json',
    '/lang/fr.json',
    '/lang/es.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service worker installed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service worker installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests (API calls)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // Otherwise, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not successful
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone response for caching
                        const responseToCache = response.clone();

                        // Cache the new response
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                console.log('Caching new resource:', event.request.url);
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('Fetch failed:', error);

                        // For HTML requests, return offline page if available
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }

                        throw error;
                    });
            })
    );
});

// Background sync for saving game data
self.addEventListener('sync', (event) => {
    if (event.tag === 'save-game') {
        event.waitUntil(
            // Get saved game data from IndexedDB and sync to server
            syncGameData()
        );
    }
});

// Push notification handler
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body || 'Come back and finish your Sudoku puzzle!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: data.data || {},
            actions: [
                {
                    action: 'open',
                    title: 'Open Game'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Sudoku Journal', options)
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            self.clients.openWindow('/')
        );
    }
});

// Sync game data helper function
async function syncGameData() {
    try {
        // This would integrate with your game state management
        // to sync any pending changes to the server
        console.log('Syncing game data in background');

        // Implementation would depend on your specific data storage strategy
        // For example, getting data from IndexedDB and posting to API

    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Log service worker events for debugging
console.log('Sudoku Journal Service Worker loaded');