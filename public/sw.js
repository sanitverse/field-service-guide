const CACHE_NAME = 'field-service-v1'
const STATIC_CACHE_NAME = 'field-service-static-v1'
const DYNAMIC_CACHE_NAME = 'field-service-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/tasks',
  '/dashboard/files',
  '/dashboard/search',
  '/dashboard/ai-assistant',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  // Fonts and icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache for offline access
const API_CACHE_PATTERNS = [
  '/api/tasks',
  '/api/files',
  '/api/auth/profile'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Ensure the service worker takes control immediately
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache with network first strategy
    event.respondWith(handleApiRequest(request))
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache first strategy
    event.respondWith(handleStaticAssets(request))
  } else {
    // Pages - network first with cache fallback
    event.respondWith(handlePageRequest(request))
  }
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses for read operations
    if (networkResponse.ok && (request.method === 'GET' || url.pathname.includes('/tasks'))) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', request.url)
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for specific endpoints
    if (url.pathname.includes('/tasks')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offline - cached data not available',
        offline: true,
        data: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw error
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(STATIC_CACHE_NAME)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Failed to fetch static asset', request.url)
    throw error
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful page responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed for page, trying cache', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/dashboard')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    throw error
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncOfflineTasks())
  }
  
  if (event.tag === 'sync-comments') {
    event.waitUntil(syncOfflineComments())
  }
})

// Sync offline tasks when connection is restored
async function syncOfflineTasks() {
  try {
    const offlineTasks = await getOfflineData('pending-tasks')
    
    for (const task of offlineTasks) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        })
        
        if (response.ok) {
          await removeOfflineData('pending-tasks', task.id)
          console.log('Service Worker: Synced offline task', task.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync task', task.id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync offline tasks', error)
  }
}

// Sync offline comments when connection is restored
async function syncOfflineComments() {
  try {
    const offlineComments = await getOfflineData('pending-comments')
    
    for (const comment of offlineComments) {
      try {
        const response = await fetch(`/api/tasks/${comment.taskId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(comment)
        })
        
        if (response.ok) {
          await removeOfflineData('pending-comments', comment.id)
          console.log('Service Worker: Synced offline comment', comment.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync comment', comment.id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync offline comments', error)
  }
}

// Helper functions for offline data management
async function getOfflineData(key) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const response = await cache.match(`/offline-data/${key}`)
    
    if (response) {
      const data = await response.json()
      return data.items || []
    }
    
    return []
  } catch (error) {
    console.error('Service Worker: Failed to get offline data', error)
    return []
  }
}

async function removeOfflineData(key, itemId) {
  try {
    const items = await getOfflineData(key)
    const filteredItems = items.filter(item => item.id !== itemId)
    
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    await cache.put(`/offline-data/${key}`, new Response(JSON.stringify({
      items: filteredItems,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    }))
  } catch (error) {
    console.error('Service Worker: Failed to remove offline data', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: 'You have new updates in Field Service Guide',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/dashboard'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  }
  
  if (event.data) {
    try {
      const payload = event.data.json()
      options.body = payload.body || options.body
      options.data.url = payload.url || options.data.url
    } catch (error) {
      console.error('Service Worker: Failed to parse push payload', error)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Field Service Guide', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/dashboard'
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
    )
  }
})